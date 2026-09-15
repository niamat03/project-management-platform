import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { authService, type LoginPayload, type RegisterPayload } from '../services/authService'
import { tokenStorage } from '../services/api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    if (!tokenStorage.getAccess()) {
      setUser(null)
      return
    }
    try {
      const me = await authService.me()
      setUser(me)
    } catch {
      tokenStorage.clear()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false))
  }, [refreshUser])

  const login = useCallback(async (payload: LoginPayload) => {
    await authService.login(payload)
    await refreshUser()
  }, [refreshUser])

  const register = useCallback(async (payload: RegisterPayload) => {
    await authService.register(payload)
    await authService.login({ username: payload.username, password: payload.password })
    await refreshUser()
  }, [refreshUser])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
