import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { activityService } from '../../services/activityService'
import { apiErrorMessage } from '../../services/api'
import { projectService } from '../../services/projectService'
import { taskService } from '../../services/taskService'
import type { Priority, TaskStatus } from '../../types'
import { ActivityTimeline } from '../activity/ActivityTimeline'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Modal } from '../ui/Modal'
import { LoadingState } from '../ui/States'
import { AttachmentSection } from './AttachmentSection'
import { CommentSection } from './CommentSection'
import { SubtasksSection } from './SubtasksSection'
import { TagPicker } from './TagPicker'
import { TaskLocationEditor } from './TaskLocationEditor'

type Tab = 'details' | 'comments' | 'activity'

export function TaskDetailModal({ taskId, open, onClose }: { taskId: number; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('details')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState(taskId)

  useEffect(() => {
    setActiveTaskId(taskId)
    setTab('details')
  }, [taskId])

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', activeTaskId],
    queryFn: () => taskService.get(activeTaskId),
    enabled: open,
  })

  const { data: members } = useQuery({
    queryKey: ['project-members', task?.project],
    queryFn: () => projectService.members(task!.project),
    enabled: open && !!task,
  })

  const { data: activity } = useQuery({
    queryKey: ['task-activity', activeTaskId],
    queryFn: () => activityService.forTask(activeTaskId),
    enabled: open && tab === 'activity',
  })

  const invalidateTask = () => {
    queryClient.invalidateQueries({ queryKey: ['task', activeTaskId] })
    if (task) queryClient.invalidateQueries({ queryKey: ['tasks', task.project] })
  }

  const updateField = async (payload: Record<string, any>) => {
    try {
      await taskService.update(activeTaskId, payload)
      invalidateTask()
      toast.success('Saved', { id: 'task-field-save', duration: 1200, icon: '✓' })
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not update task.'))
    }
  }

  const handleAssign = async (userId: number) => {
    try {
      await taskService.assign(activeTaskId, userId)
      invalidateTask()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not assign user.'))
    }
  }

  const handleUnassign = async (userId: number) => {
    try {
      await taskService.unassign(activeTaskId, userId)
      invalidateTask()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not unassign user.'))
    }
  }

  const handleDelete = async () => {
    try {
      await taskService.remove(activeTaskId)
      if (task) queryClient.invalidateQueries({ queryKey: ['tasks', task.project] })
      toast.success('Task deleted')
      onClose()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not delete task.'))
    }
  }

  const assignedIds = new Set(task?.assignees.map((a) => a.user.id))
  const availableMembers = members?.filter((m) => !assignedIds.has(m.user.id)) ?? []

  return (
    <Modal open={open} onClose={onClose} size="xl" title={isLoading ? 'Loading task…' : task?.title}>
      {isLoading || !task ? (
        <LoadingState />
      ) : (
        <div className="space-y-5">
          <div className="flex gap-1 border-b border-slate-100">
            {(['details', 'comments', 'activity'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`border-b-2 px-3 py-2 text-sm font-medium capitalize ${
                  tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'details' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-2">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Description</label>
                  <textarea
                    defaultValue={task.description}
                    rows={4}
                    onBlur={(e) => e.target.value !== task.description && updateField({ description: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Tags</label>
                  <TagPicker task={task} />
                </div>

                <TaskLocationEditor task={task} />

                <AttachmentSection task={task} />

                <SubtasksSection task={task} onOpenSubtask={setActiveTaskId} />

                <button onClick={() => setConfirmDelete(true)} className="text-xs font-medium text-rose-500 hover:underline">
                  Delete task
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Status</label>
                  <select
                    value={task.status}
                    onChange={(e) => updateField({ status: e.target.value as TaskStatus })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Priority</label>
                  <select
                    value={task.priority}
                    onChange={(e) => updateField({ priority: e.target.value as Priority })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Due date</label>
                  <input
                    type="date"
                    defaultValue={task.due_date ?? ''}
                    onBlur={(e) => updateField({ due_date: e.target.value || null })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Progress ({task.progress}%)</label>
                  <input
                    type="range" min={0} max={100} defaultValue={task.progress}
                    onMouseUp={(e) => updateField({ progress: Number((e.target as HTMLInputElement).value) })}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Est. hours</label>
                    <input
                      type="number" min={0} step={0.5}
                      defaultValue={task.estimated_hours ?? ''}
                      onBlur={(e) => updateField({ estimated_hours: e.target.value || null })}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Actual hours</label>
                    <input
                      type="number" min={0} step={0.5}
                      defaultValue={task.actual_hours ?? ''}
                      onBlur={(e) => updateField({ actual_hours: e.target.value || null })}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Assignees</label>
                  <div className="space-y-1.5">
                    {task.assignees.map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5">
                        <span className="text-sm text-slate-700">{a.user.username}</span>
                        <button onClick={() => handleUnassign(a.user.id)} className="text-xs text-slate-400 hover:text-rose-500">Remove</button>
                      </div>
                    ))}
                    {availableMembers.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => e.target.value && handleAssign(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      >
                        <option value="">+ Assign member…</option>
                        {availableMembers.map((m) => (
                          <option key={m.id} value={m.user.id}>{m.user.username}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Created {format(new Date(task.created_at), 'MMM d, yyyy')} by {task.creator?.username}
                </p>
              </div>
            </div>
          )}

          {tab === 'comments' && <CommentSection taskId={activeTaskId} />}

          {tab === 'activity' && <ActivityTimeline activities={activity?.results ?? []} />}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete task"
        message="This will permanently delete the task and its comments. This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => { setConfirmDelete(false); handleDelete() }}
        onCancel={() => setConfirmDelete(false)}
      />
    </Modal>
  )
}
