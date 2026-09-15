"""Helpers for pushing server-side events onto WebSocket groups.

Two group namespaces are used:
- `project_<id>`   -> everyone currently viewing that project (task/board/
                      comment/activity/membership events). Only project
                      members are ever allowed to join this group (enforced
                      in realtime/consumers.py), so nothing here needs to
                      re-check membership before broadcasting.
- `user_<id>`      -> a single user's personal notification stream.
"""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def _send(group, event_type, payload):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    async_to_sync(channel_layer.group_send)(
        group,
        {'type': 'broadcast.event', 'event': event_type, 'payload': payload},
    )


def broadcast_to_project(project_id, event_type, payload):
    _send(f'project_{project_id}', event_type, payload)


def broadcast_to_user(user_id, event_type, payload):
    _send(f'user_{user_id}', event_type, payload)
