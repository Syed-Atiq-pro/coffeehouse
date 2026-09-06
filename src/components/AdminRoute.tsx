import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton h-8 w-40" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Revenue and customer analytics are manager/admin only — plain staff (cashier, barista)
  // can run the order/inventory screens but shouldn't see sales figures by default.
  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    return <Navigate to="/staff" replace />
  }

  return <>{children}</>
}
