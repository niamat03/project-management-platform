import { formatDistanceToNow } from 'date-fns'
import type { Activity } from '../../types'
import { EmptyState } from '../ui/States'

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <EmptyState title="No activity yet" description="Actions on this project will show up here." />
  }

  return (
    <ul className="space-y-4">
      {activities.map((activity) => (
        <li key={activity.id} className="flex gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {activity.actor?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1 border-b border-slate-100 pb-4">
            <p className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">{activity.actor?.username ?? 'Someone'}</span>{' '}
              {activity.description || activity.verb.replace(/_/g, ' ')}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
