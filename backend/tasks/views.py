from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from activity.models import ActivityVerb
from activity.services import log_activity
from notifications.models import NotificationType
from notifications.services import notify
from projects.models import BoardColumn, Project, ProjectMember
from projects.permissions import can_edit_task, get_role
from realtime.utils import broadcast_to_project

from .filters import TaskFilter
from .models import Attachment, Tag, Task, TaskAssignee
from .serializers import (
    AttachmentSerializer,
    TagSerializer,
    TaskDetailSerializer,
    TaskListSerializer,
    TaskMoveSerializer,
    TaskWriteSerializer,
)

User = get_user_model()


class TaskViewSet(viewsets.ModelViewSet):
    filterset_class = TaskFilter
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'priority', 'created_at', 'position']

    def get_queryset(self):
        user = self.request.user
        return (
            Task.objects.filter(project__members__user=user)
            .select_related('project', 'board', 'column', 'creator')
            .prefetch_related('assignees__user', 'tags')
            .distinct()
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return TaskListSerializer
        if self.action == 'retrieve':
            return TaskDetailSerializer
        return TaskWriteSerializer

    def _get_membership_or_403(self, project):
        role = get_role(self.request.user, project)
        return role

    def create(self, request, *args, **kwargs):
        project_id = request.data.get('project')
        project = get_object_or_404(Project, pk=project_id)
        if not get_role(request.user, project):
            return Response({'detail': 'You are not a member of this project.'},
                             status=status.HTTP_403_FORBIDDEN)

        column_id = request.data.get('column')
        if column_id:
            column = get_object_or_404(BoardColumn, pk=column_id, board__project=project)
        else:
            column = project.board.columns.order_by('position').first()

        serializer = self.get_serializer(data=request.data, context={**self.get_serializer_context(), 'project': project})
        serializer.is_valid(raise_exception=True)
        task = serializer.save(project=project, board=project.board, column=column, creator=request.user)

        log_activity(project, request.user, ActivityVerb.TASK_CREATED, task=task,
                     description=f'{request.user.username} created this task.')
        broadcast_to_project(project.id, 'task.created', TaskListSerializer(task, context={'request': request}).data)
        return Response(TaskDetailSerializer(task, context={'request': request}).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        task = self.get_object()
        if not can_edit_task(request.user, task.project):
            return Response({'detail': 'You do not have permission to edit this task.'},
                             status=status.HTTP_403_FORBIDDEN)

        old_status, old_priority = task.status, task.priority
        response = super().update(request, *args, **kwargs)
        task.refresh_from_db()

        if task.status != old_status:
            log_activity(task.project, request.user, ActivityVerb.TASK_STATUS_CHANGED, task=task,
                         description=f'{request.user.username} changed status to {task.status}.')
        if task.priority != old_priority:
            log_activity(task.project, request.user, ActivityVerb.TASK_PRIORITY_CHANGED, task=task,
                         description=f'{request.user.username} changed priority to {task.priority}.')
        if old_status != task.status and task.status == 'done':
            from django.utils import timezone
            task.completed_at = timezone.now()
            task.save(update_fields=['completed_at'])

        broadcast_to_project(task.project.id, 'task.updated',
                             TaskListSerializer(task, context={'request': request}).data)
        return response

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        if not can_edit_task(request.user, task.project):
            return Response({'detail': 'You do not have permission to delete this task.'},
                             status=status.HTTP_403_FORBIDDEN)
        project_id, task_id = task.project.id, task.id
        response = super().destroy(request, *args, **kwargs)
        broadcast_to_project(project_id, 'task.deleted', {'id': task_id})
        return response

    @action(detail=True, methods=['post'], url_path='move')
    def move(self, request, pk=None):
        """Drag-and-drop endpoint (section 16): backend re-checks authorization
        and owns the source of truth for the task's column/position."""
        task = self.get_object()
        if not get_role(request.user, task.project):
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TaskMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        column = serializer.validated_data['column']
        if column.board.project_id != task.project_id:
            return Response({'detail': 'Column does not belong to this task\'s project.'},
                             status=status.HTTP_400_BAD_REQUEST)

        old_column = task.column
        task.column = column
        task.position = serializer.validated_data['position']
        task.save(update_fields=['column', 'position'])

        if old_column_id := (old_column.id if old_column else None):
            if old_column_id != column.id:
                log_activity(task.project, request.user, ActivityVerb.TASK_MOVED, task=task,
                             description=f'{request.user.username} moved the task to {column.name}.')

        payload = TaskListSerializer(task, context={'request': request}).data
        broadcast_to_project(task.project.id, 'task.moved', payload)
        return Response(payload)

    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        task = self.get_object()
        if not can_edit_task(request.user, task.project):
            return Response({'detail': 'You do not have permission to assign this task.'},
                             status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get('user_id')
        target_user = get_object_or_404(User, pk=user_id)
        if not ProjectMember.objects.filter(project=task.project, user=target_user).exists():
            return Response({'detail': 'User must be a member of the project to be assigned.'},
                             status=status.HTTP_400_BAD_REQUEST)
        if TaskAssignee.objects.filter(task=task, user=target_user).exists():
            return Response({'detail': 'User is already assigned to this task.'},
                             status=status.HTTP_400_BAD_REQUEST)

        assignment = TaskAssignee.objects.create(task=task, user=target_user, assigned_by=request.user)
        log_activity(task.project, request.user, ActivityVerb.TASK_ASSIGNED, task=task,
                     description=f'{target_user.username} was assigned to this task.')
        notify(target_user, NotificationType.TASK_ASSIGNED,
               f'{request.user.username} assigned you to "{task.title}".',
               actor=request.user, project=task.project, task=task)
        broadcast_to_project(task.project.id, 'task.assigned',
                             {'task': task.id, 'user': target_user.id, 'assignment_id': assignment.id})
        return Response(TaskDetailSerializer(task, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='unassign')
    def unassign(self, request, pk=None):
        task = self.get_object()
        if not can_edit_task(request.user, task.project):
            return Response({'detail': 'You do not have permission to unassign this task.'},
                             status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get('user_id')
        assignment = get_object_or_404(TaskAssignee, task=task, user_id=user_id)
        removed_user = assignment.user
        assignment.delete()
        log_activity(task.project, request.user, ActivityVerb.TASK_UNASSIGNED, task=task,
                     description=f'{removed_user.username} was unassigned from this task.')
        broadcast_to_project(task.project.id, 'task.unassigned', {'task': task.id, 'user': removed_user.id})
        return Response(TaskDetailSerializer(task, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='attachments')
    def upload_attachment(self, request, pk=None):
        task = self.get_object()
        if not get_role(request.user, task.project):
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        attachment = Attachment.objects.create(
            task=task, file=file_obj, filename=file_obj.name, size=file_obj.size,
            uploaded_by=request.user,
        )
        return Response(AttachmentSerializer(attachment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='attachments/(?P<attachment_id>[^/.]+)')
    def delete_attachment(self, request, pk=None, attachment_id=None):
        task = self.get_object()
        attachment = get_object_or_404(Attachment, pk=attachment_id, task=task)
        if attachment.uploaded_by_id != request.user.id and not can_edit_task(request.user, task.project):
            return Response({'detail': 'You do not have permission to delete this attachment.'},
                             status=status.HTTP_403_FORBIDDEN)
        attachment.file.delete(save=False)
        attachment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TagViewSet(viewsets.ModelViewSet):
    """Tags are a small, complete picklist for the task tag picker - always
    return the full set for a project rather than paginating it."""
    serializer_class = TagSerializer
    pagination_class = None

    def get_project(self):
        return get_object_or_404(Project, pk=self.kwargs['project_pk'], members__user=self.request.user)

    def get_queryset(self):
        return Tag.objects.filter(project=self.get_project())

    def _check_manage_permission(self, project):
        from projects.permissions import can_manage_board
        return can_manage_board(self.request.user, project)

    def perform_create(self, serializer):
        project = self.get_project()
        if not self._check_manage_permission(project):
            raise PermissionDenied('You do not have permission to manage tags.')
        serializer.save(project=project)

    def perform_update(self, serializer):
        if not self._check_manage_permission(serializer.instance.project):
            raise PermissionDenied('You do not have permission to manage tags.')
        serializer.save()

    def perform_destroy(self, instance):
        if not self._check_manage_permission(instance.project):
            raise PermissionDenied('You do not have permission to manage tags.')
        instance.delete()
