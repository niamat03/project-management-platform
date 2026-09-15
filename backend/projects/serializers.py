from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.serializers import UserSummarySerializer
from geospatial.serializers import SpatialFieldsMixinSerializer

from .models import Board, BoardColumn, Project, ProjectMember
from .roles import OWNER

User = get_user_model()


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )

    class Meta:
        model = ProjectMember
        fields = ['id', 'user', 'user_id', 'role', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class BoardColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardColumn
        fields = ['id', 'board', 'name', 'position', 'created_at']
        read_only_fields = ['id', 'board', 'created_at']


class BoardSerializer(serializers.ModelSerializer):
    columns = BoardColumnSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = ['id', 'project', 'columns', 'created_at']
        read_only_fields = ['id', 'project', 'created_at']


class ProjectListSerializer(SpatialFieldsMixinSerializer, serializers.ModelSerializer):
    owner = UserSummarySerializer(read_only=True)
    member_count = serializers.IntegerField(read_only=True)
    task_count = serializers.IntegerField(read_only=True)
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'owner', 'status', 'priority',
            'start_date', 'end_date', 'created_at', 'updated_at',
            'member_count', 'task_count', 'my_role',
            'location_name', 'spatial_type', 'geometry', 'location_visibility',
        ]

    def get_my_role(self, obj):
        user = self.context['request'].user
        membership = obj.members.filter(user=user).first()
        return membership.role if membership else None


class ProjectDetailSerializer(ProjectListSerializer):
    members = ProjectMemberSerializer(many=True, read_only=True)

    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + ['members', 'address']


class ProjectWriteSerializer(SpatialFieldsMixinSerializer, serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status', 'priority',
            'start_date', 'end_date',
            'location_name', 'address', 'spatial_type', 'location_visibility',
            'geometry',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        request = self.context['request']
        validated_data['owner'] = request.user
        project = super().create(validated_data)
        ProjectMember.objects.create(project=project, user=request.user, role=OWNER)
        Board.objects.create(project=project)
        default_columns = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done']
        for i, name in enumerate(default_columns):
            BoardColumn.objects.create(board=project.board, name=name, position=i)
        return project
