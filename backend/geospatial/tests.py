from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from rest_framework import status
from rest_framework.test import APITestCase

from tasks.models import Task

User = get_user_model()

# Casablanca-ish coordinates, ~2km apart, and a far point (~9000km away) to
# make sure the radius filter actually excludes distant tasks.
NEAR_LNG_LAT = (-7.5898, 33.5731)
CLOSE_LNG_LAT = (-7.6100, 33.5850)
FAR_LNG_LAT = (2.3522, 48.8566)  # Paris


class NearbyTasksTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='surveyor', email='surveyor@example.com', password='pass12345')
        self.client.force_authenticate(user=self.user)
        project = self.client.post('/api/projects/', {'name': 'Field Survey'}).data
        self.project_id = project['id']

    def _create_task(self, title, lng_lat):
        return self.client.post('/api/tasks/', {
            'project': self.project_id,
            'title': title,
            'spatial_type': 'point',
            'geometry': {'type': 'Point', 'coordinates': [lng_lat[0], lng_lat[1]]},
        }, format='json').data

    def test_nearby_endpoint_finds_close_task_and_excludes_far_task(self):
        near_task = self._create_task('Nearby task', NEAR_LNG_LAT)
        self._create_task('Far away task', FAR_LNG_LAT)

        response = self.client.get('/api/geo/tasks/nearby/', {
            'lat': NEAR_LNG_LAT[1], 'lon': NEAR_LNG_LAT[0], 'radius_km': 10,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result_ids = {r['id'] for r in response.data['results']}
        self.assertIn(near_task['id'], result_ids)
        self.assertEqual(len(response.data['results']), 1)

    def test_nearby_distance_is_reasonable(self):
        self._create_task('Close task', CLOSE_LNG_LAT)
        response = self.client.get('/api/geo/tasks/nearby/', {
            'lat': NEAR_LNG_LAT[1], 'lon': NEAR_LNG_LAT[0], 'radius_km': 10,
        })
        distance_km = response.data['results'][0]['distance_km']
        self.assertGreater(distance_km, 0)
        self.assertLess(distance_km, 10)

    def test_nearby_requires_lat_lon(self):
        response = self.client.get('/api/geo/tasks/nearby/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_geo_tasks_returns_geojson_feature_collection(self):
        self._create_task('Mapped task', NEAR_LNG_LAT)
        response = self.client.get('/api/geo/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['type'], 'FeatureCollection')
        self.assertEqual(response.data['features'][0]['geometry']['type'], 'Point')

    def test_tasks_without_location_are_excluded_from_map_layer(self):
        self.client.post('/api/tasks/', {'project': self.project_id, 'title': 'No location'})
        response = self.client.get('/api/geo/tasks/')
        self.assertEqual(len(response.data['features']), 0)

    def test_private_location_hidden_from_non_admin_member(self):
        from projects.models import ProjectMember
        from projects.roles import MEMBER

        viewer = User.objects.create_user(username='viewer', email='viewer@example.com', password='pass12345')
        ProjectMember.objects.create(project_id=self.project_id, user=viewer, role=MEMBER)

        task_data = self._create_task('Sensitive site', NEAR_LNG_LAT)
        task = Task.objects.get(pk=task_data['id'])
        task.location_visibility = 'private'
        task.save(update_fields=['location_visibility'])

        self.client.force_authenticate(user=viewer)
        response = self.client.get('/api/geo/tasks/')
        feature = next(f for f in response.data['features'] if f['properties']['id'] == task.id)
        self.assertIsNone(feature['geometry'])
