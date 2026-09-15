from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class DashboardTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='pm', email='pm@example.com', password='pass12345')
        self.client.force_authenticate(user=self.user)
        project = self.client.post('/api/projects/', {'name': 'Dashboard Project', 'status': 'active'}).data
        self.project_id = project['id']
        task = self.client.post('/api/tasks/', {'project': self.project_id, 'title': 'Do the thing'}).data
        self.task_id = task['id']

    def test_global_dashboard_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_global_dashboard_reflects_projects_and_tasks(self):
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['stats']['total_projects'], 1)
        self.assertEqual(response.data['stats']['active_projects'], 1)

    def test_project_dashboard_progress_updates_on_task_completion(self):
        response = self.client.get(f'/api/projects/{self.project_id}/dashboard/')
        self.assertEqual(response.data['task_stats']['total'], 1)
        self.assertEqual(response.data['progress'], 0.0)

        self.client.patch(f'/api/tasks/{self.task_id}/', {'status': 'done'})
        response = self.client.get(f'/api/projects/{self.project_id}/dashboard/')
        self.assertEqual(response.data['progress'], 100.0)

    def test_non_member_cannot_view_project_dashboard(self):
        outsider = User.objects.create_user(username='outsider', email='out@example.com', password='pass12345')
        self.client.force_authenticate(user=outsider)
        response = self.client.get(f'/api/projects/{self.project_id}/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
