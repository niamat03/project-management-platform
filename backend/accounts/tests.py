from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthTests(APITestCase):
    def test_register_creates_user_with_hashed_password(self):
        response = self.client.post('/api/auth/register/', {
            'username': 'alice', 'email': 'alice@example.com', 'password': 'StrongPass123!',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='alice')
        self.assertNotEqual(user.password, 'StrongPass123!')
        self.assertTrue(user.check_password('StrongPass123!'))

    def test_register_creates_profile_automatically(self):
        self.client.post('/api/auth/register/', {
            'username': 'bob', 'email': 'bob@example.com', 'password': 'StrongPass123!',
        })
        user = User.objects.get(username='bob')
        self.assertTrue(hasattr(user, 'profile'))

    def test_login_returns_jwt_pair(self):
        User.objects.create_user(username='carol', email='carol@example.com', password='StrongPass123!')
        response = self.client.post('/api/auth/login/', {'username': 'carol', 'password': 'StrongPass123!'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_rejects_wrong_password(self):
        User.objects.create_user(username='dave', email='dave@example.com', password='StrongPass123!')
        response = self.client.post('/api/auth/login/', {'username': 'dave', 'password': 'wrong'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_requires_authentication(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_current_user(self):
        user = User.objects.create_user(username='erin', email='erin@example.com', password='StrongPass123!')
        self.client.force_authenticate(user=user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'erin')
