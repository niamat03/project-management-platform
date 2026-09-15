from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    ChangePasswordSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
    UserSerializer,
    UserSummarySerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'auth'


class LoginView(TokenObtainPairView):
    """Thin wrapper so the auth scope throttle applies to login attempts."""
    throttle_scope = 'auth'


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UpdateProfileView(generics.UpdateAPIView):
    serializer_class = UpdateProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password updated successfully.'})


class PasswordResetRequestView(APIView):
    """Always answers with a generic 200 - whether or not the email matches
    an account - so this endpoint can't be used to enumerate registered
    users. The actual reset link is only ever sent to a matching address."""
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        user = User.objects.filter(email__iexact=email).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f'{settings.FRONTEND_URL}/reset-password/{uid}/{token}/'
            send_mail(
                subject='Reset your Selena password',
                message=(
                    f'Hi {user.username},\n\n'
                    f'Click the link below to choose a new password. This link expires soon '
                    f'and can only be used once.\n\n{reset_url}\n\n'
                    f"If you didn't request this, you can safely ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )

        return Response({'detail': 'If that email is registered, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            user_id = urlsafe_base64_decode(data['uid']).decode()
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({'detail': 'This reset link is invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, data['token']):
            return Response({'detail': 'This reset link is invalid or has expired.'},
                             status=status.HTTP_400_BAD_REQUEST)

        user.set_password(data['new_password'])
        user.save()
        return Response({'detail': 'Password reset successfully. You can now sign in.'})


class UserSearchView(generics.ListAPIView):
    """Used by the frontend to find users to invite/assign (section 26)."""
    serializer_class = UserSummarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get('q', '').strip()
        qs = User.objects.all().select_related('profile')
        if query:
            from django.db.models import Q
            qs = qs.filter(
                Q(username__icontains=query) | Q(first_name__icontains=query)
                | Q(last_name__icontains=query) | Q(email__icontains=query)
            )
        return qs.order_by('username')[:20]
