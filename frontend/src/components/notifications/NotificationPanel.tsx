import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { BellIcon } from '@heroicons/react/24/outline'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import { notificationService } from '../../services/notificationService'
import { LoadingState, EmptyState } from '../ui/States'

export function NotificationPanel() {
  const queryClient = useQueryClient()

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationService.unreadCount,
    refetchInterval: 30000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: notificationService.list,
  })

  const markAllRead = async () => {
    await notificationService.markAllRead()
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  const markRead = async (id: number) => {
    await notificationService.markRead(id)
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  return (
    <Popover className="relative">
      <PopoverButton className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
        <BellIcon className="h-5 w-5" />
        {!!unreadCount && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverButton>
      <PopoverPanel anchor="bottom end" className="z-1100 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Notifications</p>
          <button onClick={markAllRead} className="text-xs font-medium text-brand-600 hover:underline">
            Mark all read
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {isLoading && <LoadingState />}
          {!isLoading && data?.results.length === 0 && (
            <div className="p-4"><EmptyState title="No notifications yet" /></div>
          )}
          {data?.results.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`block w-full border-b border-slate-50 px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                n.is_read ? 'text-slate-500' : 'bg-brand-50/40 text-slate-800'
              }`}
            >
              <p>{n.message}</p>
              <p className="mt-1 text-xs text-slate-400">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </p>
            </button>
          ))}
        </div>
        <div className="border-t border-slate-100 px-4 py-2 text-center">
          <Link to="/notifications" className="text-xs font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
      </PopoverPanel>
    </Popover>
  )
}
