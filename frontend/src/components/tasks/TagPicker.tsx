import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { apiErrorMessage } from '../../services/api'
import { taskService } from '../../services/taskService'
import type { Task } from '../../types'

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#38bdf8', '#8b5cf6']

export function TagPicker({ task }: { task: Task }) {
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])

  const { data: allTags } = useQuery({
    queryKey: ['project-tags', task.project],
    queryFn: () => taskService.listTags(task.project),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['task', task.id] })
    queryClient.invalidateQueries({ queryKey: ['tasks', task.project] })
    queryClient.invalidateQueries({ queryKey: ['project-tags', task.project] })
  }

  const taggedIds = new Set(task.tags.map((t) => t.id))

  const toggleTag = async (tagId: number) => {
    const nextIds = taggedIds.has(tagId)
      ? task.tags.filter((t) => t.id !== tagId).map((t) => t.id)
      : [...task.tags.map((t) => t.id), tagId]
    try {
      await taskService.update(task.id, { tags: nextIds })
      invalidate()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not update tags.'))
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const tag = await taskService.createTag(task.project, name.trim(), color)
      await taskService.update(task.id, { tags: [...task.tags.map((t) => t.id), tag.id] })
      setName('')
      setCreating(false)
      invalidate()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not create tag.'))
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {allTags?.map((tag) => {
          const active = taggedIds.has(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className="rounded-full border px-2.5 py-1 text-xs font-medium transition-opacity"
              style={{
                backgroundColor: active ? tag.color : 'transparent',
                borderColor: tag.color,
                color: active ? '#fff' : tag.color,
                opacity: active ? 1 : 0.7,
              }}
            >
              {tag.name}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setCreating((c) => !c)}
          className="rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-400 hover:border-brand-300 hover:text-brand-600"
        >
          + New tag
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="mt-2 flex items-center gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tag name"
            className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs"
          />
          <div className="flex gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-5 w-5 rounded-full ${color === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button type="submit" className="rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white">Add</button>
        </form>
      )}
    </div>
  )
}
