from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from notifications.models import Notification
from projects.models import ProjectMember
from projects.roles import MEMBER

from .models import Comment

User = get_user_model()


class CommentTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='owner', email='owner@example.com', password='pass12345')
        self.member = User.objects.create_user(username='member', email='member@example.com', password='pass12345')
        self.outsider = User.objects.create_user(username='outsider', email='outsider@example.com', password='pass12345')

        self.client.force_authenticate(user=self.owner)
        project = self.client.post('/api/projects/', {'name': 'Comment Project'}).data
        self.project_id = project['id']
        ProjectMember.objects.create(project_id=self.project_id, user=self.member, role=MEMBER)

        task = self.client.post('/api/tasks/', {'project': self.project_id, 'title': 'Discuss'}).data
        self.task_id = task['id']

    def test_member_can_comment(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(f'/api/tasks/{self.task_id}/comments/', {'content': 'Looks good'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.get(pk=response.data['id']).author, self.member)

    def test_outsider_cannot_comment(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.post(f'/api/tasks/{self.task_id}/comments/', {'content': 'Sneaky'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_author_can_edit_own_comment(self):
        self.client.force_authenticate(user=self.member)
        created = self.client.post(f'/api/tasks/{self.task_id}/comments/', {'content': 'Original'}).data
        response = self.client.patch(f'/api/tasks/{self.task_id}/comments/{created["id"]}/', {'content': 'Edited'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_edited'])

    def test_other_member_cannot_edit_someone_elses_comment(self):
        self.client.force_authenticate(user=self.owner)
        created = self.client.post(f'/api/tasks/{self.task_id}/comments/', {'content': 'Owner comment'}).data

        self.client.force_authenticate(user=self.member)
        response = self.client.patch(f'/api/tasks/{self.task_id}/comments/{created["id"]}/', {'content': 'Hijacked'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_delete_others_comment(self):
        self.client.force_authenticate(user=self.member)
        created = self.client.post(f'/api/tasks/{self.task_id}/comments/', {'content': 'To be moderated'}).data

        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f'/api/tasks/{self.task_id}/comments/{created["id"]}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_mention_creates_notification(self):
        self.client.force_authenticate(user=self.owner)
        self.client.post(f'/api/tasks/{self.task_id}/comments/', {'content': f'Hey @{self.member.username} check this'})
        self.assertTrue(
            Notification.objects.filter(recipient=self.member, notification_type='mention').exists()
        )

    def test_assignee_notified_on_new_comment(self):
        self.client.force_authenticate(user=self.owner)
        self.client.post(f'/api/tasks/{self.task_id}/assign/', {'user_id': self.member.id})
        Notification.objects.filter(recipient=self.member).delete()  # clear assignment notification

        self.client.post(f'/api/tasks/{self.task_id}/comments/', {'content': 'New update here'})
        self.assertTrue(
            Notification.objects.filter(recipient=self.member, notification_type='new_comment').exists()
        )
