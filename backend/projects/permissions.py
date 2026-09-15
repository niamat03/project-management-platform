"""Server-side authorization for project resources.

Section 12/50 of the spec are explicit: the backend must enforce every
permission and never trust role/membership claims coming from the client.
All permission classes below re-derive the caller's role from the database
on every request instead of trusting anything the client sent.
"""
from rest_framework import permissions

from .models import ProjectMember
from .roles import ADMIN, MANAGER, OWNER, role_at_least


def get_membership(user, project):
    if not user or not user.is_authenticated:
        return None
    return ProjectMember.objects.filter(project=project, user=user).select_related('user').first()


def get_role(user, project):
    membership = get_membership(user, project)
    return membership.role if membership else None


class IsProjectMember(permissions.BasePermission):
    """Base check: the requesting user must belong to the project."""

    def has_object_permission(self, request, view, obj):
        project = obj if hasattr(obj, 'members') else getattr(obj, 'project', None)
        return get_membership(request.user, project) is not None


class HasProjectRole(permissions.BasePermission):
    """Factory-style permission: require at least `minimum` role.

    Usage: permission_classes = [HasProjectRole.at_least(MANAGER)]
    """

    minimum_role = MANAGER

    @classmethod
    def at_least(cls, minimum_role):
        return type('HasProjectRoleAtLeast', (cls,), {'minimum_role': minimum_role})

    def _project_from(self, obj):
        return obj if hasattr(obj, 'members') else getattr(obj, 'project', None)

    def has_object_permission(self, request, view, obj):
        project = self._project_from(obj)
        role = get_role(request.user, project)
        if role is None:
            return False
        return role_at_least(role, self.minimum_role)


def can_manage_members(user, project):
    role = get_role(user, project)
    return role is not None and role_at_least(role, ADMIN)


def can_manage_board(user, project):
    role = get_role(user, project)
    return role is not None and role_at_least(role, MANAGER)


def can_edit_task(user, project):
    role = get_role(user, project)
    return role is not None and role_at_least(role, MANAGER)


def is_owner(user, project):
    return get_role(user, project) == OWNER
