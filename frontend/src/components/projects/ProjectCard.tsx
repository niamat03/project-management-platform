import { MapPinIcon, UsersIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import type { Project } from '../../types'
import { PriorityBadge } from '../ui/PriorityBadge'
import { ProjectStatusBadge } from '../ui/StatusBadge'

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="truncate text-sm font-semibold text-slate-900">{project.name}</h3>
        <PriorityBadge priority={project.priority} />
      </div>
      <p className="mb-4 line-clamp-2 flex-1 text-sm text-slate-500">
        {project.description || 'No description yet.'}
      </p>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <ProjectStatusBadge status={project.status} />
        <span className="flex items-center gap-1">
          <UsersIcon className="h-3.5 w-3.5" />
          {project.member_count}
        </span>
        {project.location_name && (
          <span className="flex items-center gap-1 truncate">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
            {project.location_name}
          </span>
        )}
      </div>
    </Link>
  )
}
