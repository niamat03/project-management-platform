from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='auth-register'),
    path('login/', views.LoginView.as_view(), name='auth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('me/', views.MeView.as_view(), name='auth-me'),
    path('me/profile/', views.UpdateProfileView.as_view(), name='auth-update-profile'),
    path('me/change-password/', views.ChangePasswordView.as_view(), name='auth-change-password'),
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='auth-password-reset'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='auth-password-reset-confirm'),
    path('users/search/', views.UserSearchView.as_view(), name='user-search'),
]
