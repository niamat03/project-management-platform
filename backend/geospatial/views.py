import json

from django.contrib.gis.geos import Polygon
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Project
from tasks.models import Task

from .permissions import location_visible_to
from .services import feature_collection, to_feature, within_radius

MAX_NEARBY_RADIUS_KM = 50


def _bbox_filter(queryset, bbox_param):
    """bbox=minLon,minLat,maxLon,maxLat -> restrict to viewport (section 51 perf note:
    never ship every feature to the client, always let PostGIS filter first)."""
    if not bbox_param:
        return queryset
    try:
        min_lon, min_lat, max_lon, max_lat = (float(v) for v in bbox_param.split(','))
    except (ValueError, AttributeError):
        return queryset
    bbox = Polygon.from_bbox((min_lon, min_lat, max_lon, max_lat))
    bbox.srid = 4326
    return queryset.filter(location__intersects=bbox)


class GeoProjectsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        projects = Project.objects.filter(
            members__user=request.user, location__isnull=False
        ).distinct()
        projects = _bbox_filter(projects, request.query_params.get('bbox'))

        status_param = request.query_params.get('status')
        if status_param:
            projects = projects.filter(status=status_param)

        features = [
            to_feature(p, {
                'id': p.id, 'name': p.name, 'status': p.status, 'priority': p.priority,
                'spatial_type': p.spatial_type, 'location_name': p.location_name,
            }, request.user, p)
            for p in projects
        ]
        return Response(feature_collection(features))


class GeoProjectDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        project = Project.objects.filter(pk=pk, members__user=request.user).first()
        if not project:
            return Response({'detail': 'Not found.'}, status=404)
        feature = to_feature(project, {
            'id': project.id, 'name': project.name, 'status': project.status,
            'priority': project.priority, 'location_name': project.location_name,
        }, request.user, project)
        return Response(feature)


class GeoTasksView(APIView):
    """GET /api/geo/tasks/ - map layer of tasks with optional spatial/attribute filters
    (section 35: status, priority, assignee, project, due date, geographic area)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tasks = Task.objects.filter(
            project__members__user=request.user, location__isnull=False
        ).select_related('project').distinct()
        tasks = _bbox_filter(tasks, request.query_params.get('bbox'))

        params = request.query_params
        if params.get('project'):
            tasks = tasks.filter(project_id=params['project'])
        if params.get('status'):
            tasks = tasks.filter(status=params['status'])
        if params.get('priority'):
            tasks = tasks.filter(priority=params['priority'])
        if params.get('assignee'):
            tasks = tasks.filter(assignees__user_id=params['assignee'])

        features = [
            to_feature(t, {
                'id': t.id, 'title': t.title, 'status': t.status, 'priority': t.priority,
                'project': t.project_id, 'project_name': t.project.name,
                'due_date': t.due_date.isoformat() if t.due_date else None,
                'spatial_type': t.spatial_type, 'location_name': t.location_name,
            }, request.user, t.project)
            for t in tasks
        ]
        return Response(feature_collection(features))


class NearbyTasksView(APIView):
    """Section 34: 'Tasks Near Me'. Location permission is entirely client-opt-in -
    the browser geolocation coordinates are only ever sent here when the user
    explicitly triggers this feature (section 41)."""
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = 'nearby'

    def get(self, request):
        lat_raw = request.query_params.get('lat')
        lon_raw = request.query_params.get('lon')
        radius_raw = request.query_params.get('radius_km', 5)
        if lat_raw is None or lon_raw is None:
            return Response({'detail': 'lat and lon query params are required.'}, status=400)

        try:
            lat = float(lat_raw)
            lon = float(lon_raw)
            radius_km = float(radius_raw)
        except (TypeError, ValueError):
            return Response({'detail': 'lat, lon and radius_km must be numeric.'}, status=400)

        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            return Response({'detail': 'lat must be within [-90, 90] and lon within [-180, 180].'}, status=400)
        if not (0 < radius_km <= MAX_NEARBY_RADIUS_KM):
            return Response(
                {'detail': f'radius_km must be between 0 and {MAX_NEARBY_RADIUS_KM}.'}, status=400
            )

        tasks = Task.objects.filter(
            project__members__user=request.user
        ).select_related('project').distinct()

        if request.query_params.get('status'):
            tasks = tasks.filter(status=request.query_params['status'])
        if request.query_params.get('priority'):
            tasks = tasks.filter(priority=request.query_params['priority'])

        nearby = within_radius(tasks, lat, lon, radius_km)[:100]

        results = []
        for task in nearby:
            visible = location_visible_to(request.user, task, task.project)
            assignees = [a.user.username for a in task.assignees.select_related('user')]
            results.append({
                'id': task.id,
                'title': task.title,
                'project': task.project_id,
                'project_name': task.project.name,
                'priority': task.priority,
                'status': task.status,
                'due_date': task.due_date.isoformat() if task.due_date else None,
                'assignees': assignees,
                'distance_km': round(task.distance.km, 3) if visible else None,
                'location_name': task.location_name if visible else '',
                'geometry': json.loads(task.location.geojson) if visible and task.location else None,
            })
        return Response({'radius_km': radius_km, 'count': len(results), 'results': results})
