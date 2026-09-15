from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from rest_framework_simplejwt.tokens import AccessToken

from config.asgi import application
from projects.models import ProjectMember
from projects.roles import MEMBER

User = get_user_model()


class ProjectSocketAuthTests(TransactionTestCase):
    # WebsocketCommunicator drives the ASGI app on a separate thread/event
    # loop with its own real DB connections, which is incompatible with
    # TestCase's per-test atomic transaction wrapper - TransactionTestCase
    # is required for any Channels test that touches the database.
    """Section 21/50: a WebSocket subscription must re-verify project
    membership server-side - the URL alone (a guessable project id) must
    never be enough to join a project's private event stream."""

    def setUp(self):
        self.owner = User.objects.create_user(username='owner', email='owner@example.com', password='pass12345')
        self.outsider = User.objects.create_user(username='outsider', email='out@example.com', password='pass12345')
        self.project = self._create_project()

    def _create_project(self):
        from projects.models import Board, BoardColumn, Project
        project = Project.objects.create(name='Realtime Project', owner=self.owner)
        ProjectMember.objects.create(project=project, user=self.owner, role='owner')
        board = Board.objects.create(project=project)
        BoardColumn.objects.create(board=board, name='Todo', position=0)
        return project

    async def test_connection_without_token_is_rejected(self):
        communicator = WebsocketCommunicator(application, f'/ws/projects/{self.project.id}/')
        connected, _ = await communicator.connect()
        self.assertFalse(connected)
        await communicator.disconnect()

    async def test_non_member_connection_is_rejected(self):
        token = str(AccessToken.for_user(self.outsider))
        communicator = WebsocketCommunicator(application, f'/ws/projects/{self.project.id}/?token={token}')
        connected, _ = await communicator.connect()
        self.assertFalse(connected)
        await communicator.disconnect()

    async def test_member_connection_is_accepted(self):
        token = str(AccessToken.for_user(self.owner))
        communicator = WebsocketCommunicator(application, f'/ws/projects/{self.project.id}/?token={token}')
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()
