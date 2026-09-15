import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameMonth, isToday, startOfMonth, startOfWeek, subMonths,
} from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useMemo, useState } from 'react'
import type { Task } from '../../types'

export function MonthCalendar({ tasks, onSelectTask }: { tasks: Task[]; onSelectTask: (task: Task) => void }) {
  const [cursor, setCursor] = useState(new Date())

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor))
    const end = endOfWeek(endOfMonth(cursor))
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      if (!task.due_date) continue
      const key = task.due_date
      map.set(key, [...(map.get(key) ?? []), task])
    }
    return map
  }, [tasks])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{format(cursor, 'MMMM yyyy')}</h2>
        <div className="flex gap-1">
          <button onClick={() => setCursor(subMonths(cursor, 1))} className="rounded-lg p-1.5 hover:bg-slate-100">
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button onClick={() => setCursor(new Date())} className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100">Today</button>
          <button onClick={() => setCursor(addMonths(cursor, 1))} className="rounded-lg p-1.5 hover:bg-slate-100">
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-100 bg-slate-100 text-xs">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="bg-slate-50 px-2 py-1.5 text-center font-medium text-slate-400">{d}</div>
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayTasks = tasksByDay.get(key) ?? []
          return (
            <div key={key} className={`min-h-24 bg-white p-1.5 ${isSameMonth(day, cursor) ? '' : 'bg-slate-50/50 text-slate-300'}`}>
              <p className={`mb-1 text-xs font-medium ${isToday(day) ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white' : 'text-slate-400'}`}>
                {format(day, 'd')}
              </p>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="block w-full truncate rounded bg-slate-50 px-1 py-0.5 text-left text-[11px] text-slate-600 hover:bg-brand-50"
                    title={task.title}
                  >
                    {task.title}
                  </button>
                ))}
                {dayTasks.length > 3 && <p className="text-[10px] text-slate-400">+{dayTasks.length - 3} more</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
