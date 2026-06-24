import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

// Decode the JWT payload and return its `exp` (seconds), or null if unreadable.
function tokenExp(token) {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json).exp ?? null
  } catch { return null }
}

// A stored session is only valid if the token exists AND has not expired.
function isSessionValid(token) {
  const exp = token ? tokenExp(token) : null
  return exp != null && exp * 1000 > Date.now()
}

function clearStoredSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function AuthProvider({ children }) {
  // On load, trust the saved session only if the token is present and unexpired.
  // An expired/garbage token is cleared here so the login form is shown instead
  // of silently entering a dead session.
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('token')
    if (isSessionValid(t)) return t
    clearStoredSession()
    return null
  })
  const [user, setUser] = useState(() => {
    if (!localStorage.getItem('token')) return null
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const navigate = useNavigate()

  const login = (tokenStr, userData) => {
    localStorage.setItem('token', tokenStr)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(tokenStr)
    setUser(userData)
  }

  const logout = () => {
    clearStoredSession()
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

  // Auto sign-out the moment the token expires while the app is open.
  useEffect(() => {
    if (!token) return
    const exp = tokenExp(token)
    if (exp == null) return
    const msLeft = exp * 1000 - Date.now()
    if (msLeft <= 0) { logout(); navigate('/login', { replace: true }); return }
    const timer = setTimeout(() => { logout(); navigate('/login', { replace: true }) }, msLeft)
    return () => clearTimeout(timer)
  }, [token])

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
