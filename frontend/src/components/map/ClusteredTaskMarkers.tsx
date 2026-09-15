import L from 'leaflet'
import 'leaflet.markercluster'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { GeoJSONFeatureCollection } from '../../types'
import { leafletMarkerIcon } from './MiniMap'

const PRIORITY_COLORS: Record<string, string> = {
  low: '#94a3b8', medium: '#38bdf8', high: '#f59e0b', critical: '#f43f5e',
}

/**
 * Groups Point task markers into clusters that expand as you zoom in.
 * Without this, a project with many field tasks in the same area becomes an
 * unreadable pile of overlapping pins on the global Explore map.
 * Imperative (not a JSX layer) because react-leaflet has no official
 * marker-cluster binding - same pattern as FitToFeatures below.
 */
export function ClusteredTaskMarkers({
  collection,
  onSelect,
}: {
  collection: GeoJSONFeatureCollection | undefined
  onSelect?: (properties: any) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (!collection) return

    const clusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount()
        return L.divIcon({
          html: `<div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white shadow-md ring-2 ring-white">${count}</div>`,
          className: '',
          iconSize: [36, 36],
        })
      },
    })

    for (const feature of collection.features) {
      if (feature.geometry?.type !== 'Point') continue
      const [lng, lat] = feature.geometry.coordinates
      const marker = L.marker([lat, lng], { icon: leafletMarkerIcon })
      const color = PRIORITY_COLORS[feature.properties.priority] ?? '#6366f1'
      marker.bindPopup(
        `<div style="font-size:13px">
          <strong>${feature.properties.title ?? feature.properties.name ?? ''}</strong><br/>
          ${feature.properties.project_name ? `<span style="color:#64748b">${feature.properties.project_name}</span><br/>` : ''}
          <span style="text-transform:uppercase;font-size:11px;color:${color}">${feature.properties.status ?? ''}</span>
        </div>`
      )
      marker.on('click', () => onSelect?.(feature.properties))
      clusterGroup.addLayer(marker)
    }

    map.addLayer(clusterGroup)
    return () => {
      map.removeLayer(clusterGroup)
    }
  }, [collection, map, onSelect])

  return null
}
