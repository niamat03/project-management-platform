from django.contrib.gis.db import models as gis_models
from django.db import models


class SpatialType(models.TextChoices):
    POINT = 'point', 'Point'
    LINE = 'line', 'Line'
    POLYGON = 'polygon', 'Polygon'
    MULTIPOLYGON = 'multipolygon', 'Multi-polygon'


class LocationVisibility(models.TextChoices):
    PUBLIC = 'public', 'Public'
    MEMBERS = 'members', 'Project members only'
    PRIVATE = 'private', 'Private'


class SpatialMixin(models.Model):
    """Optional geographic dimension shared by Project and Task.

    A single GeometryField (rather than PointField/PolygonField) is used
    deliberately: a project/task can represent a site (Point), a corridor
    (LineString) or a zone (Polygon/MultiPolygon) depending on context, and
    forcing a single geometry subtype would contradict section 27/28/29 of
    the spec. `spatial_type` records the intended kind for UI rendering
    without needing to introspect the geometry.
    """
    # geography=True (not plain geometry) so ST_DWithin/ST_Distance operate in
    # real meters on the WGS84 spheroid instead of raw degrees - required for
    # correct "nearby tasks" radius search (section 33/34) at global scale.
    location = gis_models.GeometryField(
        srid=4326, null=True, blank=True, spatial_index=True, geography=True
    )
    location_name = models.CharField(max_length=255, blank=True, default='')
    address = models.CharField(max_length=500, blank=True, default='')
    spatial_type = models.CharField(
        max_length=20, choices=SpatialType.choices, null=True, blank=True
    )
    location_visibility = models.CharField(
        max_length=20, choices=LocationVisibility.choices, default=LocationVisibility.MEMBERS
    )

    class Meta:
        abstract = True
