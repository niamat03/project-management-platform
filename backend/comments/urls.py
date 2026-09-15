from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'tasks/(?P<task_pk>\d+)/comments', views.CommentViewSet, basename='task-comment')

urlpatterns = router.urls
