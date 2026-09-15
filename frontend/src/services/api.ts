import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useLoadingStore } from '../stores/loadingStore'

const ACCESS_TOKEN_KEY = 'pmp_access_token'
const REFRESH_TOKEN_KEY = 'pmp_refresh_token'

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  },
  setAccess: (access: string) => localStorage.setItem(ACCESS_TOKEN_KEY, access),
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

export const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  useLoadingStore.getState().increment()
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh()
  if (!refresh) return null
  try {
    const { data } = await axios.post('/api/auth/token/refresh/', { refresh })
    tokenStorage.setAccess(data.access)
    return data.access as string
  } catch {
    tokenStorage.clear()
    return null
  }
}

// Every request that entered via the request interceptor above releases its
// own increment exactly once here, whether it succeeds, fails outright, or
// gets silently retried after a token refresh (that retry is itself a new
// request, so it increments/decrements again on its own).
api.interceptors.response.use(
  (response) => {
    useLoadingStore.getState().decrement()
    return response
  },
  async (error: AxiosError) => {
    useLoadingStore.getState().decrement()
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && original && !original._retry && tokenStorage.getRefresh()) {
      original._retry = true
      refreshPromise = refreshPromise ?? refreshAccessToken()
      const newToken = await refreshPromise
      refreshPromise = null
      if (newToken) {
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export function apiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return error.code === 'ECONNABORTED'
        ? 'The request took too long and timed out. Please try again.'
        : 'Could not reach the server. Check your connection and try again.'
    }

    const { status, data } = error.response
    if (status >= 500) return 'The server ran into a problem on its end. Please try again shortly.'
    if (status === 403) return 'You do not have permission to do that.'
    if (status === 404 && (data as any)?.detail === 'Not Found') return 'That item could not be found.'

    if (typeof data === 'string') return data
    if (data && typeof data === 'object') {
      if ((data as any).detail) return (data as any).detail
      const firstKey = Object.keys(data)[0]
      const value = (data as any)[firstKey]
      if (Array.isArray(value)) return `${firstKey}: ${value[0]}`
      if (typeof value === 'string') return value
    }
  }
  return fallback
}
