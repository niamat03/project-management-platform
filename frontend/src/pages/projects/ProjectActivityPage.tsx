import { useQuery } from '@tanstack/react-query'
import { ActivityTimeline } from '../../components/activity/ActivityTimeline'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { activityService } from '../../services/activityService'
import { useProjectOutlet } from './useProjectOutlet'

export function ProjectActivityPage() {
  const { project } = useProjectOutlet()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['project-activity', project.id],
    queryFn: () => activityService.forProject(project.id),
  })

  if (isLoading) return <div className="p-6"><LoadingState /></div>
  if (isError) return <div className="p-6"><ErrorState /></div>

  return (
    <div className="mx-auto max-w-2xl p-6">
      <ActivityTimeline activities={data?.results ?? []} />
    </div>
  )
}
