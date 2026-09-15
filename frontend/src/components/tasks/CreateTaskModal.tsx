import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { apiErrorMessage } from '../../services/api'
import { taskService } from '../../services/taskService'
import { Modal } from '../ui/Modal'

interface CreateTaskModalProps {
  projectId: number
  columnId: number
  open: boolean
  onClose: () => void
}

export function CreateTaskModal({ projectId, columnId, open, onClose }: CreateTaskModalProps) {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '' })

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await taskService.create({
        project: projectId,
        column: columnId,
        title: form.title,
        description: form.description,
        priority: form.priority,
        due_date: form.due_date || null,
      })
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      toast.success('Task created')
      onClose()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not create task.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
          <input required autoFocus value={form.title} onChange={update('title')} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea rows={3} value={form.description} onChange={update('description')} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
            <select value={form.priority} onChange={update('priority')} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Due date</label>
            <input type="date" value={form.due_date} onChange={update('due_date')} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {isSubmitting ? 'Creating…' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
