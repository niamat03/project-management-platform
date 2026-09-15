import { api, tokenStorage } from './api'
import type { User } from '../types'

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
}

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await api.post('/auth/login/', payload)
    tokenStorage.set(data.access, data.refresh)
    return data
  },

  async register(payload: RegisterPayload) {
    const { data } = await api.post('/auth/register/', payload)
    return data
  },

  logout() {
    tokenStorage.clear()
  },

  async me(): Promise<User> {
    const { data } = await api.get('/auth/me/')
    return data
  },

  async updateProfile(payload: Partial<{ first_name: string; last_name: string; bio: string; job_title: string; avatar: File }>) {
    const form = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) form.append(key, value as any)
    })
    const { data } = await api.patch('/auth/me/profile/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async changePassword(oldPassword: string, newPassword: string) {
    const { data } = await api.post('/auth/me/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    })
    return data
  },

  async requestPasswordReset(email: string) {
    const { data } = await api.post('/auth/password-reset/', { email })
    return data
  },

  async confirmPasswordReset(uid: string, token: string, newPassword: string) {
    const { data } = await api.post('/auth/password-reset/confirm/', {
      uid, token, new_password: newPassword,
    })
    return data
  },

  async searchUsers(query: string) {
    const { data } = await api.get('/auth/users/search/', { params: { q: query } })
    return data
  },

  isAuthenticated() {
    return Boolean(tokenStorage.getAccess())
  },
}
