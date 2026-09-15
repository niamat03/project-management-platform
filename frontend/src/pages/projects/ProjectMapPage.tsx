import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { FitToFeatures, TaskMapLayer } from '../../components/map/TaskMapLayer'
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal'
import { LoadingState } from '../../components/ui/States'
import { geoService } from '../../services/geoService'
import { useProjectOutlet } from './useProjectOutlet'

export function ProjectMapPage() {
  const { project } = useProjectOutlet()
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [openTaskId, setOpenTaskId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['geo-tasks', project.id, status, priority],
    queryFn: () => geoService.tasks({ project: project.id, status: status || undefined, priority: priority || undefined }),
  })

  if (isLoading) return <div className="p-6"><LoadingState label="Loading map…" /></div>

  const hasFeatures = (data?.features.length ?? 0) > 0

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4 flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="done">Done</option>
          <option value="blocked">Blocked</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200">
        {hasFeatures ? (
          <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitToFeatures collection={data} />
            <TaskMapLayer collection={data} onSelect={(props) => setOpenTaskId(props.id)} />
          </MapContainer>
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-50 text-center">
            <p className="max-w-xs text-sm text-slate-400">
              No tasks with a location yet. Add a geographic location to a task to see it on the map.
            </p>
          </div>
        )}
      </div>

      {openTaskId != null && <TaskDetailModal taskId={openTaskId} open onClose={() => setOpenTaskId(null)} />}
    </div>
  )
}
