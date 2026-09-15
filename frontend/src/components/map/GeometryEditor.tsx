import L from 'leaflet'
import 'leaflet-draw'
import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { GeoJSONGeometry, SpatialType } from '../../types'

function geometryToLatLngCenter(geometry: GeoJSONGeometry): [number, number] {
  if (geometry.type === 'Point') return [geometry.coordinates[1], geometry.coordinates[0]]
  if (geometry.type === 'LineString') {
    const mid = geometry.coordinates[Math.floor(geometry.coordinates.length / 2)]
    return [mid[1], mid[0]]
  }
  if (geometry.type === 'Polygon') return [geometry.coordinates[0][0][1], geometry.coordinates[0][0][0]]
  return [geometry.coordinates[0][0][0][1], geometry.coordinates[0][0][0][0]]
}

const DRAW_OPTIONS_BY_TYPE: Record<'point' | 'line' | 'polygon', any> = {
  point: { marker: {}, polyline: false, polygon: false, circle: false, rectangle: false, circlemarker: false },
  line: { marker: false, polyline: { shapeOptions: { color: '#4f46e5' } }, polygon: false, circle: false, rectangle: false, circlemarker: false },
  polygon: { marker: false, polyline: false, polygon: { shapeOptions: { color: '#4f46e5' } }, circle: false, rectangle: false, circlemarker: false },
}

function layerToGeometry(layer: L.Layer): { geometry: GeoJSONGeometry; spatialType: SpatialType } | null {
  const geojson = (layer as any).toGeoJSON()
  const geometry = geojson.geometry as GeoJSONGeometry
  const spatialType: SpatialType =
    geometry.type === 'Point' ? 'point' : geometry.type === 'LineString' ? 'line' : 'polygon'
  return { geometry, spatialType }
}

function DrawingLayer({
  drawMode,
  initialGeometry,
  onChange,
}: {
  drawMode: 'point' | 'line' | 'polygon'
  initialGeometry: GeoJSONGeometry | null
  onChange: (result: { geometry: GeoJSONGeometry | null; spatialType: SpatialType | null }) => void
}) {
  const map = useMap()
  const groupRef = useRef<L.FeatureGroup | null>(null)

  useEffect(() => {
    const group = new L.FeatureGroup()
    groupRef.current = group
    map.addLayer(group)

    if (initialGeometry) {
      L.geoJSON(initialGeometry as any).eachLayer((layer) => group.addLayer(layer))
    }

    const control = new (L as any).Control.Draw({
      edit: { featureGroup: group, remove: true },
      draw: DRAW_OPTIONS_BY_TYPE[drawMode],
    })
    map.addControl(control)

    const handleCreated = (e: any) => {
      group.clearLayers() // one geometry per project/task at a time
      group.addLayer(e.layer)
      const result = layerToGeometry(e.layer)
      onChange(result ?? { geometry: null, spatialType: null })
    }
    const handleEditedOrDeleted = () => {
      const layers = group.getLayers()
      if (layers.length === 0) {
        onChange({ geometry: null, spatialType: null })
        return
      }
      const result = layerToGeometry(layers[0])
      onChange(result ?? { geometry: null, spatialType: null })
    }

    map.on((L as any).Draw.Event.CREATED, handleCreated)
    map.on((L as any).Draw.Event.EDITED, handleEditedOrDeleted)
    map.on((L as any).Draw.Event.DELETED, handleEditedOrDeleted)

    return () => {
      map.off((L as any).Draw.Event.CREATED, handleCreated)
      map.off((L as any).Draw.Event.EDITED, handleEditedOrDeleted)
      map.off((L as any).Draw.Event.DELETED, handleEditedOrDeleted)
      map.removeControl(control)
      map.removeLayer(group)
    }
    // Re-running on drawMode change swaps the toolbar; initialGeometry is
    // intentionally only read once here (see the `key` used by the parent).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, drawMode])

  return null
}

export function GeometryEditor({
  spatialType,
  geometry,
  onChange,
  height = 320,
}: {
  spatialType: SpatialType | null
  geometry: GeoJSONGeometry | null
  onChange: (result: { geometry: GeoJSONGeometry | null; spatialType: SpatialType | null }) => void
  height?: number
}) {
  const drawMode: 'point' | 'line' | 'polygon' = spatialType === 'line' ? 'line' : spatialType === 'polygon' ? 'polygon' : 'point'
  const center = geometry ? geometryToLatLngCenter(geometry) : ([20, 0] as [number, number])

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border border-slate-200">
      <MapContainer center={center} zoom={geometry ? 13 : 2} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Keyed on drawMode: a fresh control/group is the simplest way to
            swap tool sets when the user switches point/line/polygon. */}
        <DrawingLayer key={drawMode} drawMode={drawMode} initialGeometry={geometry} onChange={onChange} />
      </MapContainer>
    </div>
  )
}
