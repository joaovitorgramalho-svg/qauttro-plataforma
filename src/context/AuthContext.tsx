import { createContext, useContext, useState, ReactNode } from 'react'
import type { User } from '@/types'

const DEMO_USERS: User[] = [
  { id: '1', name: 'Admin Quattro', email: 'admin@quattro.com', role: 'admin' },
  { id: '2', name: 'Gerente', email: 'gerente@quattro.com', role: 'manager' },
]

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('quattro_user')
    return stored ? (JSON.parse(stored) as User) : null
  })

  function login(email: string, _password: string): boolean {
    const found = DEMO_USERS.find(u => u.email === email)
    if (!found) return false
    setUser(found)
    localStorage.setItem('quattro_user', JSON.stringify(found))
    return true
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('quattro_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
