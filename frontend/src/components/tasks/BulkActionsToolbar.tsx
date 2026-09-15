import type { TaskStatus } from '../../types'

interface BulkActionsToolbarProps {
  count: number
  onStatusChange: (status: TaskStatus) => void
  onDelete: () => void
  onClear: () => void
  busy?: boolean
}

export function BulkActionsToolbar({ count, onStatusChange, onDelete, onClear, busy }: BulkActionsToolbarProps) {
  if (count === 0) return null

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5">
      <span className="text-sm font-medium text-brand-800">{count} selected</span>
      <select
        disabled={busy}
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onStatusChange(e.target.value as TaskStatus)
          e.target.value = ''
        }}
        className="rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-sm disabled:opacity-60"
      >
        <option value="" disabled>Set status…</option>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="in_review">In Review</option>
        <option value="done">Done</option>
        <option value="blocked">Blocked</option>
      </select>
      <button
        onClick={onDelete}
        disabled={busy}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-100 disabled:opacity-60"
      >
        Delete
      </button>
      <button onClick={onClear} className="ml-auto text-sm font-medium text-slate-500 hover:underline">
        Clear selection
      </button>
    </div>
  )
}
