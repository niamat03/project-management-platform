import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { apiErrorMessage } from '../../services/api'
import { commentService } from '../../services/commentService'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingState } from '../ui/States'

export function CommentSection({ taskId }: { taskId: number }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentService.list(taskId),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setIsSubmitting(true)
    try {
      await commentService.create(taskId, content.trim())
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-activity', taskId] })
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not post comment.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: number) => {
    try {
      await commentService.remove(taskId, commentId)
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] })
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not delete comment.'))
    }
  }

  return (
    <div className="space-y-4">
      {isLoading && <LoadingState label="Loading comments…" />}
      {!isLoading && comments?.length === 0 && (
        <p className="text-sm text-slate-400">No comments yet. Start the conversation.</p>
      )}
      <ul className="space-y-3">
        {comments?.map((c) => (
          <li key={c.id} className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
              {c.author.username[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-800">{c.author.username}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}{c.is_edited && ' · edited'}
                  </span>
                  {c.author.id === user?.id && (
                    <button onClick={() => handleDelete(c.id)} className="text-xs text-rose-500 hover:underline">Delete</button>
                  )}
                </div>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{c.content}</p>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment… use @username to mention"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          Send
        </button>
      </form>
    </div>
  )
}
