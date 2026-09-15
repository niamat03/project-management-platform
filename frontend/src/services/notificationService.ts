import { api } from './api'
import type { Notification, Paginated } from '../types'

export const notificationService = {
  async list() {
    const { data } = await api.get<Paginated<Notification>>('/notifications/')
    return data
  },

  async unreadCount() {
    const { data } = await api.get<{ count: number }>('/notifications/unread-count/')
    return data.count
  },

  async markRead(id: number) {
    const { data } = await api.post<Notification>(`/notifications/${id}/mark-read/`)
    return data
  },

  async markAllRead() {
    const { data } = await api.post('/notifications/mark-all-read/')
    return data
  },
}
