from django.urls import path

from . import views

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('unread-count/', views.UnreadNotificationCountView.as_view(), name='notification-unread-count'),
    path('mark-all-read/', views.MarkAllNotificationsReadView.as_view(), name='notification-mark-all-read'),
    path('<int:pk>/mark-read/', views.MarkNotificationReadView.as_view(), name='notification-mark-read'),
]
