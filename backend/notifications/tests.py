from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from projects.models import ProjectMember
from projects.roles import MEMBER

from .models import Notification

User = get_user_model()


class NotificationTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='owner', email='owner@example.com', password='pass12345')
        self.member = User.objects.create_user(username='member', email='member@example.com', password='pass12345')

        self.client.force_authenticate(user=self.owner)
        project = self.client.post('/api/projects/', {'name': 'Notif Project'}).data
        ProjectMember.objects.create(project_id=project['id'], user=self.member, role=MEMBER)
        task = self.client.post('/api/tasks/', {'project': project['id'], 'title': 'Assign me'}).data
        self.task_id = task['id']

    def test_assignment_creates_notification_for_assignee_not_actor(self):
        self.client.post(f'/api/tasks/{self.task_id}/assign/', {'user_id': self.member.id})
        self.assertTrue(
            Notification.objects.filter(recipient=self.member, notification_type='task_assigned').exists()
        )
        self.assertFalse(
            Notification.objects.filter(recipient=self.owner, notification_type='task_assigned').exists()
        )

    def test_unread_count_and_mark_read(self):
        self.client.post(f'/api/tasks/{self.task_id}/assign/', {'user_id': self.member.id})

        self.client.force_authenticate(user=self.member)
        response = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(response.data['count'], 1)

        notification = Notification.objects.get(recipient=self.member)
        self.client.post(f'/api/notifications/{notification.id}/mark-read/')

        response = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(response.data['count'], 0)

    def test_user_cannot_see_others_notifications(self):
        self.client.post(f'/api/tasks/{self.task_id}/assign/', {'user_id': self.member.id})
        response = self.client.get('/api/notifications/')
        self.assertEqual(len(response.data['results']), 0)  # owner has no notifications of their own

    def test_mark_all_read(self):
        self.client.force_authenticate(user=self.owner)
        self.client.post('/api/projects/', {'name': 'Second project'})
        self.client.post(f'/api/tasks/{self.task_id}/assign/', {'user_id': self.member.id})

        self.client.force_authenticate(user=self.member)
        response = self.client.post('/api/notifications/mark-all-read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Notification.objects.filter(recipient=self.member, is_read=False).exists())
