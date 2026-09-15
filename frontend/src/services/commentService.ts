import { api } from './api'
import type { Comment } from '../types'

export const commentService = {
  async list(taskId: number) {
    const { data } = await api.get<Comment[]>(`/tasks/${taskId}/comments/`)
    return data
  },

  async create(taskId: number, content: string) {
    const { data } = await api.post<Comment>(`/tasks/${taskId}/comments/`, { content })
    return data
  },

  async update(taskId: number, commentId: number, content: string) {
    const { data } = await api.patch<Comment>(`/tasks/${taskId}/comments/${commentId}/`, { content })
    return data
  },

  async remove(taskId: number, commentId: number) {
    await api.delete(`/tasks/${taskId}/comments/${commentId}/`)
  },
}
