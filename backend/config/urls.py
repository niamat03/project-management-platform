from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/auth/', include('accounts.urls')),
    path('api/', include('projects.urls')),
    path('api/', include('tasks.urls')),
    path('api/', include('comments.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/', include('activity.urls')),
    path('api/', include('dashboard.urls')),
    path('api/geo/', include('geospatial.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
