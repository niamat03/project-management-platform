import django_filters
from django.utils import timezone

from .models import Task


class TaskFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name='status')
    priority = django_filters.CharFilter(field_name='priority')
    project = django_filters.NumberFilter(field_name='project_id')
    assignee = django_filters.NumberFilter(field_name='assignees__user_id')
    due_before = django_filters.DateFilter(field_name='due_date', lookup_expr='lte')
    due_after = django_filters.DateFilter(field_name='due_date', lookup_expr='gte')
    overdue = django_filters.BooleanFilter(method='filter_overdue')

    class Meta:
        model = Task
        fields = ['status', 'priority', 'project', 'assignee']

    def filter_overdue(self, queryset, name, value):
        if not value:
            return queryset
        today = timezone.now().date()
        return queryset.filter(due_date__lt=today).exclude(status='done')
