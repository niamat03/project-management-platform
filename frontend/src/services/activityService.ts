import { api } from './api'
import type { Activity, Paginated } from '../types'

export const activityService = {
  async forProject(projectId: number) {
    const { data } = await api.get<Paginated<Activity>>(`/projects/${projectId}/activity/`)
    return data
  },

  async forTask(taskId: number) {
    const { data } = await api.get<Paginated<Activity>>(`/tasks/${taskId}/activity/`)
    return data
  },
}
