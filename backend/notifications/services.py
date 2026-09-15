from realtime.utils import broadcast_to_user

from .models import Notification


def notify(recipient, notification_type, message, actor=None, project=None, task=None):
    if actor and recipient_id_equals_actor(recipient, actor):
        return None  # don't notify users about their own actions

    notification = Notification.objects.create(
        recipient=recipient,
        actor=actor,
        notification_type=notification_type,
        message=message,
        project=project,
        task=task,
    )
    broadcast_to_user(recipient.id, 'notification.created', {
        'id': notification.id,
        'type': notification.notification_type,
        'message': notification.message,
        'project': project.id if project else None,
        'task': task.id if task else None,
        'is_read': False,
        'created_at': notification.created_at.isoformat(),
    })
    return notification


def recipient_id_equals_actor(recipient, actor):
    return recipient.id == actor.id
