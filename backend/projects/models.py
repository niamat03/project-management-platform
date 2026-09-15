from django.conf import settings
from django.db import models

from geospatial.models import SpatialMixin
from .roles import ROLE_CHOICES, MEMBER


class ProjectStatus(models.TextChoices):
    PLANNING = 'planning', 'Planning'
    ACTIVE = 'active', 'Active'
    ON_HOLD = 'on_hold', 'On Hold'
    COMPLETED = 'completed', 'Completed'
    ARCHIVED = 'archived', 'Archived'


class ProjectPriority(models.TextChoices):
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    CRITICAL = 'critical', 'Critical'


class Project(SpatialMixin, models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='owned_projects'
    )
    status = models.CharField(
        max_length=20, choices=ProjectStatus.choices, default=ProjectStatus.PLANNING
    )
    priority = models.CharField(
        max_length=20, choices=ProjectPriority.choices, default=ProjectPriority.MEDIUM
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['owner']),
        ]

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='project_memberships'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['project', 'user'], name='unique_project_member')
        ]
        ordering = ['joined_at']

    def __str__(self):
        return f'{self.user} @ {self.project} ({self.role})'


class Board(models.Model):
    """Each project has exactly one board (section 13)."""
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='board')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Board<{self.project.name}>'


class BoardColumn(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='columns')
    name = models.CharField(max_length=100)
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['position']
        constraints = [
            models.UniqueConstraint(fields=['board', 'position'], name='unique_column_position')
        ]

    def __str__(self):
        return f'{self.name} ({self.board.project.name})'
