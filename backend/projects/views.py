from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from activity.models import ActivityVerb
from activity.services import log_activity
from notifications.models import NotificationType
from notifications.services import notify

from .filters import ProjectFilter
from .models import Board, BoardColumn, Project, ProjectMember
from .permissions import can_manage_board, can_manage_members, get_role, is_owner
from .roles import ADMIN, OWNER, ROLE_RANK, role_at_least
from .serializers import (
    BoardColumnSerializer,
    BoardSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
    ProjectMemberSerializer,
    ProjectWriteSerializer,
)

User = get_user_model()


class ProjectViewSet(viewsets.ModelViewSet):
    """CRUD for projects. Every non-read action re-verifies role server-side."""
    filterset_class = ProjectFilter
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name', 'priority', 'status']

    def get_queryset(self):
        user = self.request.user
        # Two-step filter: annotating Count('members'/'tasks') directly on a
        # queryset already filtered by `members__user=user` would reuse that
        # same join, so the counts would only reflect the current user's own
        # membership row instead of the project's real totals.
        member_project_ids = Project.objects.filter(members__user=user).values_list('id', flat=True)
        return (
            Project.objects.filter(id__in=member_project_ids)
            .select_related('owner')
            .annotate(member_count=Count('members', distinct=True), task_count=Count('tasks', distinct=True))
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectWriteSerializer

    def perform_create(self, serializer):
        project = serializer.save()
        log_activity(project, self.request.user, ActivityVerb.PROJECT_CREATED,
                     description=f'{self.request.user.username} created the project.')

    def get_object(self):
        obj = get_object_or_404(self.get_queryset(), pk=self.kwargs['pk'])
        return obj

    def update(self, request, *args, **kwargs):
        project = self.get_object()
        role = get_role(request.user, project)
        if not role_at_least(role, ADMIN):
            return Response({'detail': 'Only admins or the owner can edit this project.'},
                             status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        project = self.get_object()
        if not is_owner(request.user, project):
            return Response({'detail': 'Only the owner can delete this project.'},
                             status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'], url_path='board')
    def board(self, request, pk=None):
        project = self.get_object()
        return Response(BoardSerializer(project.board).data)

    @action(detail=True, methods=['get', 'post'], url_path='members')
    def members(self, request, pk=None):
        project = self.get_object()
        if request.method == 'GET':
            qs = project.members.select_related('user', 'user__profile')
            return Response(ProjectMemberSerializer(qs, many=True).data)

        if not can_manage_members(request.user, project):
            return Response({'detail': 'You do not have permission to add members.'},
                             status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get('user_id')
        role = request.data.get('role', 'member')
        if role == OWNER:
            return Response({'detail': 'Cannot assign the owner role directly.'},
                             status=status.HTTP_400_BAD_REQUEST)
        if role not in ROLE_RANK:
            return Response({'detail': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)

        target_user = get_object_or_404(User, pk=user_id)
        if ProjectMember.objects.filter(project=project, user=target_user).exists():
            return Response({'detail': 'User is already a member of this project.'},
                             status=status.HTTP_400_BAD_REQUEST)

        membership = ProjectMember.objects.create(project=project, user=target_user, role=role)
        log_activity(project, request.user, ActivityVerb.MEMBER_ADDED,
                     description=f'{request.user.username} added {target_user.username} to the project.')
        notify(target_user, NotificationType.PROJECT_INVITATION,
               f'{request.user.username} added you to project "{project.name}".',
               actor=request.user, project=project)
        return Response(ProjectMemberSerializer(membership).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch', 'delete'], url_path='members/(?P<member_id>[^/.]+)')
    def member_detail(self, request, pk=None, member_id=None):
        project = self.get_object()
        membership = get_object_or_404(ProjectMember, project=project, pk=member_id)

        if not can_manage_members(request.user, project):
            return Response({'detail': 'You do not have permission to manage members.'},
                             status=status.HTTP_403_FORBIDDEN)
        if membership.role == OWNER:
            return Response({'detail': 'The owner cannot be modified or removed.'},
                             status=status.HTTP_400_BAD_REQUEST)

        if request.method == 'DELETE':
            username = membership.user.username
            membership.delete()
            log_activity(project, request.user, ActivityVerb.MEMBER_REMOVED,
                         description=f'{request.user.username} removed {username} from the project.')
            return Response(status=status.HTTP_204_NO_CONTENT)

        new_role = request.data.get('role')
        if new_role == OWNER or new_role not in ROLE_RANK:
            return Response({'detail': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)
        membership.role = new_role
        membership.save(update_fields=['role'])
        log_activity(project, request.user, ActivityVerb.MEMBER_ROLE_CHANGED,
                     description=f'{request.user.username} changed {membership.user.username} role to {new_role}.')
        return Response(ProjectMemberSerializer(membership).data)


class BoardColumnViewSet(viewsets.ModelViewSet):
    serializer_class = BoardColumnSerializer

    def get_project(self):
        return get_object_or_404(Project, pk=self.kwargs['project_pk'], members__user=self.request.user)

    def get_queryset(self):
        project = self.get_project()
        return BoardColumn.objects.filter(board__project=project)

    def _check_manage_permission(self, project):
        if not can_manage_board(self.request.user, project):
            return False
        return True

    def create(self, request, *args, **kwargs):
        project = self.get_project()
        if not self._check_manage_permission(project):
            return Response({'detail': 'You do not have permission to manage the board.'},
                             status=status.HTTP_403_FORBIDDEN)
        data = request.data.copy()
        data['board'] = project.board.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(board=project.board)
        log_activity(project, request.user, ActivityVerb.BOARD_COLUMN_CREATED,
                     description=f'{request.user.username} created column "{serializer.data["name"]}".')
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        project = self.get_project()
        if not self._check_manage_permission(project):
            return Response({'detail': 'You do not have permission to manage the board.'},
                             status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        project = self.get_project()
        if not self._check_manage_permission(project):
            return Response({'detail': 'You do not have permission to manage the board.'},
                             status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
