import { PlusIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { CreateProjectModal } from '../components/projects/CreateProjectModal'
import { ProjectCard } from '../components/projects/ProjectCard'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { projectService } from '../services/projectService'

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

export function ProjectsListPage() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects', { status, search }],
    queryFn: () => projectService.list({ status: status || undefined, search: search || undefined }),
  })

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">All the workspaces you're a member of.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <PlusIcon className="h-4 w-4" />
          New project
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects…"
          className="w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                status === f.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Could not load projects." />}
      {!isLoading && data?.results.length === 0 && (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start organizing work."
          action={
            <button onClick={() => setCreateOpen(true)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Create a project
            </button>
          }
        />
      )}
      {data && data.results.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.results.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
