from rest_framework import serializers

from accounts.serializers import UserSummarySerializer

from .models import Activity


class ActivitySerializer(serializers.ModelSerializer):
    actor = UserSummarySerializer(read_only=True)

    class Meta:
        model = Activity
        fields = ['id', 'project', 'task', 'actor', 'verb', 'description', 'metadata', 'created_at']
        read_only_fields = fields
