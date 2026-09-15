import L from 'leaflet'
import { MapContainer, Marker, Polygon, Polyline, Popup, TileLayer } from 'react-leaflet'
import type { GeoJSONGeometry } from '../../types'

// Default Leaflet marker icons reference build-hashed asset URLs that break
// under Vite; point them at the CDN copy instead of shipping broken pins.
const icon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function toLatLng([lng, lat]: [number, number]): [number, number] {
  return [lat, lng]
}

export function MiniMap({ geometry, label, height = 220 }: { geometry: GeoJSONGeometry; label?: string; height?: number }) {
  let center: [number, number] = [0, 0]

  if (geometry.type === 'Point') {
    center = toLatLng(geometry.coordinates)
  } else if (geometry.type === 'LineString') {
    center = toLatLng(geometry.coordinates[Math.floor(geometry.coordinates.length / 2)])
  } else if (geometry.type === 'Polygon') {
    center = toLatLng(geometry.coordinates[0][0])
  } else if (geometry.type === 'MultiPolygon') {
    center = toLatLng(geometry.coordinates[0][0][0])
  }

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border border-slate-200">
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geometry.type === 'Point' && (
          <Marker position={center} icon={icon}>
            {label && <Popup>{label}</Popup>}
          </Marker>
        )}
        {geometry.type === 'LineString' && (
          <Polyline positions={geometry.coordinates.map(toLatLng)} color="#4f46e5" />
        )}
        {geometry.type === 'Polygon' && (
          <Polygon positions={geometry.coordinates.map((ring: any) => ring.map(toLatLng))} color="#4f46e5" />
        )}
        {geometry.type === 'MultiPolygon' && (
          <>
            {geometry.coordinates.map((polygon: any, i: number) => (
              <Polygon key={i} positions={polygon.map((ring: any) => ring.map(toLatLng))} color="#4f46e5" />
            ))}
          </>
        )}
      </MapContainer>
    </div>
  )
}

export { icon as leafletMarkerIcon }
