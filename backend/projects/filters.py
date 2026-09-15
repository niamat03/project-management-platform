import django_filters

from .models import Project


class ProjectFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name='status')
    priority = django_filters.CharFilter(field_name='priority')

    class Meta:
        model = Project
        fields = ['status', 'priority']
