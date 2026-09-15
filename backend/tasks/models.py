from django.conf import settings
from django.db import models

from geospatial.models import SpatialMixin
from projects.models import Board, BoardColumn, Project


class TaskStatus(models.TextChoices):
    TODO = 'todo', 'To Do'
    IN_PROGRESS = 'in_progress', 'In Progress'
    IN_REVIEW = 'in_review', 'In Review'
    DONE = 'done', 'Done'
    BLOCKED = 'blocked', 'Blocked'


class TaskPriority(models.TextChoices):
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    CRITICAL = 'critical', 'Critical'


class Tag(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tags')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#6366F1')  # hex color

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['project', 'name'], name='unique_project_tag')
        ]

    def __str__(self):
        return self.name


class Task(SpatialMixin, models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='tasks')
    column = models.ForeignKey(
        BoardColumn, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_tasks'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    priority = models.CharField(max_length=20, choices=TaskPriority.choices, default=TaskPriority.MEDIUM)
    status = models.CharField(max_length=20, choices=TaskStatus.choices, default=TaskStatus.TODO)
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    position = models.FloatField(default=0)

    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    actual_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    progress = models.PositiveSmallIntegerField(default=0)  # 0-100
    parent_task = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subtasks'
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name='tasks')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['column', 'position']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['due_date']),
            models.Index(fields=['priority']),
        ]

    def __str__(self):
        return self.title


class TaskAssignee(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='assignees')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assigned_tasks'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assignments_made',
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['task', 'user'], name='unique_task_assignee')
        ]

    def __str__(self):
        return f'{self.user} -> {self.task}'


class Attachment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='attachments/%Y/%m/')
    filename = models.CharField(max_length=255)
    size = models.PositiveIntegerField(default=0)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='attachments'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.filename
