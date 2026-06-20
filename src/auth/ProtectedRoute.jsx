import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth()

  // React Router v6 navigates synchronously (useSyncExternalStore) before
  // React commits the setUser() state update from login(). Read localStorage
  // directly so ProtectedRoute never sees a false-null user right after login.
  const effectiveUser = user ?? (() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })()

  if (!effectiveUser) return <Navigate to="/login" replace />

  if (roles) {
    const userRoles = effectiveUser.roles ?? []
    const allowed = roles.some(required =>
      userRoles.some(ur => ur.toUpperCase().includes(required.toUpperCase()))
    )
    if (!allowed) return <Navigate to="/unauthorized" replace />
  }

  return children
}
