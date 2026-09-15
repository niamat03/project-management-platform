import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { MonthCalendar } from '../../components/calendar/MonthCalendar'
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { taskService } from '../../services/taskService'
import { useProjectOutlet } from './useProjectOutlet'

export function ProjectCalendarPage() {
  const { project } = useProjectOutlet()
  const [openTaskId, setOpenTaskId] = useState<number | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tasks', project.id, 'calendar'],
    queryFn: () => taskService.listAll({ project: project.id }),
  })

  if (isLoading) return <div className="p-6"><LoadingState /></div>
  if (isError) return <div className="p-6"><ErrorState /></div>

  return (
    <div className="p-6">
      <MonthCalendar tasks={data ?? []} onSelectTask={(task) => setOpenTaskId(task.id)} />
      {openTaskId != null && <TaskDetailModal taskId={openTaskId} open onClose={() => setOpenTaskId(null)} />}
    </div>
  )
}
