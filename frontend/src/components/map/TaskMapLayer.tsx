import L from 'leaflet'
import { useMemo } from 'react'
import { GeoJSON, Marker, Polygon, Polyline, Popup, useMap } from 'react-leaflet'
import type { GeoJSONFeatureCollection } from '../../types'
import { leafletMarkerIcon } from './MiniMap'

const PRIORITY_COLORS: Record<string, string> = {
  low: '#94a3b8', medium: '#38bdf8', high: '#f59e0b', critical: '#f43f5e',
}

function toLatLng([lng, lat]: [number, number]): [number, number] {
  return [lat, lng]
}

export function FitToFeatures({ collection }: { collection: GeoJSONFeatureCollection | undefined }) {
  const map = useMap()
  useMemo(() => {
    if (!collection || collection.features.length === 0) return
    const layer = L.geoJSON(collection as any)
    const bounds = layer.getBounds()
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection])
  return null
}

export function TaskMapLayer({
  collection,
  onSelect,
}: {
  collection: GeoJSONFeatureCollection | undefined
  onSelect?: (properties: any) => void
}) {
  if (!collection) return null

  return (
    <>
      {collection.features.map((feature, i) => {
        if (!feature.geometry) return null
        const color = PRIORITY_COLORS[feature.properties.priority] ?? '#6366f1'

        if (feature.geometry.type === 'Point') {
          return (
            <Marker
              key={i}
              position={toLatLng(feature.geometry.coordinates)}
              icon={leafletMarkerIcon}
              eventHandlers={{ click: () => onSelect?.(feature.properties) }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-medium">{feature.properties.title ?? feature.properties.name}</p>
                  {feature.properties.project_name && <p className="text-slate-500">{feature.properties.project_name}</p>}
                  {feature.properties.status && <p className="mt-1 text-xs uppercase text-slate-400">{feature.properties.status}</p>}
                </div>
              </Popup>
            </Marker>
          )
        }
        if (feature.geometry.type === 'LineString') {
          return <Polyline key={i} positions={feature.geometry.coordinates.map(toLatLng)} color={color} />
        }
        if (feature.geometry.type === 'Polygon') {
          return <Polygon key={i} positions={feature.geometry.coordinates.map((r: any) => r.map(toLatLng))} color={color} />
        }
        if (feature.geometry.type === 'MultiPolygon') {
          return (
            <GeoJSON
              key={i}
              data={feature as any}
              style={{ color }}
              onEachFeature={(f, layer) => layer.on('click', () => onSelect?.(f.properties))}
            />
          )
        }
        return null
      })}
    </>
  )
}
