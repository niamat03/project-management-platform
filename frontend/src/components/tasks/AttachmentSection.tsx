import { PaperClipIcon } from '@heroicons/react/24/outline'
import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { apiErrorMessage } from '../../services/api'
import { taskService } from '../../services/taskService'
import type { Task } from '../../types'

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentSection({ task }: { task: Task }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['task', task.id] })
  }

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      await taskService.uploadAttachment(task.id, file)
      invalidate()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not upload file.'))
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const handleDelete = async (attachmentId: number) => {
    try {
      await taskService.deleteAttachment(task.id, attachmentId)
      invalidate()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not delete attachment.'))
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="block text-xs font-medium uppercase text-slate-400">Attachments</label>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="text-xs font-medium text-brand-600 hover:underline disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : '+ Upload file'}
        </button>
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
      {(!task.attachments || task.attachments.length === 0) ? (
        <p className="text-xs text-slate-400">No files attached.</p>
      ) : (
        <ul className="space-y-1.5">
          {task.attachments.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5">
              <a href={a.file} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-1.5 text-xs text-slate-700 hover:text-brand-600">
                <PaperClipIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{a.filename}</span>
                <span className="shrink-0 text-slate-400">({formatSize(a.size)})</span>
              </a>
              {(a.uploaded_by?.id === user?.id) && (
                <button onClick={() => handleDelete(a.id)} className="shrink-0 text-xs text-slate-400 hover:text-rose-500">Remove</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
