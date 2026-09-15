import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import type { Task } from '../../types'
import { PriorityBadge } from '../ui/PriorityBadge'

export function TaskCard({ task, onClick }: { task: Task; onClick?: () => void }) {
  const content = (
    <div className="rounded-lg border border-slate-200 bg-white p-3 transition-shadow hover:shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-800">{task.title}</p>
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
        {task.due_date && (
          <span className={`flex items-center gap-1 ${task.is_overdue ? 'text-rose-500' : ''}`}>
            <CalendarIcon className="h-3.5 w-3.5" />
            {format(new Date(task.due_date), 'MMM d')}
          </span>
        )}
        {task.location_name && (
          <span className="flex items-center gap-1">
            <MapPinIcon className="h-3.5 w-3.5" />
            {task.location_name}
          </span>
        )}
        {task.assignees.length > 0 && (
          <span className="ml-auto flex -space-x-1.5">
            {task.assignees.slice(0, 3).map((a) => (
              <span
                key={a.id}
                title={a.user.username}
                className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-brand-100 text-[10px] font-semibold text-brand-700"
              >
                {a.user.username[0]?.toUpperCase()}
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  )

  if (onClick) {
    return <button onClick={onClick} className="block w-full text-left">{content}</button>
  }
  return <Link to={`/tasks/${task.id}`}>{content}</Link>
}
