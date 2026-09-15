import { useQuery } from '@tanstack/react-query'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { PriorityBadge } from '../../components/ui/PriorityBadge'
import { ProjectStatusBadge } from '../../components/ui/StatusBadge'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { projectService } from '../../services/projectService'

const TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'board', label: 'Board' },
  { to: 'list', label: 'List' },
  { to: 'calendar', label: 'Calendar' },
  { to: 'map', label: 'Map' },
  { to: 'activity', label: 'Activity' },
  { to: 'members', label: 'Members' },
  { to: 'settings', label: 'Settings' },
]

export function ProjectDetailLayout() {
  const { projectId } = useParams()
  const id = Number(projectId)

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.get(id),
    enabled: Number.isFinite(id),
  })

  if (isLoading) return <div className="p-6"><LoadingState /></div>
  if (isError || !project) return <div className="p-6"><ErrorState message="Project not found." /></div>

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 pt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
            <p className="mt-1 max-w-2xl truncate text-sm text-slate-500">{project.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Outlet context={{ project }} />
      </div>
    </div>
  )
}
