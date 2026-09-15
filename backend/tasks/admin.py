from django.contrib import admin

from .models import Attachment, Tag, Task, TaskAssignee


class TaskAssigneeInline(admin.TabularInline):
    model = TaskAssignee
    extra = 0


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'status', 'priority', 'due_date', 'creator')
    list_filter = ('status', 'priority', 'project')
    search_fields = ('title', 'description')
    inlines = [TaskAssigneeInline]


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'color')


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ('filename', 'task', 'uploaded_by', 'uploaded_at')
