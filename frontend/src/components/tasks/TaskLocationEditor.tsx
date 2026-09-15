import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { apiErrorMessage } from '../../services/api'
import { taskService } from '../../services/taskService'
import type { GeoJSONGeometry, SpatialType, Task } from '../../types'
import { GeometryEditor } from '../map/GeometryEditor'
import { MiniMap } from '../map/MiniMap'

export function TaskLocationEditor({ task }: { task: Task }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [geometry, setGeometry] = useState<GeoJSONGeometry | null>(task.geometry)
  const [spatialType, setSpatialType] = useState<SpatialType | null>(task.spatial_type)
  const [locationName, setLocationName] = useState(task.location_name ?? '')
  const [saving, setSaving] = useState(false)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['task', task.id] })
    queryClient.invalidateQueries({ queryKey: ['tasks', task.project] })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await taskService.update(task.id, {
        location_name: locationName,
        spatial_type: spatialType,
        geometry,
      })
      invalidate()
      setEditing(false)
      toast.success('Location saved')
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not save location.'))
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setSaving(true)
    try {
      await taskService.update(task.id, { location_name: '', spatial_type: null, geometry: null })
      setGeometry(null)
      setSpatialType(null)
      invalidate()
      setEditing(false)
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not remove location.'))
    } finally {
      setSaving(false)
    }
  }

  if (!editing && task.geometry) {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Location</label>
        <MiniMap geometry={task.geometry} label={task.location_name} />
        <div className="mt-1 flex items-center justify-between">
          {task.location_name && <p className="text-xs text-slate-500">{task.location_name}</p>}
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-brand-600 hover:underline">Edit</button>
        </div>
      </div>
    )
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-xs font-medium text-brand-600 hover:underline">
        + Add location
      </button>
    )
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Location</label>
      <div className="mb-2 flex gap-1 rounded-lg bg-slate-100 p-1">
        {(['point', 'line', 'polygon'] as SpatialType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setSpatialType(t); setGeometry(null) }}
            className={`flex-1 rounded-md px-2 py-1 text-[11px] font-medium capitalize transition-colors ${
              (spatialType ?? 'point') === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <GeometryEditor
        spatialType={spatialType}
        geometry={geometry}
        onChange={(result) => { setGeometry(result.geometry); setSpatialType(result.spatialType) }}
        height={200}
      />
      <input
        value={locationName}
        onChange={(e) => setLocationName(e.target.value)}
        placeholder="Location name (e.g. Bridge 7)"
        className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
      />
      <div className="mt-2 flex gap-2">
        <button onClick={handleSave} disabled={saving} className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">
          Save
        </button>
        {task.geometry && (
          <button onClick={handleRemove} disabled={saving} className="text-xs font-medium text-rose-500 hover:underline">Remove</button>
        )}
        <button onClick={() => setEditing(false)} className="text-xs font-medium text-slate-400 hover:underline">Cancel</button>
      </div>
    </div>
  )
}
