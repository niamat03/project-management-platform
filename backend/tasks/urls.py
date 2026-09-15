from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'projects/(?P<project_pk>\d+)/tags', views.TagViewSet, basename='project-tag')

urlpatterns = router.urls
