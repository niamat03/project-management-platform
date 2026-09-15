from django.urls import path

from . import views

urlpatterns = [
    path('projects/<int:project_pk>/activity/', views.ProjectActivityListView.as_view(), name='project-activity'),
    path('tasks/<int:task_pk>/activity/', views.TaskActivityListView.as_view(), name='task-activity'),
]
