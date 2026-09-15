import { api } from './api'
import type { UserSummary } from '../types'

export const userService = {
  async search(query: string): Promise<UserSummary[]> {
    const { data } = await api.get('/auth/users/search/', { params: { q: query } })
    return data
  },
}
