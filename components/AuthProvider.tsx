'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Проверка сессии при загрузке
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setUser(data.user || null)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  // Обертка для setUser, которая также обновляет состояние
  const handleSetUser = (newUser: User | null) => {
    setUser(newUser)
    if (newUser) {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

