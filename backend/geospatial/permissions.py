from .models import LocationVisibility


def location_visible_to(user, obj, project):
    """Section 41: a location's own visibility setting gates who can see it,
    independent of whether the surrounding project/task is visible."""
    visibility = obj.location_visibility
    if visibility == LocationVisibility.PUBLIC:
        return True

    from projects.permissions import get_role
    from projects.roles import ADMIN, role_at_least

    role = get_role(user, project)
    if visibility == LocationVisibility.MEMBERS:
        return role is not None
    if visibility == LocationVisibility.PRIVATE:
        return role is not None and role_at_least(role, ADMIN)
    return False
