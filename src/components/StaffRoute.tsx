import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function StaffRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton h-8 w-40" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Staff, manager, and admin all get dashboard access; plain customers are redirected away.
  if (!profile || !['staff', 'manager', 'admin'].includes(profile.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
