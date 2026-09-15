import { useQuery } from '@tanstack/react-query'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ActivityTimeline } from '../../components/activity/ActivityTimeline'
import { TaskCard } from '../../components/tasks/TaskCard'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { dashboardService } from '../../services/dashboardService'
import { useProjectOutlet } from './useProjectOutlet'

const PRIORITY_COLORS: Record<string, string> = {
  low: '#94a3b8', medium: '#38bdf8', high: '#f59e0b', critical: '#f43f5e',
}
const STATUS_COLORS: Record<string, string> = {
  todo: '#94a3b8', in_progress: '#6366f1', in_review: '#8b5cf6', done: '#10b981', blocked: '#f43f5e',
}

export function ProjectOverviewPage() {
  const { project } = useProjectOutlet()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['project-dashboard', project.id],
    queryFn: () => dashboardService.forProject(project.id),
  })

  if (isLoading) return <div className="p-6"><LoadingState /></div>
  if (isError || !data) return <div className="p-6"><ErrorState message="Could not load project overview." /></div>

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-400">Progress</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{data.progress}%</p>
          <div className="mt-3 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-brand-500" style={{ width: `${data.progress}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-400">Tasks</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{data.task_stats.completed}/{data.task_stats.total}</p>
          <p className="mt-1 text-xs text-slate-400">completed</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-400">Team</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{data.member_count}</p>
          <p className="mt-1 text-xs text-slate-400">members</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Status distribution</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.status_distribution} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {data.status_distribution.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Priority distribution</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.priority_distribution} dataKey="count" nameKey="priority" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {data.priority_distribution.map((entry) => (
                    <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Upcoming deadlines</h2>
          <div className="space-y-2">
            {data.upcoming_deadlines.length === 0
              ? <p className="text-sm text-slate-400">Nothing coming up.</p>
              : data.upcoming_deadlines.map((t) => <TaskCard key={t.id} task={t} />)}
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Recent activity</h2>
          <ActivityTimeline activities={data.recent_activity} />
        </section>
      </div>
    </div>
  )
}
