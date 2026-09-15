import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { apiErrorMessage } from '../../services/api'
import { projectService } from '../../services/projectService'
import type { BoardColumn } from '../../types'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Modal } from '../ui/Modal'

interface ManageColumnsModalProps {
  projectId: number
  columns: BoardColumn[]
  open: boolean
  onClose: () => void
}

export function ManageColumnsModal({ projectId, columns, open, onClose }: ManageColumnsModalProps) {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [pendingDelete, setPendingDelete] = useState<BoardColumn | null>(null)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['board', projectId] })

  const handleRename = async (column: BoardColumn, name: string) => {
    if (!name.trim() || name === column.name) return
    try {
      await projectService.updateColumn(projectId, column.id, { name: name.trim() })
      invalidate()
      toast.success('Saved', { id: 'column-rename-save', duration: 1200, icon: '✓' })
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not rename column.'))
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      await projectService.createColumn(projectId, newName.trim(), columns.length)
      setNewName('')
      invalidate()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not create column.'))
    }
  }

  const handleDelete = async (column: BoardColumn) => {
    try {
      await projectService.deleteColumn(projectId, column.id)
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not delete column.'))
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Manage board columns" size="md">
      <div className="space-y-2">
        {columns.map((column) => (
          <div key={column.id} className="flex items-center gap-2">
            <input
              defaultValue={column.name}
              onBlur={(e) => handleRename(column, e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <button onClick={() => setPendingDelete(column)} className="text-xs font-medium text-rose-500 hover:underline">
              Delete
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New column name"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Add
        </button>
      </form>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete column"
        message={`Tasks in "${pendingDelete?.name}" will need to be moved first, or they will be deleted along with the column.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </Modal>
  )
}
