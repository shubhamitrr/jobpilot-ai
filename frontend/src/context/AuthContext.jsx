import React, { createContext, useContext, useState, useCallback } from 'react'
import api, { getErrorMessage } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('jobpilot_user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(false)

  const persist = (token, userData) => {
    localStorage.setItem('jobpilot_token', token)
    localStorage.setItem('jobpilot_user', JSON.stringify(userData))
    setUser(userData)
  }

  const register = useCallback(async ({ email, password, full_name }) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', { email, password, full_name })
      persist(data.access_token, data.user)
      return { success: true }
    } catch (err) {
      return { success: false, error: getErrorMessage(err) }
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      persist(data.access_token, data.user)
      return { success: true }
    } catch (err) {
      return { success: false, error: getErrorMessage(err) }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('jobpilot_token')
    localStorage.removeItem('jobpilot_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
