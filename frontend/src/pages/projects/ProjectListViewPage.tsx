import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { BulkActionsToolbar } from '../../components/tasks/BulkActionsToolbar'
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Pagination } from '../../components/ui/Pagination'
import { PriorityBadge } from '../../components/ui/PriorityBadge'
import { TaskStatusBadge } from '../../components/ui/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { apiErrorMessage } from '../../services/api'
import { taskService } from '../../services/taskService'
import type { TaskStatus } from '../../types'
import { downloadCsv, tasksToCsv } from '../../utils/csv'
import { useProjectOutlet } from './useProjectOutlet'

const PAGE_SIZE = 25

export function ProjectListViewPage() {
  const { project } = useProjectOutlet()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(1)
  const [openTaskId, setOpenTaskId] = useState<number | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [exporting, setExporting] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tasks', project.id, 'list', status, priority, page],
    queryFn: () => taskService.list({
      project: project.id,
      status: status || undefined,
      priority: priority || undefined,
      ordering: 'due_date',
      page,
    }),
  })

  const updateFilter = (setter: (v: string) => void) => (value: string) => {
    setter(value)
    setPage(1)
    setSelected(new Set())
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks', project.id] })

  const toggleOne = (taskId: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const toggleAllOnPage = () => {
    const pageIds = data?.results.map((t) => t.id) ?? []
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
    setSelected(allSelected ? new Set() : new Set(pageIds))
  }

  const handleBulkStatusChange = async (newStatus: TaskStatus) => {
    setBulkBusy(true)
    try {
      await Promise.all([...selected].map((id) => taskService.update(id, { status: newStatus })))
      toast.success(`Updated ${selected.size} task(s)`)
      setSelected(new Set())
      invalidate()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Some tasks could not be updated.'))
      invalidate()
    } finally {
      setBulkBusy(false)
    }
  }

  const handleBulkDelete = async () => {
    setConfirmBulkDelete(false)
    setBulkBusy(true)
    try {
      await Promise.all([...selected].map((id) => taskService.remove(id)))
      toast.success(`Deleted ${selected.size} task(s)`)
      setSelected(new Set())
      invalidate()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Some tasks could not be deleted.'))
      invalidate()
    } finally {
      setBulkBusy(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const all = await taskService.listAll({
        project: project.id,
        status: status || undefined,
        priority: priority || undefined,
        ordering: 'due_date',
      })
      downloadCsv(`${project.name.replace(/\s+/g, '_').toLowerCase()}_tasks.csv`, tasksToCsv(all))
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not export tasks.'))
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) return <div className="p-6"><LoadingState /></div>
  if (isError) return <div className="p-6"><ErrorState /></div>

  const pageIds = data?.results.map((t) => t.id) ?? []
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={status} onChange={(e) => updateFilter(setStatus)(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="done">Done</option>
          <option value="blocked">Blocked</option>
        </select>
        <select value={priority} onChange={(e) => updateFilter(setPriority)(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="ml-auto flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      <BulkActionsToolbar
        count={selected.size}
        busy={bulkBusy}
        onStatusChange={handleBulkStatusChange}
        onDelete={() => setConfirmBulkDelete(true)}
        onClear={() => setSelected(new Set())}
      />

      {data?.results.length === 0 ? (
        <EmptyState title="No tasks match these filters" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-400">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} />
                </th>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Due date</th>
                <th className="px-4 py-3">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.results.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(task.id)} onChange={() => toggleOne(task.id)} />
                  </td>
                  <td className="cursor-pointer px-4 py-3 font-medium text-slate-800" onClick={() => setOpenTaskId(task.id)}>{task.title}</td>
                  <td className="cursor-pointer px-4 py-3" onClick={() => setOpenTaskId(task.id)}><TaskStatusBadge status={task.status} /></td>
                  <td className="cursor-pointer px-4 py-3" onClick={() => setOpenTaskId(task.id)}><PriorityBadge priority={task.priority} /></td>
                  <td className="cursor-pointer px-4 py-3 text-slate-500" onClick={() => setOpenTaskId(task.id)}>{task.assignees.map((a) => a.user.username).join(', ') || '—'}</td>
                  <td className={`cursor-pointer px-4 py-3 ${task.is_overdue ? 'text-rose-500' : 'text-slate-500'}`} onClick={() => setOpenTaskId(task.id)}>{task.due_date ?? '—'}</td>
                  <td className="cursor-pointer px-4 py-3 text-slate-500" onClick={() => setOpenTaskId(task.id)}>{task.location_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page}
            count={data?.count ?? 0}
            pageSize={PAGE_SIZE}
            hasNext={!!data?.next}
            hasPrevious={!!data?.previous}
            onPageChange={setPage}
          />
        </div>
      )}

      {openTaskId != null && <TaskDetailModal taskId={openTaskId} open onClose={() => setOpenTaskId(null)} />}

      <ConfirmDialog
        open={confirmBulkDelete}
        title="Delete tasks"
        message={`This will permanently delete ${selected.size} task(s). This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />
    </div>
  )
}
