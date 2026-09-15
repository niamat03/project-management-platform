from django.urls import path

from . import views

urlpatterns = [
    path('projects/', views.GeoProjectsView.as_view(), name='geo-projects'),
    path('projects/<int:pk>/', views.GeoProjectDetailView.as_view(), name='geo-project-detail'),
    path('tasks/', views.GeoTasksView.as_view(), name='geo-tasks'),
    path('tasks/nearby/', views.NearbyTasksView.as_view(), name='geo-tasks-nearby'),
]
