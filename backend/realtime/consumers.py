import json

from channels.generic.websocket import AsyncJsonWebsocketConsumer

from projects.models import ProjectMember


class ProjectConsumer(AsyncJsonWebsocketConsumer):
    """One socket per browser tab viewing a project.

    Membership is re-verified against the database on connect (never trust
    the URL alone, per section 21/50) so a user cannot subscribe to a
    project's private events just by guessing its id.
    """

    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        user = self.scope['user']

        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return

        self.role = await self.get_role(user.id, self.project_id)
        if not self.role:
            await self.close(code=4403)
            return

        self.project_group = f'project_{self.project_id}'
        self.user_group = f'user_{user.id}'
        await self.channel_layer.group_add(self.project_group, self.channel_name)
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'project_group'):
            await self.channel_layer.group_discard(self.project_group, self.channel_name)
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)

    async def broadcast_event(self, event):
        await self.send_json({'event': event['event'], 'payload': self._scoped_payload(event['payload'])})

    def _scoped_payload(self, payload):
        """Re-check location_visibility against THIS connection's own role.

        A single broadcast payload is shared by every socket in the project
        group (see realtime/utils.broadcast_to_project), but it was
        serialized once from the acting user's point of view. Without this,
        a task/project with a "private" (admin-only) location would still
        leak its geometry/name to a Member-level socket in the same group,
        even though the plain REST endpoints correctly hide it per-request
        (section 41).
        """
        if not isinstance(payload, dict) or 'location_visibility' not in payload:
            return payload

        from projects.roles import ADMIN, role_at_least
        from geospatial.models import LocationVisibility

        visibility = payload.get('location_visibility')
        visible = visibility != LocationVisibility.PRIVATE or role_at_least(self.role, ADMIN)
        if visible:
            return payload

        payload = dict(payload)
        payload['geometry'] = None
        payload['location_name'] = ''
        if 'address' in payload:
            payload['address'] = ''
        return payload

    @staticmethod
    async def get_role(user_id, project_id):
        from channels.db import database_sync_to_async

        @database_sync_to_async
        def fetch():
            member = ProjectMember.objects.filter(
                project_id=project_id, user_id=user_id
            ).only('role').first()
            return member.role if member else None

        return await fetch()
