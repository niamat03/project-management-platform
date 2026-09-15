from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Project, ProjectMember
from .roles import ADMIN, MEMBER, OWNER

User = get_user_model()


class ProjectCreationTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='owner', email='owner@example.com', password='pass12345')
        self.client.force_authenticate(user=self.owner)

    def test_create_project_sets_owner_membership_and_default_board(self):
        response = self.client.post('/api/projects/', {'name': 'Road Maintenance', 'status': 'active', 'priority': 'high'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        project = Project.objects.get(pk=response.data['id'])
        self.assertEqual(project.owner, self.owner)

        membership = ProjectMember.objects.get(project=project, user=self.owner)
        self.assertEqual(membership.role, OWNER)

        self.assertTrue(hasattr(project, 'board'))
        self.assertEqual(project.board.columns.count(), 5)


class ProjectPermissionTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='owner', email='owner@example.com', password='pass12345')
        self.member = User.objects.create_user(username='member', email='member@example.com', password='pass12345')
        self.outsider = User.objects.create_user(username='outsider', email='outsider@example.com', password='pass12345')

        self.client.force_authenticate(user=self.owner)
        response = self.client.post('/api/projects/', {'name': 'Survey Project'})
        self.project_id = response.data['id']
        ProjectMember.objects.create(project_id=self.project_id, user=self.member, role=MEMBER)

    def test_outsider_cannot_view_project(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.get(f'/api/projects/{self.project_id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_member_cannot_edit_project(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.patch(f'/api/projects/{self.project_id}/', {'name': 'Renamed'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_edit_project(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(f'/api/projects/{self.project_id}/', {'name': 'Renamed'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_member_cannot_delete_project(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.delete(f'/api/projects/{self.project_id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_member_without_admin_role_cannot_add_members(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(
            f'/api/projects/{self.project_id}/members/', {'user_id': self.outsider.id, 'role': MEMBER}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_add_member(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            f'/api/projects/{self.project_id}/members/', {'user_id': self.outsider.id, 'role': MEMBER}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_cannot_add_same_member_twice(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            f'/api/projects/{self.project_id}/members/', {'user_id': self.member.id, 'role': MEMBER}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_assign_owner_role_directly(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            f'/api/projects/{self.project_id}/members/', {'user_id': self.outsider.id, 'role': OWNER}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_manage_columns_but_member_cannot(self):
        ProjectMember.objects.filter(project_id=self.project_id, user=self.member).update(role=ADMIN)
        self.client.force_authenticate(user=self.member)
        response = self.client.post(f'/api/projects/{self.project_id}/columns/', {'name': 'Review', 'position': 5})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
