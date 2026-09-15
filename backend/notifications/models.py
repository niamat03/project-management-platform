from django.conf import settings
from django.db import models

from projects.models import Project
from tasks.models import Task


class NotificationType(models.TextChoices):
    TASK_ASSIGNED = 'task_assigned', 'Task assigned to you'
    TASK_REASSIGNED = 'task_reassigned', 'Task reassigned'
    TASK_UNASSIGNED = 'task_unassigned', 'Task unassigned'
    NEW_COMMENT = 'new_comment', 'New comment'
    MENTION = 'mention', 'Mention'
    PROJECT_INVITATION = 'project_invitation', 'Project invitation'
    TASK_DEADLINE = 'task_deadline', 'Task deadline approaching'
    TASK_STATUS_CHANGED = 'task_status_changed', 'Task status changed'
    PROJECT_UPDATE = 'project_update', 'Project update'


class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='triggered_notifications',
    )
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    message = models.CharField(max_length=500)
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications'
    )
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications'
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', '-created_at']),
        ]

    def __str__(self):
        return f'Notification<{self.recipient}:{self.notification_type}>'
