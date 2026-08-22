import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem(api.TOKEN_STORAGE_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { data } = await api.getMe()
      setUser(data)
    } catch {
      localStorage.removeItem(api.TOKEN_STORAGE_KEY)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const signIn = async (email, password) => {
    const { data } = await api.login(email, password)
    localStorage.setItem(api.TOKEN_STORAGE_KEY, data.access_token)
    const me = await api.getMe()
    setUser(me.data)
    return me.data
  }

  const signOut = () => {
    localStorage.removeItem(api.TOKEN_STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
