import re

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.response import Response

from activity.models import ActivityVerb
from activity.services import log_activity
from notifications.models import NotificationType
from notifications.services import notify
from projects.permissions import get_role, role_at_least
from projects.roles import ADMIN
from realtime.utils import broadcast_to_project
from tasks.models import Task

from .models import Comment
from .serializers import CommentSerializer

User = get_user_model()
MENTION_RE = re.compile(r'@(\w+)')


class CommentViewSet(viewsets.ModelViewSet):
    """Comment threads are rendered in full (no pagination UI in the task
    detail panel), so disable the global paginator - matching TagViewSet's
    same reasoning for a small, complete list."""
    serializer_class = CommentSerializer
    pagination_class = None

    def get_task(self):
        return get_object_or_404(
            Task, pk=self.kwargs['task_pk'], project__members__user=self.request.user
        )

    def get_queryset(self):
        return Comment.objects.filter(task=self.get_task()).select_related('author', 'author__profile')

    def create(self, request, *args, **kwargs):
        task = self.get_task()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(task=task, author=request.user)

        log_activity(task.project, request.user, ActivityVerb.COMMENT_ADDED, task=task,
                     description=f'{request.user.username} commented on this task.')

        assignee_ids = set(task.assignees.values_list('user_id', flat=True))
        for uid in assignee_ids - {request.user.id}:
            recipient = User.objects.filter(pk=uid).first()
            if recipient:
                notify(recipient, NotificationType.NEW_COMMENT,
                       f'{request.user.username} commented on "{task.title}".',
                       actor=request.user, project=task.project, task=task)

        for username in set(MENTION_RE.findall(comment.content)):
            mentioned = User.objects.filter(username=username).first()
            if mentioned and mentioned.id != request.user.id and get_role(mentioned, task.project):
                notify(mentioned, NotificationType.MENTION,
                       f'{request.user.username} mentioned you in "{task.title}".',
                       actor=request.user, project=task.project, task=task)

        payload = CommentSerializer(comment).data
        broadcast_to_project(task.project.id, 'comment.created', payload)
        return Response(payload, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.author_id != request.user.id:
            return Response({'detail': 'You can only edit your own comments.'},
                             status=status.HTTP_403_FORBIDDEN)
        comment.content = request.data.get('content', comment.content)
        comment.is_edited = True
        comment.save(update_fields=['content', 'is_edited', 'updated_at'])
        payload = CommentSerializer(comment).data
        broadcast_to_project(comment.task.project.id, 'comment.updated', payload)
        return Response(payload)

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        role = get_role(request.user, comment.task.project)
        if comment.author_id != request.user.id and not role_at_least(role, ADMIN):
            return Response({'detail': 'You do not have permission to delete this comment.'},
                             status=status.HTTP_403_FORBIDDEN)
        project_id, comment_id = comment.task.project.id, comment.id
        comment.delete()
        broadcast_to_project(project_id, 'comment.deleted', {'id': comment_id})
        return Response(status=status.HTTP_204_NO_CONTENT)
