import json

from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D

from .permissions import location_visible_to


def to_feature(obj, properties, user, project):
    """Build one GeoJSON Feature, respecting the location's visibility rule.

    When the location is not visible to `user`, both the geometry AND any
    location-derived attributes (name/address) are stripped from
    `properties` - exposing the place name (or a precise distance computed
    elsewhere from the same geometry) while hiding only the raw geometry
    would defeat the point of the visibility setting (section 41).
    """
    visible = obj.location is not None and location_visible_to(user, obj, project)
    properties = dict(properties)
    if not visible:
        properties.pop('location_name', None)
        properties.pop('address', None)
        properties.pop('distance_km', None)
    geometry = json.loads(obj.location.geojson) if visible else None
    return {
        'type': 'Feature',
        'geometry': geometry,
        'properties': properties,
    }


def feature_collection(features):
    return {'type': 'FeatureCollection', 'features': features}


def annotate_distance_from(queryset, lat, lon):
    """Adds a `.distance` (Distance object, meters accessible via .m) to each row.

    Uses PostGIS ST_Distance under the hood via GeoDjango's Distance function
    — the spec is explicit that distance/nearby math must happen in the
    database, never client-side JavaScript (section 33).
    """
    origin = Point(float(lon), float(lat), srid=4326)
    return queryset.filter(location__isnull=False).annotate(
        distance=Distance('location', origin)
    ).order_by('distance')


def within_radius(queryset, lat, lon, radius_km):
    origin = Point(float(lon), float(lat), srid=4326)
    return annotate_distance_from(queryset, lat, lon).filter(
        location__dwithin=(origin, D(km=float(radius_km)))
    )
