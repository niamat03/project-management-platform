import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ProjectCard } from '../components/projects/ProjectCard'
import { TaskCard } from '../components/tasks/TaskCard'
import { EmptyState, LoadingState } from '../components/ui/States'
import { projectService } from '../services/projectService'
import { taskService } from '../services/taskService'
import { userService } from '../services/userService'

export function SearchPage() {
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''

  const projects = useQuery({
    queryKey: ['search-projects', query],
    queryFn: () => projectService.list({ search: query }),
    enabled: query.length > 0,
  })
  const tasks = useQuery({
    queryKey: ['search-tasks', query],
    queryFn: () => taskService.list({ search: query }),
    enabled: query.length > 0,
  })
  const users = useQuery({
    queryKey: ['search-users', query],
    queryFn: () => userService.search(query),
    enabled: query.length > 0,
  })

  const isLoading = projects.isLoading || tasks.isLoading || users.isLoading
  const hasResults = (projects.data?.results.length ?? 0) + (tasks.data?.results.length ?? 0) + (users.data?.length ?? 0) > 0

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <h1 className="text-xl font-semibold text-slate-900">Search results for "{query}"</h1>

      {isLoading && <LoadingState />}
      {!isLoading && !hasResults && <EmptyState title="No results found" description="Try a different search term." />}

      {(projects.data?.results.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Projects</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {projects.data!.results.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </section>
      )}

      {(tasks.data?.results.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Tasks</h2>
          <div className="space-y-2">
            {tasks.data!.results.map((t) => <TaskCard key={t.id} task={t} />)}
          </div>
        </section>
      )}

      {(users.data?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">People</h2>
          <div className="flex flex-wrap gap-2">
            {users.data!.map((u) => (
              <span key={u.id} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">{u.username}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
