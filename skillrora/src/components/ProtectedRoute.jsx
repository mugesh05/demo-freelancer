import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="sk-page-loader" aria-live="polite">
        <div className="sk-skeleton sk-skeleton-hero" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    const fallback = user.role === 'client' ? '/client-dashboard' : '/dashboard'
    return <Navigate to={fallback} replace />
  }

  return children
}
