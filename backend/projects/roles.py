"""Central definition of project roles and their relative power.

Higher number == more privilege. Keeping this in one place means every
permission check (views, serializers, WebSocket consumers) agrees on the
same hierarchy instead of re-implementing role comparisons ad hoc.
"""

OWNER = 'owner'
ADMIN = 'admin'
MANAGER = 'manager'
MEMBER = 'member'
VIEWER = 'viewer'

ROLE_CHOICES = [
    (OWNER, 'Owner'),
    (ADMIN, 'Admin'),
    (MANAGER, 'Manager'),
    (MEMBER, 'Member'),
    (VIEWER, 'Viewer'),
]

ROLE_RANK = {
    VIEWER: 0,
    MEMBER: 1,
    MANAGER: 2,
    ADMIN: 3,
    OWNER: 4,
}


def role_at_least(role, minimum):
    """True if `role` has privilege >= `minimum` in the hierarchy above."""
    return ROLE_RANK.get(role, -1) >= ROLE_RANK.get(minimum, 99)
