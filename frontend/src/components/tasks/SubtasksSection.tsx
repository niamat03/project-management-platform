import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiErrorMessage } from '../../services/api'
import { taskService } from '../../services/taskService'
import type { Task } from '../../types'
import { TaskStatusBadge } from '../ui/StatusBadge'

export function SubtasksSection({ task, onOpenSubtask }: { task: Task; onOpenSubtask: (taskId: number) => void }) {
  const queryClient = useQueryClient()

  const { data: projectTasks } = useQuery({
    queryKey: ['tasks', task.project, 'for-parent-picker'],
    queryFn: () => taskService.listAll({ project: task.project }),
  })

  const subtasks = projectTasks?.filter((t) => t.parent_task === task.id) ?? []
  const candidateParents = projectTasks?.filter((t) => t.id !== task.id && t.parent_task !== task.id) ?? []

  const handleParentChange = async (parentId: string) => {
    try {
      await taskService.update(task.id, { parent_task: parentId ? Number(parentId) : null })
      queryClient.invalidateQueries({ queryKey: ['task', task.id] })
      queryClient.invalidateQueries({ queryKey: ['tasks', task.project] })
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not update parent task.'))
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Parent task</label>
        <select
          value={task.parent_task ?? ''}
          onChange={(e) => handleParentChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        >
          <option value="">None</option>
          {candidateParents.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>

      {subtasks.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Subtasks ({subtasks.length})</label>
          <ul className="space-y-1">
            {subtasks.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => onOpenSubtask(t.id)}
                  className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-left hover:bg-slate-100"
                >
                  <span className="truncate text-sm text-slate-700">{t.title}</span>
                  <TaskStatusBadge status={t.status} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
