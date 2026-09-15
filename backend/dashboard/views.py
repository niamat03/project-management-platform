from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from activity.models import Activity
from activity.serializers import ActivitySerializer
from notifications.models import Notification
from notifications.serializers import NotificationSerializer
from projects.models import Project
from tasks.models import Task
from tasks.serializers import TaskListSerializer


class GlobalDashboardView(APIView):
    """Section 22: the landing dashboard aggregating a user's whole workload."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        my_projects = Project.objects.filter(members__user=user).distinct()
        my_tasks = Task.objects.filter(assignees__user=user).distinct()

        due_today = my_tasks.filter(due_date=today).exclude(status='done')
        upcoming = my_tasks.filter(due_date__gt=today, due_date__lte=today + timezone.timedelta(days=7)).exclude(status='done')
        overdue = my_tasks.filter(due_date__lt=today).exclude(status='done')

        recent_activity = Activity.objects.filter(project__in=my_projects).select_related(
            'actor', 'actor__profile'
        )[:20]
        notifications = Notification.objects.filter(recipient=user)[:10]

        stats = {
            'total_projects': my_projects.count(),
            'active_projects': my_projects.filter(status='active').count(),
            'completed_projects': my_projects.filter(status='completed').count(),
            'total_tasks': my_tasks.count(),
            'completed_tasks': my_tasks.filter(status='done').count(),
            'overdue_tasks': overdue.count(),
        }

        ctx = {'request': request}
        return Response({
            'stats': stats,
            'my_projects': [{'id': p.id, 'name': p.name, 'status': p.status, 'priority': p.priority} for p in my_projects[:10]],
            'due_today': TaskListSerializer(due_today, many=True, context=ctx).data,
            'upcoming_deadlines': TaskListSerializer(upcoming, many=True, context=ctx).data,
            'overdue_tasks': TaskListSerializer(overdue, many=True, context=ctx).data,
            'recent_activity': ActivitySerializer(recent_activity, many=True).data,
            'notifications': NotificationSerializer(notifications, many=True).data,
        })


class ProjectDashboardView(APIView):
    """Section 23: per-project overview with progress and distributions."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_pk):
        project = get_object_or_404(Project, pk=project_pk, members__user=request.user)
        today = timezone.now().date()
        tasks = Task.objects.filter(project=project)

        total = tasks.count()
        completed = tasks.filter(status='done').count()
        progress = round((completed / total) * 100, 1) if total else 0.0

        status_distribution = list(tasks.values('status').annotate(count=Count('id')).order_by('status'))
        priority_distribution = list(tasks.values('priority').annotate(count=Count('id')).order_by('priority'))

        upcoming = tasks.filter(due_date__gte=today).exclude(status='done').order_by('due_date')[:10]
        overdue = tasks.filter(due_date__lt=today).exclude(status='done').order_by('due_date')

        recent_activity = Activity.objects.filter(project=project).select_related('actor', 'actor__profile')[:20]

        ctx = {'request': request}
        return Response({
            'project': {'id': project.id, 'name': project.name, 'status': project.status},
            'progress': progress,
            'task_stats': {'total': total, 'completed': completed, 'overdue': overdue.count()},
            'status_distribution': status_distribution,
            'priority_distribution': priority_distribution,
            'member_count': project.members.count(),
            'upcoming_deadlines': TaskListSerializer(upcoming, many=True, context=ctx).data,
            'overdue_tasks': TaskListSerializer(overdue, many=True, context=ctx).data,
            'recent_activity': ActivitySerializer(recent_activity, many=True).data,
        })
