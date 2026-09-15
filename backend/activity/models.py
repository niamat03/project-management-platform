from django.conf import settings
from django.db import models

from projects.models import Project
from tasks.models import Task


class ActivityVerb(models.TextChoices):
    PROJECT_CREATED = 'project_created', 'created the project'
    MEMBER_ADDED = 'member_added', 'added a member'
    MEMBER_REMOVED = 'member_removed', 'removed a member'
    MEMBER_ROLE_CHANGED = 'member_role_changed', 'changed a member role'
    BOARD_COLUMN_CREATED = 'column_created', 'created a column'
    TASK_CREATED = 'task_created', 'created this task'
    TASK_UPDATED = 'task_updated', 'updated this task'
    TASK_MOVED = 'task_moved', 'moved the task'
    TASK_ASSIGNED = 'task_assigned', 'was assigned to this task'
    TASK_UNASSIGNED = 'task_unassigned', 'was unassigned from this task'
    TASK_STATUS_CHANGED = 'task_status_changed', 'changed the status'
    TASK_PRIORITY_CHANGED = 'task_priority_changed', 'changed the priority'
    TASK_COMPLETED = 'task_completed', 'completed this task'
    COMMENT_ADDED = 'comment_added', 'commented on this task'


class Activity(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='activities')
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE, related_name='activities', null=True, blank=True
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='activities'
    )
    verb = models.CharField(max_length=40, choices=ActivityVerb.choices)
    description = models.CharField(max_length=500, blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'activities'
        indexes = [
            models.Index(fields=['project', '-created_at']),
            models.Index(fields=['task', '-created_at']),
        ]

    def __str__(self):
        return f'{self.actor} {self.verb} ({self.project})'
