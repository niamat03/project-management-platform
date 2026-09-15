import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { TaskDetailModal } from '../components/tasks/TaskDetailModal'
import { Pagination } from '../components/ui/Pagination'
import { PriorityBadge } from '../components/ui/PriorityBadge'
import { TaskStatusBadge } from '../components/ui/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useAuth } from '../contexts/AuthContext'
import { taskService } from '../services/taskService'

const PAGE_SIZE = 25

export function MyTasksPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [openTaskId, setOpenTaskId] = useState<number | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-tasks', user?.id, status, overdueOnly, page],
    queryFn: () => taskService.list({
      assignee: user!.id,
      status: status || undefined,
      overdue: overdueOnly || undefined,
      ordering: 'due_date',
      page,
    }),
    enabled: !!user,
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">Everything assigned to you, across all projects.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="done">Done</option>
          <option value="blocked">Blocked</option>
        </select>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => { setOverdueOnly(e.target.checked); setPage(1) }}
          />
          Overdue only
        </label>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState />}
      {data?.results.length === 0 && <EmptyState title="Nothing assigned to you here" />}

      {data && data.results.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Due date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.results.map((task) => (
                <tr key={task.id} onClick={() => setOpenTaskId(task.id)} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{task.title}</td>
                  <td className="px-4 py-3"><TaskStatusBadge status={task.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                  <td className={`px-4 py-3 ${task.is_overdue ? 'text-rose-500' : 'text-slate-500'}`}>{task.due_date ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page}
            count={data.count}
            pageSize={PAGE_SIZE}
            hasNext={!!data.next}
            hasPrevious={!!data.previous}
            onPageChange={setPage}
          />
        </div>
      )}

      {openTaskId != null && <TaskDetailModal taskId={openTaskId} open onClose={() => setOpenTaskId(null)} />}
    </div>
  )
}
