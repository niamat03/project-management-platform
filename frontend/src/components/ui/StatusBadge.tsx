import type { ProjectStatus, TaskStatus } from '../../types'

const TASK_STYLES: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-brand-100 text-brand-700',
  in_review: 'bg-violet-100 text-violet-700',
  done: 'bg-emerald-100 text-emerald-700',
  blocked: 'bg-rose-100 text-rose-700',
}

const TASK_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  blocked: 'Blocked',
}

const PROJECT_STYLES: Record<ProjectStatus, string> = {
  planning: 'bg-slate-100 text-slate-600',
  active: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-brand-100 text-brand-700',
  archived: 'bg-slate-200 text-slate-500',
}

const PROJECT_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  archived: 'Archived',
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TASK_STYLES[status]}`}>
      {TASK_LABELS[status]}
    </span>
  )
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PROJECT_STYLES[status]}`}>
      {PROJECT_LABELS[status]}
    </span>
  )
}
