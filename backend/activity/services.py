from realtime.utils import broadcast_to_project

from .models import Activity


def log_activity(project, actor, verb, task=None, description='', metadata=None):
    activity = Activity.objects.create(
        project=project,
        task=task,
        actor=actor,
        verb=verb,
        description=description,
        metadata=metadata or {},
    )
    broadcast_to_project(project.id, 'activity.created', {
        'id': activity.id,
        'project': project.id,
        'task': task.id if task else None,
        'actor': {'id': actor.id, 'username': actor.username} if actor else None,
        'verb': verb,
        'description': description,
        'created_at': activity.created_at.isoformat(),
    })
    return activity
