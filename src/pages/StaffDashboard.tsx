import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const actions = [
  { to: '/staff', label: 'Live Orders', description: 'Manage incoming orders and move them through preparation.' },
  { to: '/staff/verify', label: 'Scan Customer QR', description: 'Scan a customer QR and display their full profile card.' },
  { to: '/staff/verification-queue', label: 'ID Verification', description: 'Review pending customer identity documents.' },
  { to: '/staff/inventory', label: 'Inventory', description: 'Monitor stock and restock ingredients.' },
  { to: '/schedule', label: 'Scheduled Orders', description: 'View and manage scheduled drink orders.' },
]

export default function StaffDashboard() {
  const { profile, user, signOut } = useAuth()

  return (
    <div className="min-h-screen px-6 py-8 bg-[#100a07] text-[#f3e5d0]">
      <header className="max-w-6xl mx-auto flex items-center justify-between gap-6 mb-10">
        <div>
          <p className="text-xs tracking-[.28em] uppercase opacity-55 mb-2">Coffee House · Staff</p>
          <Link to="/staff/copilot" className="block rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 mb-6"><b>AI Staff Copilot</b><span className="block text-sm opacity-60 mt-1">Ask about orders, anomalies, inventory and shift priorities →</span></Link><h1 className="font-display text-4xl">Staff Dashboard</h1>
          <p className="text-sm opacity-60 mt-2">Operations center for {profile?.full_name || user?.email || 'staff'}</p>
        </div>
        <button onClick={signOut} className="text-sm underline opacity-70 hover:opacity-100">Sign out</button>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {actions.map((action) => (
            <Link key={action.to} to={action.to} className="group border border-white/10 bg-white/[.04] p-6 min-h-40 hover:bg-white/[.08] hover:border-caramel transition-all">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[.2em] uppercase opacity-50 mb-3">Staff tool</p>
                  <h2 className="font-display text-2xl mb-2">{action.label}</h2>
                  <p className="text-sm opacity-60 leading-6">{action.description}</p>
                </div>
                <span className="text-xl opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
              </div>
            </Link>
          ))}

          {profile && ['manager', 'admin'].includes(profile.role) && (
            <Link to="/admin/analytics" className="group border border-caramel/30 bg-caramel/[.06] p-6 min-h-40 hover:bg-caramel/[.12] transition-all">
              <p className="text-xs tracking-[.2em] uppercase opacity-50 mb-3">Management</p>
              <h2 className="font-display text-2xl mb-2">Analytics</h2>
              <p className="text-sm opacity-60 leading-6">Sales, loyalty and product performance for managers and admins.</p>
            </Link>
          )}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 flex flex-wrap gap-5 text-sm opacity-60">
          <Link to="/dashboard" className="hover:opacity-100">Customer view</Link>
          <Link to="/" className="hover:opacity-100">Coffee House home</Link>
        </div>
      </main>
    </div>
  )
}
