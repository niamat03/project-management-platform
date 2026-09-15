import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { TaskDetailModal } from '../components/tasks/TaskDetailModal'
import { LoadingState } from '../components/ui/States'
import { taskService } from '../services/taskService'

/** Deep link target for notifications/comments: /tasks/:taskId opens the task
 * detail modal directly, then sends the user back to that task's board. */
export function TaskRedirectPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const id = Number(taskId)

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskService.get(id),
    enabled: Number.isFinite(id),
  })

  if (isLoading) return <div className="p-6"><LoadingState /></div>

  return (
    <TaskDetailModal
      taskId={id}
      open
      onClose={() => navigate(task ? `/projects/${task.project}/board` : '/projects')}
    />
  )
}
