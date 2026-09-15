import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { notificationService } from '../services/notificationService'

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: notificationService.list,
  })

  const markRead = async (id: number) => {
    await notificationService.markRead(id)
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  const markAllRead = async () => {
    await notificationService.markAllRead()
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  const targetFor = (n: { project: number | null; task: number | null }) => {
    if (n.task) return `/tasks/${n.task}`
    if (n.project) return `/projects/${n.project}`
    return '#'
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        <button onClick={markAllRead} className="text-sm font-medium text-brand-600 hover:underline">Mark all read</button>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState />}
      {data?.results.length === 0 && <EmptyState title="No notifications" />}

      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {data?.results.map((n) => (
          <Link
            key={n.id}
            to={targetFor(n)}
            onClick={() => !n.is_read && markRead(n.id)}
            className={`block px-4 py-3 hover:bg-slate-50 ${n.is_read ? '' : 'bg-brand-50/40'}`}
          >
            <p className="text-sm text-slate-800">{n.message}</p>
            <p className="mt-1 text-xs text-slate-400">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
