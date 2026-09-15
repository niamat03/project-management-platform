import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { GeometryEditor } from '../../components/map/GeometryEditor'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { apiErrorMessage } from '../../services/api'
import { projectService } from '../../services/projectService'
import type { GeoJSONGeometry, SpatialType } from '../../types'
import { useProjectOutlet } from './useProjectOutlet'

const CAN_DELETE_ROLES = ['owner']
const CAN_EDIT_ROLES = ['owner', 'admin']

export function ProjectSettingsPage() {
  const { project } = useProjectOutlet()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const canEdit = project.my_role != null && CAN_EDIT_ROLES.includes(project.my_role)
  const canDelete = project.my_role != null && CAN_DELETE_ROLES.includes(project.my_role)

  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    status: project.status,
    priority: project.priority,
    start_date: project.start_date ?? '',
    end_date: project.end_date ?? '',
    location_name: project.location_name ?? '',
    location_visibility: project.location_visibility ?? 'members',
  })
  const [geometry, setGeometry] = useState<GeoJSONGeometry | null>(project.geometry)
  const [spatialType, setSpatialType] = useState<SpatialType | null>(project.spatial_type)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await projectService.update(project.id, {
        ...form,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        spatial_type: spatialType,
        geometry,
      })
      queryClient.invalidateQueries({ queryKey: ['project', project.id] })
      toast.success('Project updated')
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not update project.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await projectService.remove(project.id)
      toast.success('Project deleted')
      navigate('/projects')
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not delete project.'))
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <fieldset disabled={!canEdit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input value={form.name} onChange={update('name')} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea rows={3} value={form.description} onChange={update('description')} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select value={form.status} onChange={update('status')} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
              <select value={form.priority} onChange={update('priority')} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Start date</label>
              <input type="date" value={form.start_date} onChange={update('start_date')} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">End date</label>
              <input type="date" value={form.end_date} onChange={update('end_date')} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">Geographic area (optional)</label>
            <p className="mb-2 text-xs text-slate-400">
              A site (point), a corridor/route (line), or a zone (polygon) - pick the shape, then draw it on the map.
            </p>
            <div className="mb-2 flex gap-1 rounded-lg bg-slate-100 p-1">
              {(['point', 'line', 'polygon'] as SpatialType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setSpatialType(t); setGeometry(null) }}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
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
            />
            {geometry && (
              <button type="button" onClick={() => { setGeometry(null); setSpatialType(null) }} className="mt-2 text-xs text-rose-500 hover:underline">
                Clear location
              </button>
            )}
          </div>

          {geometry && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Location name</label>
                <input value={form.location_name} onChange={update('location_name')} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Visibility</label>
                <select value={form.location_visibility} onChange={update('location_visibility')} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="public">Public</option>
                  <option value="members">Project members only</option>
                  <option value="private">Private (admins only)</option>
                </select>
              </div>
            </div>
          )}
        </fieldset>

        {canEdit && (
          <button type="submit" disabled={isSaving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        )}
      </form>

      {canDelete && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-5">
          <h2 className="text-sm font-semibold text-rose-700">Danger zone</h2>
          <p className="mt-1 text-sm text-rose-600">Deleting a project removes all its tasks, comments and activity permanently.</p>
          <button onClick={() => setConfirmDelete(true)} className="mt-3 rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-100">
            Delete project
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete project"
        message={`This will permanently delete "${project.name}" and everything in it.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => { setConfirmDelete(false); handleDelete() }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
