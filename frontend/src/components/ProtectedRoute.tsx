import { Navigate, useLocation } from 'react-router-dom'

import useAuthStore from '@/store/authStore'

export interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Renders children when the user is authenticated; otherwise redirects to /login?from=currentPath.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()
  const from = location.pathname + location.search

  if (!isAuthenticated) {
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />
  }

  return <>{children}</>
}
