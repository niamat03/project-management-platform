from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(
    r'projects/(?P<project_pk>\d+)/columns', views.BoardColumnViewSet, basename='board-column'
)

urlpatterns = router.urls
