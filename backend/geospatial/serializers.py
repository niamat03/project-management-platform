import json

from django.contrib.gis.geos import GEOSException, GEOSGeometry
from rest_framework import serializers


class GeometryField(serializers.Field):
    """Accepts/returns geometry as GeoJSON, keeping PostGIS internals out of the API contract."""

    def to_representation(self, value):
        if value is None:
            return None
        return json.loads(value.geojson)

    def to_internal_value(self, data):
        if data in (None, ''):
            return None
        try:
            if isinstance(data, str):
                geom = GEOSGeometry(data)
            else:
                geom = GEOSGeometry(json.dumps(data))
        except (GEOSException, ValueError, TypeError):
            raise serializers.ValidationError('Invalid GeoJSON geometry.')
        geom.srid = 4326
        return geom


class SpatialFieldsMixinSerializer(serializers.Serializer):
    """Mixin adding a `geometry` GeoJSON field mapped to the model's `location` column.

    Kept as a plain mixin (not a full ModelSerializer) so it can be combined
    with any model serializer that includes SpatialMixin fields.

    `location_visibility` (section 41) must be enforced here too, not only on
    the dedicated /api/geo/... endpoints (geospatial/services.to_feature) -
    otherwise the plain /api/tasks/ and /api/projects/ endpoints leak a
    "private" location's geometry/name/address to any project member.
    """

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        from .permissions import location_visible_to

        request = self.context.get('request')
        user = getattr(request, 'user', None)
        project = getattr(instance, 'project', instance)
        visible = bool(
            user and getattr(user, 'is_authenticated', False)
            and location_visible_to(user, instance, project)
        )
        if not visible:
            ret['geometry'] = None
            if 'location_name' in ret:
                ret['location_name'] = ''
            if 'address' in ret:
                ret['address'] = ''
        return ret

    geometry = GeometryField(source='location', required=False, allow_null=True)
