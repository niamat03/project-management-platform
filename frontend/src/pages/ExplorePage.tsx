import { MapPinIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { ClusteredTaskMarkers } from '../components/map/ClusteredTaskMarkers'
import { FitToFeatures, TaskMapLayer } from '../components/map/TaskMapLayer'
import { TaskDetailModal } from '../components/tasks/TaskDetailModal'
import { PriorityBadge } from '../components/ui/PriorityBadge'
import { LoadingState } from '../components/ui/States'
import { geoService } from '../services/geoService'
import type { NearbyTaskResult } from '../types'

export function ExplorePage() {
  const [openTaskId, setOpenTaskId] = useState<number | null>(null)
  const [nearby, setNearby] = useState<{ radius_km: number; results: NearbyTaskResult[] } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [radiusKm, setRadiusKm] = useState(5)

  const { data: projectsGeo } = useQuery({ queryKey: ['geo-projects'], queryFn: () => geoService.projects() })
  const { data: tasksGeo, isLoading } = useQuery({ queryKey: ['geo-tasks', 'all'], queryFn: () => geoService.tasks() })

  // Point tasks are clustered (a project with many field visits in one area
  // becomes an unreadable pile of pins otherwise); lines/polygons render
  // individually via TaskMapLayer since clustering doesn't apply to them.
  const [tasksGeoPoints, tasksGeoOther] = useMemo(() => {
    if (!tasksGeo) return [undefined, undefined] as const
    const points = tasksGeo.features.filter((f) => f.geometry?.type === 'Point')
    const other = tasksGeo.features.filter((f) => f.geometry?.type !== 'Point')
    return [
      { type: 'FeatureCollection' as const, features: points },
      { type: 'FeatureCollection' as const, features: other },
    ] as const
  }, [tasksGeo])

  // Location is only ever requested when the user explicitly clicks this
  // button (section 41) - never on page load, never in the background.
  const findNearMe = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await geoService.nearbyTasks(pos.coords.latitude, pos.coords.longitude, radiusKm)
          setNearby(result)
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocationError('Location permission denied. The rest of the app still works fine without it.')
        setLocating(false)
      }
    )
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Map / Explore</h1>
          <p className="mt-1 text-sm text-slate-500">All geographically located projects and tasks you can access.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="rounded-lg border border-slate-200 px-2 py-2 text-sm">
            <option value={2}>2 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
          </select>
          <button
            onClick={findNearMe}
            disabled={locating}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <MapPinIcon className="h-4 w-4" />
            {locating ? 'Locating…' : 'Tasks near me'}
          </button>
        </div>
      </div>

      {locationError && <p className="mb-3 text-sm text-amber-600">{locationError}</p>}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-slate-200 lg:col-span-2">
          {isLoading ? (
            <LoadingState label="Loading map…" />
          ) : (
            <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitToFeatures collection={tasksGeo} />
              <TaskMapLayer collection={projectsGeo} />
              <TaskMapLayer collection={tasksGeoOther} onSelect={(props) => setOpenTaskId(props.id)} />
              <ClusteredTaskMarkers collection={tasksGeoPoints} onSelect={(props) => setOpenTaskId(props.id)} />
            </MapContainer>
          )}
        </div>

        <div className="overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 scrollbar-thin">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            {nearby ? `Within ${nearby.radius_km} km` : 'Nearby tasks'}
          </h2>
          {!nearby && <p className="text-sm text-slate-400">Click "Tasks near me" to search around your current location.</p>}
          {nearby && nearby.results.length === 0 && <p className="text-sm text-slate-400">No tasks found in this radius.</p>}
          <div className="space-y-2">
            {nearby?.results.map((task) => (
              <button
                key={task.id}
                onClick={() => setOpenTaskId(task.id)}
                className="block w-full rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{task.title}</p>
                  <PriorityBadge priority={task.priority} />
                </div>
                <p className="mt-1 text-xs text-slate-400">{task.project_name} · {task.distance_km} km away</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {openTaskId != null && <TaskDetailModal taskId={openTaskId} open onClose={() => setOpenTaskId(null)} />}
    </div>
  )
}
