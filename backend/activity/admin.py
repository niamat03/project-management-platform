from django.contrib import admin

from .models import Activity


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('project', 'task', 'actor', 'verb', 'created_at')
    list_filter = ('verb',)
