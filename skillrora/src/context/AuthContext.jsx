import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(getToken()))
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const refreshNotifications = useCallback(async () => {
    if (!getToken()) { setUnreadNotifications(0); return }
    try {
      const data = await api('/api/notifications')
      setUnreadNotifications(data.unread || 0)
    } catch {
      // ignore background poll errors
    }
  }, [])

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return null
    }
    try {
      const data = await api('/api/auth/me')
      setUser(data.user)
      await refreshNotifications()
      return data.user
    } catch {
      setToken(null)
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [refreshNotifications])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email, password) => {
    const data = await api('/api/auth/login', { method: 'POST', body: { email, password } })
    setToken(data.token)
    setUser(data.user)
    await refreshNotifications()
    return data.user
  }

  const register = async (payload) => {
    const data = await api('/api/auth/register', { method: 'POST', body: payload })
    setToken(data.token)
    setUser(data.user)
    await refreshNotifications()
    return data.user
  }

  const logout = async () => {
    try { await api('/api/auth/logout', { method: 'POST' }) } catch { /* ignore */ }
    setToken(null)
    setUser(null)
    setUnreadNotifications(0)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      unreadNotifications,
      setUnreadNotifications,
      refreshNotifications,
      refreshUser,
      setUser,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
