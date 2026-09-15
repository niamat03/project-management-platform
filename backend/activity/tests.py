from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Activity

User = get_user_model()


class ActivityLogTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='owner', email='owner@example.com', password='pass12345')
        self.client.force_authenticate(user=self.owner)

    def test_creating_project_logs_activity(self):
        project = self.client.post('/api/projects/', {'name': 'Logged Project'}).data
        self.assertTrue(Activity.objects.filter(project_id=project['id'], verb='project_created').exists())

    def test_task_lifecycle_logs_activity(self):
        project = self.client.post('/api/projects/', {'name': 'Lifecycle Project'}).data
        task = self.client.post('/api/tasks/', {'project': project['id'], 'title': 'Track me'}).data

        self.assertTrue(Activity.objects.filter(task_id=task['id'], verb='task_created').exists())

        self.client.patch(f'/api/tasks/{task["id"]}/', {'status': 'in_progress'})
        self.assertTrue(Activity.objects.filter(task_id=task['id'], verb='task_status_changed').exists())

    def test_outsider_cannot_view_project_activity(self):
        project = self.client.post('/api/projects/', {'name': 'Private Activity'}).data
        outsider = User.objects.create_user(username='outsider', email='out@example.com', password='pass12345')
        self.client.force_authenticate(user=outsider)
        response = self.client.get(f'/api/projects/{project["id"]}/activity/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
