import { api } from './api'
import type { GlobalDashboard, ProjectDashboard } from '../types'

export const dashboardService = {
  async global() {
    const { data } = await api.get<GlobalDashboard>('/dashboard/')
    return data
  },

  async forProject(projectId: number) {
    const { data } = await api.get<ProjectDashboard>(`/projects/${projectId}/dashboard/`)
    return data
  },
}
