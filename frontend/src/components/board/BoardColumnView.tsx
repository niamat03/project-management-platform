import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { PlusIcon } from '@heroicons/react/24/outline'
import type { BoardColumn, Task } from '../../types'
import { SortableTaskCard } from './SortableTaskCard'

interface BoardColumnViewProps {
  column: BoardColumn
  tasks: Task[]
  onOpenTask: (task: Task) => void
  onAddTask: (columnId: number) => void
}

export function BoardColumnView({ column, tasks, onOpenTask, onAddTask }: BoardColumnViewProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${column.id}`, data: { type: 'column', columnId: column.id } })

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-slate-100/70">
      <div className="flex items-center justify-between px-3 pt-3">
        <h3 className="text-sm font-semibold text-slate-700">
          {column.name} <span className="ml-1 text-xs font-normal text-slate-400">{tasks.length}</span>
        </h3>
        <button onClick={() => onAddTask(column.id)} className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-600" aria-label={`Add task to ${column.name}`}>
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto p-3 scrollbar-thin ${isOver ? 'bg-brand-50/60' : ''}`}
        style={{ minHeight: 120 }}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
