import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { MonthCalendar } from '../components/calendar/MonthCalendar'
import { TaskDetailModal } from '../components/tasks/TaskDetailModal'
import { ErrorState, LoadingState } from '../components/ui/States'
import { taskService } from '../services/taskService'

export function CalendarPage() {
  const [openTaskId, setOpenTaskId] = useState<number | null>(null)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['tasks', 'all-calendar'],
    queryFn: () => taskService.listAll({}),
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Calendar</h1>
        <p className="mt-1 text-sm text-slate-500">Every task with a due date, across all your projects.</p>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState />}
      {data && <MonthCalendar tasks={data} onSelectTask={(task) => setOpenTaskId(task.id)} />}

      {openTaskId != null && <TaskDetailModal taskId={openTaskId} open onClose={() => setOpenTaskId(null)} />}
    </div>
  )
}
