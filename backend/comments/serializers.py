from rest_framework import serializers

from accounts.serializers import UserSummarySerializer

from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'task', 'author', 'content', 'created_at', 'updated_at', 'is_edited']
        read_only_fields = ['id', 'task', 'author', 'created_at', 'updated_at', 'is_edited']
