from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from projects.models import Project, ProjectMember
from projects.roles import MEMBER

from .models import Task, TaskAssignee

User = get_user_model()


class TaskWorkflowTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='owner', email='owner@example.com', password='pass12345')
        self.member = User.objects.create_user(username='member', email='member@example.com', password='pass12345')
        self.outsider = User.objects.create_user(username='outsider', email='outsider@example.com', password='pass12345')

        self.client.force_authenticate(user=self.owner)
        response = self.client.post('/api/projects/', {'name': 'Bridge Inspections'})
        self.project_id = response.data['id']
        self.board = Project.objects.get(pk=self.project_id).board
        self.columns = list(self.board.columns.order_by('position'))
        ProjectMember.objects.create(project_id=self.project_id, user=self.member, role=MEMBER)

    def test_project_member_can_create_task(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post('/api/tasks/', {'project': self.project_id, 'title': 'Inspect bridge 7'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        task = Task.objects.get(pk=response.data['id'])
        self.assertEqual(task.project_id, self.project_id)
        self.assertEqual(task.board_id, self.board.id)
        self.assertEqual(task.column_id, self.columns[0].id)

    def test_outsider_cannot_create_task(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.post('/api/tasks/', {'project': self.project_id, 'title': 'Should fail'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_outsider_cannot_see_task_in_list(self):
        self.client.force_authenticate(user=self.owner)
        created = self.client.post('/api/tasks/', {'project': self.project_id, 'title': 'Private task'})
        task_id = created.data['id']

        self.client.force_authenticate(user=self.outsider)
        response = self.client.get(f'/api/tasks/{task_id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_assign_user_who_is_not_project_member(self):
        self.client.force_authenticate(user=self.owner)
        created = self.client.post('/api/tasks/', {'project': self.project_id, 'title': 'Survey road'})
        task_id = created.data['id']

        response = self.client.post(f'/api/tasks/{task_id}/assign/', {'user_id': self.outsider.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(TaskAssignee.objects.filter(task_id=task_id, user=self.outsider).exists())

    def test_can_assign_project_member(self):
        self.client.force_authenticate(user=self.owner)
        created = self.client.post('/api/tasks/', {'project': self.project_id, 'title': 'Survey road'})
        task_id = created.data['id']

        response = self.client.post(f'/api/tasks/{task_id}/assign/', {'user_id': self.member.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(TaskAssignee.objects.filter(task_id=task_id, user=self.member).exists())

    def test_move_rejects_column_from_another_project(self):
        other_project = self.client.post('/api/projects/', {'name': 'Other project'}).data
        other_board = Project.objects.get(pk=other_project['id']).board
        other_column = other_board.columns.first()

        created = self.client.post('/api/tasks/', {'project': self.project_id, 'title': 'Move me'})
        task_id = created.data['id']

        response = self.client.post(f'/api/tasks/{task_id}/move/', {'column': other_column.id, 'position': 1})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_move_within_project_succeeds(self):
        created = self.client.post('/api/tasks/', {'project': self.project_id, 'title': 'Move me'})
        task_id = created.data['id']

        response = self.client.post(f'/api/tasks/{task_id}/move/', {'column': self.columns[1].id, 'position': 5})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task = Task.objects.get(pk=task_id)
        self.assertEqual(task.column_id, self.columns[1].id)
        self.assertEqual(task.position, 5)

    def test_member_without_manager_role_cannot_edit_task(self):
        created = self.client.post('/api/tasks/', {'project': self.project_id, 'title': 'Edit test'})
        task_id = created.data['id']

        self.client.force_authenticate(user=self.member)
        response = self.client.patch(f'/api/tasks/{task_id}/', {'title': 'Renamed'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
