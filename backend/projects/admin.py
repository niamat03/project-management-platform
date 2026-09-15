from django.contrib import admin

from .models import Board, BoardColumn, Project, ProjectMember


class ProjectMemberInline(admin.TabularInline):
    model = ProjectMember
    extra = 0


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'status', 'priority', 'created_at')
    list_filter = ('status', 'priority')
    search_fields = ('name', 'description')
    inlines = [ProjectMemberInline]


@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = ('project', 'created_at')


@admin.register(BoardColumn)
class BoardColumnAdmin(admin.ModelAdmin):
    list_display = ('name', 'board', 'position')
    list_filter = ('board',)
