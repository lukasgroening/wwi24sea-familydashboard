import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { Role } from '../types'

interface Props {
  children: React.ReactNode
  requiredRole?: Role
}

export default function AuthGuard({ children, requiredRole }: Props) {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated()) return <Navigate to="/login" replace />

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'System-Administrator') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
