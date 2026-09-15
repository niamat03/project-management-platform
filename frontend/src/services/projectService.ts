import { api } from './api'
import type { Board, BoardColumn, Paginated, Project, ProjectMember, ProjectRole } from '../types'

export interface ProjectFilters {
  status?: string
  priority?: string
  search?: string
  ordering?: string
}

export interface ProjectPayload {
  name: string
  description?: string
  status?: string
  priority?: string
  start_date?: string | null
  end_date?: string | null
  location_name?: string
  address?: string
  spatial_type?: string | null
  location_visibility?: string
  geometry?: any
}

export const projectService = {
  async list(filters: ProjectFilters = {}) {
    const { data } = await api.get<Paginated<Project>>('/projects/', { params: filters })
    return data
  },

  async get(id: number) {
    const { data } = await api.get<Project>(`/projects/${id}/`)
    return data
  },

  async create(payload: ProjectPayload) {
    const { data } = await api.post<Project>('/projects/', payload)
    return data
  },

  async update(id: number, payload: Partial<ProjectPayload>) {
    const { data } = await api.patch<Project>(`/projects/${id}/`, payload)
    return data
  },

  async remove(id: number) {
    await api.delete(`/projects/${id}/`)
  },

  async board(id: number) {
    const { data } = await api.get<Board>(`/projects/${id}/board/`)
    return data
  },

  async members(id: number) {
    const { data } = await api.get<ProjectMember[]>(`/projects/${id}/members/`)
    return data
  },

  async addMember(id: number, userId: number, role: ProjectRole) {
    const { data } = await api.post<ProjectMember>(`/projects/${id}/members/`, { user_id: userId, role })
    return data
  },

  async updateMemberRole(id: number, memberId: number, role: ProjectRole) {
    const { data } = await api.patch<ProjectMember>(`/projects/${id}/members/${memberId}/`, { role })
    return data
  },

  async removeMember(id: number, memberId: number) {
    await api.delete(`/projects/${id}/members/${memberId}/`)
  },

  async createColumn(projectId: number, name: string, position: number) {
    const { data } = await api.post<BoardColumn>(`/projects/${projectId}/columns/`, { name, position })
    return data
  },

  async updateColumn(projectId: number, columnId: number, payload: Partial<BoardColumn>) {
    const { data } = await api.patch<BoardColumn>(`/projects/${projectId}/columns/${columnId}/`, payload)
    return data
  },

  async deleteColumn(projectId: number, columnId: number) {
    await api.delete(`/projects/${projectId}/columns/${columnId}/`)
  },
}
