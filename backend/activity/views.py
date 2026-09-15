from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions

from projects.models import Project
from tasks.models import Task

from .models import Activity
from .serializers import ActivitySerializer


class ProjectActivityListView(generics.ListAPIView):
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project = get_object_or_404(Project, pk=self.kwargs['project_pk'], members__user=self.request.user)
        return Activity.objects.filter(project=project).select_related('actor', 'actor__profile')


class TaskActivityListView(generics.ListAPIView):
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        task = get_object_or_404(
            Task, pk=self.kwargs['task_pk'], project__members__user=self.request.user
        )
        return Activity.objects.filter(task=task).select_related('actor', 'actor__profile')
