import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { BoardColumnView } from '../../components/board/BoardColumnView'
import { ManageColumnsModal } from '../../components/board/ManageColumnsModal'
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal'
import { TaskCard } from '../../components/tasks/TaskCard'
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { useProjectSocket } from '../../hooks/useProjectSocket'
import { apiErrorMessage } from '../../services/api'
import { projectService } from '../../services/projectService'
import { taskService } from '../../services/taskService'
import type { Task } from '../../types'
import { useProjectOutlet } from './useProjectOutlet'

export function ProjectBoardPage() {
  const { project } = useProjectOutlet()
  const queryClient = useQueryClient()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [openTaskId, setOpenTaskId] = useState<number | null>(null)
  const [createColumnId, setCreateColumnId] = useState<number | null>(null)
  const [manageColumnsOpen, setManageColumnsOpen] = useState(false)

  const boardQuery = useQuery({
    queryKey: ['board', project.id],
    queryFn: () => projectService.board(project.id),
  })

  const tasksQuery = useQuery({
    queryKey: ['tasks', project.id],
    // listAll follows pagination pages - a board must show every task, not
    // just the first page (see BoundedPageNumberPagination on the backend).
    queryFn: () => taskService.listAll({ project: project.id, ordering: 'position' }),
  })

  useProjectSocket(project.id, {
    'task.created': () => queryClient.invalidateQueries({ queryKey: ['tasks', project.id] }),
    'task.updated': () => queryClient.invalidateQueries({ queryKey: ['tasks', project.id] }),
    'task.moved': () => queryClient.invalidateQueries({ queryKey: ['tasks', project.id] }),
    'task.deleted': () => queryClient.invalidateQueries({ queryKey: ['tasks', project.id] }),
    'task.assigned': () => queryClient.invalidateQueries({ queryKey: ['tasks', project.id] }),
    'task.unassigned': () => queryClient.invalidateQueries({ queryKey: ['tasks', project.id] }),
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const tasksByColumn = useMemo(() => {
    const map = new Map<number, Task[]>()
    for (const column of boardQuery.data?.columns ?? []) map.set(column.id, [])
    for (const task of tasksQuery.data ?? []) {
      if (task.column == null) continue
      const list = map.get(task.column)
      if (list) list.push(task)
    }
    for (const list of map.values()) list.sort((a, b) => a.position - b.position)
    return map
  }, [boardQuery.data, tasksQuery.data])

  const findColumnOfTask = (taskId: number) => {
    for (const [columnId, tasks] of tasksByColumn.entries()) {
      if (tasks.some((t) => t.id === taskId)) return columnId
    }
    return null
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined
    setActiveTask(task ?? null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const taskId = Number(active.id)
    const sourceColumnId = findColumnOfTask(taskId)
    let destColumnId: number
    let destTasks: Task[]

    if (over.data.current?.type === 'column') {
      destColumnId = over.data.current.columnId
      destTasks = tasksByColumn.get(destColumnId) ?? []
    } else {
      destColumnId = findColumnOfTask(Number(over.id)) ?? sourceColumnId!
      destTasks = tasksByColumn.get(destColumnId) ?? []
    }

    if (sourceColumnId === null || destColumnId == null) return

    const overIndex = destTasks.findIndex((t) => t.id === Number(over.id))
    const filtered = destTasks.filter((t) => t.id !== taskId)
    const insertAt = overIndex === -1 ? filtered.length : overIndex

    const before = filtered[insertAt - 1]
    const after = filtered[insertAt]
    let newPosition: number
    if (!before && !after) newPosition = 1000
    else if (!before) newPosition = after.position - 1
    else if (!after) newPosition = before.position + 1
    else newPosition = (before.position + after.position) / 2

    if (destColumnId === sourceColumnId && insertAt === destTasks.findIndex((t) => t.id === taskId)) {
      return // no-op drop
    }

    queryClient.setQueryData(['tasks', project.id], (old: Task[] | undefined) => {
      if (!old) return old
      return old.map((t) => (t.id === taskId ? { ...t, column: destColumnId, position: newPosition } : t))
    })

    try {
      await taskService.move(taskId, destColumnId, newPosition)
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not move task.'))
      queryClient.invalidateQueries({ queryKey: ['tasks', project.id] })
    }
  }

  if (boardQuery.isLoading || tasksQuery.isLoading) return <div className="p-6"><LoadingState /></div>
  if (boardQuery.isError || tasksQuery.isError) return <div className="p-6"><ErrorState message="Could not load the board." /></div>

  return (
    <div className="h-full p-6">
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
          {boardQuery.data?.columns.map((column) => (
            <BoardColumnView
              key={column.id}
              column={column}
              tasks={tasksByColumn.get(column.id) ?? []}
              onOpenTask={(task) => setOpenTaskId(task.id)}
              onAddTask={setCreateColumnId}
            />
          ))}
          <button
            className="flex h-fit shrink-0 items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-400 hover:border-brand-300 hover:text-brand-600"
            onClick={() => setManageColumnsOpen(true)}
          >
            <Cog6ToothIcon className="h-4 w-4" />
            Manage columns
          </button>
        </div>
        <DragOverlay>{activeTask && <TaskCard task={activeTask} onClick={() => {}} />}</DragOverlay>
      </DndContext>

      {createColumnId != null && (
        <CreateTaskModal
          projectId={project.id}
          columnId={createColumnId}
          open
          onClose={() => setCreateColumnId(null)}
        />
      )}
      {openTaskId != null && (
        <TaskDetailModal taskId={openTaskId} open onClose={() => setOpenTaskId(null)} />
      )}
      {manageColumnsOpen && (
        <ManageColumnsModal
          projectId={project.id}
          columns={boardQuery.data?.columns ?? []}
          open
          onClose={() => setManageColumnsOpen(false)}
        />
      )}
    </div>
  )
}
