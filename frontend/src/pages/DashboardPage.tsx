import {
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ActivityTimeline } from '../components/activity/ActivityTimeline'
import { StatCard } from '../components/dashboard/StatCard'
import { TaskCard } from '../components/tasks/TaskCard'
import { ProjectStatusBadge } from '../components/ui/StatusBadge'
import { ErrorState, LoadingState } from '../components/ui/States'
import { useAuth } from '../contexts/AuthContext'
import { dashboardService } from '../services/dashboardService'

export function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'global'],
    queryFn: dashboardService.global,
  })

  if (isLoading) return <div className="p-6"><LoadingState label="Loading your dashboard…" /></div>
  if (isError || !data) return <div className="p-6"><ErrorState message="Could not load the dashboard." /></div>

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {user?.first_name || user?.username}</h1>
        <p className="mt-1 text-sm text-slate-500">Here's what's happening across your projects.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Projects" value={data.stats.total_projects} icon={FolderIcon} tone="brand" />
        <StatCard label="Active" value={data.stats.active_projects} icon={FolderIcon} tone="emerald" />
        <StatCard label="Completed" value={data.stats.completed_projects} icon={CheckCircleIcon} tone="slate" />
        <StatCard label="Total Tasks" value={data.stats.total_tasks} icon={ClipboardDocumentListIcon} tone="brand" />
        <StatCard label="Done" value={data.stats.completed_tasks} icon={CheckCircleIcon} tone="emerald" />
        <StatCard label="Overdue" value={data.stats.overdue_tasks} icon={ExclamationTriangleIcon} tone="rose" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Due today</h2>
            </div>
            {data.due_today.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing due today. Enjoy the calm.</p>
            ) : (
              <div className="space-y-2">
                {data.due_today.map((task) => <TaskCard key={task.id} task={task} />)}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Upcoming deadlines</h2>
            {data.upcoming_deadlines.length === 0 ? (
              <p className="text-sm text-slate-400">No deadlines in the next 7 days.</p>
            ) : (
              <div className="space-y-2">
                {data.upcoming_deadlines.map((task) => <TaskCard key={task.id} task={task} />)}
              </div>
            )}
          </section>

          {data.overdue_tasks.length > 0 && (
            <section className="rounded-xl border border-rose-200 bg-rose-50/40 p-5">
              <h2 className="mb-3 text-sm font-semibold text-rose-700">Overdue tasks</h2>
              <div className="space-y-2">
                {data.overdue_tasks.map((task) => <TaskCard key={task.id} task={task} />)}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">My projects</h2>
              <Link to="/projects" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>
            </div>
            <div className="space-y-2">
              {data.my_projects.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50">
                  <span className="truncate text-sm font-medium text-slate-700">{p.name}</span>
                  <ProjectStatusBadge status={p.status} />
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Recent activity</h2>
            <ActivityTimeline activities={data.recent_activity} />
          </section>
        </div>
      </div>
    </div>
  )
}
