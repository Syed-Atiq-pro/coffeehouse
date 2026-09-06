import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { OrderRow, OrderStatus } from '@/lib/types'

type StaffOrder = OrderRow & {
  profiles?: { full_name: string | null; member_id: string | null }
}

const COLUMNS: { key: OrderStatus; label: string }[] = [
  { key: 'placed', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
]

// What each status can move to next. Cancellation is available from any non-final state.
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'completed',
}

export default function StaffOrders() {
  const { profile, signOut } = useAuth()
  const [orders, setOrders] = useState<StaffOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function loadOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name)), profiles(full_name, member_id)')
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: true })
    setOrders((data as StaffOrder[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()

    // Live feed: new orders appear immediately, status changes from other staff sync too
    const channel = supabase
      .channel('staff-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function advanceStatus(order: StaffOrder) {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setUpdatingId(order.id)
    await supabase.from('orders').update({ status: next, updated_at: new Date().toISOString() }).eq('id', order.id)
    setUpdatingId(null)
    // No need to manually refetch — the realtime subscription above will pick up the change
  }

  async function cancelOrder(order: StaffOrder) {
    setUpdatingId(order.id)
    await supabase.from('orders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', order.id)
    setUpdatingId(null)
  }

  const todaysSales = orders
    .filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + Number(o.total), 0)

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="flex items-center justify-between mb-2 max-w-full">
        <div>
          <p className="text-sm text-espresso-light">Staff dashboard</p>
          <h1 className="font-display text-3xl">Orders</h1>
        </div>
        <div className="flex items-center gap-4">
          {profile && ['manager', 'admin'].includes(profile.role) && (
            <>
              <Link to="/admin/analytics" className="text-sm text-caramel-dark underline hover:text-caramel">
                Analytics
              </Link>
              <Link to="/admin/promotions" className="text-sm text-caramel-dark underline hover:text-caramel">
                Promotions
              </Link>
              <Link to="/admin/stores" className="text-sm text-caramel-dark underline hover:text-caramel">
                Stores
              </Link>
              <Link to="/admin/products" className="text-sm text-caramel-dark underline hover:text-caramel">
                Products
              </Link>
            </>
          )}
          <Link to="/schedule" className="text-sm text-caramel-dark underline hover:text-caramel">Scheduled orders</Link>
          <Link to="/staff/inventory" className="text-sm text-caramel-dark underline hover:text-caramel">
            Inventory
          </Link>
          <Link to="/staff/verification-queue" className="text-sm text-caramel-dark underline hover:text-caramel">
            ID verification queue
          </Link>
          <Link to="/staff/verify" className="text-sm text-caramel-dark underline hover:text-caramel">
            Verify customer
          </Link>
          <div className="text-right">
            <p className="text-xs text-espresso-light">Today's sales</p>
            <p className="font-display text-xl">₹{todaysSales.toFixed(2)}</p>
          </div>
          <button onClick={signOut} className="text-sm text-espresso-light underline hover:text-espresso">
            Sign out
          </button>
        </div>
      </div>
      <p className="text-sm text-espresso-light mb-6">Signed in as {profile?.full_name} ({profile?.role})</p>

      {loading ? (
        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-64" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 overflow-x-auto">
          {COLUMNS.map((col) => {
            const columnOrders = orders.filter((o) => o.status === col.key)
            return (
              <div key={col.key} className="min-w-[220px]">
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-sm font-medium">{col.label}</p>
                  <span className="text-xs text-espresso-light">{columnOrders.length}</span>
                </div>
                <div className="space-y-2">
                  {columnOrders.length === 0 && (
                    <p className="text-xs text-espresso-light px-1">No orders</p>
                  )}
                  {columnOrders.map((order) => (
                    <div key={order.id} className="border border-line bg-white/50 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-display text-sm">{order.order_number}</p>
                        <p className="text-xs text-espresso-light">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className="text-xs text-espresso-light mb-2">
                        {order.profiles?.full_name ?? 'Customer'}
                      </p>
                      <ul className="text-xs space-y-0.5 mb-2">
                        {order.order_items?.map((item) => (
                          <li key={item.id}>
                            {item.quantity}× {item.products?.name}
                            {item.selected_options.length > 0 && (
                              <span className="text-espresso-light"> ({item.selected_options.map((o) => o.label).join(', ')})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs mb-2">₹{order.total}</p>
                      <div className="flex gap-1">
                        {NEXT_STATUS[order.status] && (
                          <button
                            onClick={() => advanceStatus(order)}
                            disabled={updatingId === order.id}
                            className="flex-1 text-xs bg-espresso text-cream py-1.5 hover:bg-espresso-light disabled:opacity-50"
                          >
                            {updatingId === order.id ? '…' : `Mark ${NEXT_STATUS[order.status]}`}
                          </button>
                        )}
                        {order.status !== 'completed' && (
                          <button
                            onClick={() => cancelOrder(order)}
                            disabled={updatingId === order.id}
                            className="text-xs text-burgundy underline px-1"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Link to="/dashboard" className="inline-block mt-8 text-sm text-espresso-light underline hover:text-espresso">
        Switch to customer view
      </Link>
    </div>
  )
}
