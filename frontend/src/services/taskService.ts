import { api } from './api'
import type { Paginated, Tag, Task } from '../types'

export interface TaskFilters {
  project?: number
  status?: string
  priority?: string
  assignee?: number
  overdue?: boolean
  due_before?: string
  due_after?: string
  search?: string
  ordering?: string
  page?: number
  page_size?: number
}

export interface TaskPayload {
  project?: number
  column?: number | null
  title: string
  description?: string
  priority?: string
  status?: string
  start_date?: string | null
  due_date?: string | null
  estimated_hours?: number | null
  actual_hours?: number | null
  progress?: number
  parent_task?: number | null
  tags?: number[]
  location_name?: string
  address?: string
  spatial_type?: string | null
  location_visibility?: string
  geometry?: any
}

export const taskService = {
  async list(filters: TaskFilters = {}) {
    const { data } = await api.get<Paginated<Task>>('/tasks/', { params: filters })
    return data
  },

  /**
   * Fetches every task matching the filters, following pagination pages.
   * Use this (never a single `list()` call) anywhere that needs the full
   * set at once - a Kanban board, a calendar, "my tasks" - since those
   * views group/render everything client-side rather than paging a table.
   * Capped at 20 pages (10k tasks at the max page size) as a sanity limit.
   */
  async listAll(filters: TaskFilters = {}): Promise<Task[]> {
    const pageSize = filters.page_size ?? 500
    const results: Task[] = []
    let page = 1
    for (; page <= 20; page++) {
      const data = await this.list({ ...filters, page, page_size: pageSize })
      results.push(...data.results)
      if (!data.next) break
    }
    return results
  },

  async get(id: number) {
    const { data } = await api.get<Task>(`/tasks/${id}/`)
    return data
  },

  async create(payload: TaskPayload) {
    const { data } = await api.post<Task>('/tasks/', payload)
    return data
  },

  async update(id: number, payload: Partial<TaskPayload>) {
    const { data } = await api.patch<Task>(`/tasks/${id}/`, payload)
    return data
  },

  async remove(id: number) {
    await api.delete(`/tasks/${id}/`)
  },

  async move(id: number, column: number, position: number) {
    const { data } = await api.post<Task>(`/tasks/${id}/move/`, { column, position })
    return data
  },

  async assign(id: number, userId: number) {
    const { data } = await api.post<Task>(`/tasks/${id}/assign/`, { user_id: userId })
    return data
  },

  async unassign(id: number, userId: number) {
    const { data } = await api.post<Task>(`/tasks/${id}/unassign/`, { user_id: userId })
    return data
  },

  async uploadAttachment(id: number, file: File) {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post(`/tasks/${id}/attachments/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async deleteAttachment(id: number, attachmentId: number) {
    await api.delete(`/tasks/${id}/attachments/${attachmentId}/`)
  },

  async listTags(projectId: number): Promise<Tag[]> {
    const { data } = await api.get(`/projects/${projectId}/tags/`)
    return data
  },

  async createTag(projectId: number, name: string, color: string): Promise<Tag> {
    const { data } = await api.post(`/projects/${projectId}/tags/`, { name, color })
    return data
  },
}
