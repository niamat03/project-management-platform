from django.urls import path

from . import views

urlpatterns = [
    path('dashboard/', views.GlobalDashboardView.as_view(), name='dashboard-global'),
    path('projects/<int:project_pk>/dashboard/', views.ProjectDashboardView.as_view(), name='dashboard-project'),
]
