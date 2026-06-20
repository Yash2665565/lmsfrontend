import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const navigate = useNavigate()

  const login = (tokenStr, userData) => {
    localStorage.setItem('token', tokenStr)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(tokenStr)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  // Listen for 401 events dispatched by the axios interceptor so we can
  // do a soft React Router redirect instead of a hard page reload.
  useEffect(() => {
    const handle = () => { logout(); navigate('/login', { replace: true }) }
    window.addEventListener('auth:logout', handle)
    return () => window.removeEventListener('auth:logout', handle)
  }, [])

  const hasRole = (role) =>
    user?.roles?.some(r => r.toUpperCase().includes(role.toUpperCase()))
  const isAdmin   = () => hasRole('ADMIN')
  const isTeacher = () => hasRole('TEACHER')
  const isStudent = () => hasRole('STUDENT')
  const isParent  = () => hasRole('PARENT')

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole, isAdmin, isTeacher, isStudent, isParent }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
