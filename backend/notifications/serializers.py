from rest_framework import serializers

from accounts.serializers import UserSummarySerializer

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor = UserSummarySerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'actor', 'notification_type', 'message', 'project', 'task',
            'is_read', 'created_at',
        ]
        read_only_fields = fields
