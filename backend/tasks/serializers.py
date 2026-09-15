from rest_framework import serializers

from accounts.serializers import UserSummarySerializer
from geospatial.serializers import SpatialFieldsMixinSerializer
from projects.models import BoardColumn

from .models import Attachment, Tag, Task, TaskAssignee


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'project', 'name', 'color']
        read_only_fields = ['id', 'project']


class TaskAssigneeSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)

    class Meta:
        model = TaskAssignee
        fields = ['id', 'user', 'assigned_at', 'assigned_by']
        read_only_fields = fields


class AttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSummarySerializer(read_only=True)

    class Meta:
        model = Attachment
        fields = ['id', 'task', 'file', 'filename', 'size', 'uploaded_by', 'uploaded_at']
        read_only_fields = ['id', 'task', 'uploaded_by', 'uploaded_at']


class TaskListSerializer(SpatialFieldsMixinSerializer, serializers.ModelSerializer):
    assignees = TaskAssigneeSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    creator = UserSummarySerializer(read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'board', 'column', 'creator', 'title', 'description',
            'priority', 'status', 'start_date', 'due_date', 'completed_at', 'position',
            'estimated_hours', 'actual_hours', 'progress', 'parent_task',
            'assignees', 'tags', 'created_at', 'updated_at', 'is_overdue',
            'location_name', 'spatial_type', 'geometry', 'location_visibility',
        ]

    def get_is_overdue(self, obj):
        from django.utils import timezone
        return bool(obj.due_date and obj.due_date < timezone.now().date() and obj.status != 'done')


class TaskDetailSerializer(TaskListSerializer):
    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta(TaskListSerializer.Meta):
        fields = TaskListSerializer.Meta.fields + ['attachments', 'address']


class TaskWriteSerializer(SpatialFieldsMixinSerializer, serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'id', 'project', 'board', 'column', 'title', 'description',
            'priority', 'status', 'start_date', 'due_date',
            'estimated_hours', 'actual_hours', 'progress', 'parent_task', 'tags',
            'position', 'location_name', 'address', 'spatial_type',
            'location_visibility', 'geometry',
        ]
        read_only_fields = ['id', 'project', 'board', 'column']

    def validate(self, attrs):
        tags = attrs.get('tags')
        instance_project = self.instance.project if self.instance else self.context.get('project')
        if tags and instance_project:
            mismatched = [t for t in tags if t.project_id != instance_project.id]
            if mismatched:
                raise serializers.ValidationError({'tags': 'Tags must belong to the same project as the task.'})
        parent = attrs.get('parent_task')
        if parent and instance_project and parent.project_id != instance_project.id:
            raise serializers.ValidationError({'parent_task': 'Parent task must belong to the same project.'})
        return attrs


class TaskMoveSerializer(serializers.Serializer):
    column = serializers.PrimaryKeyRelatedField(queryset=BoardColumn.objects.all())
    position = serializers.FloatField()
