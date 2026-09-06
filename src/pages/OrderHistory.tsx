import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { OrderRow } from '@/lib/types'

const statusLabel: Record<string, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [reordering, setReordering] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      setOrders((data as OrderRow[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function reorder(order: OrderRow) {
    const items = order.order_items ?? []
    if (!items.length) return
    setReordering(order.id)
    const rows = items.map(item => ({ product_id: item.product_id, quantity: item.quantity, selected_options: item.selected_options }))
    localStorage.setItem('coffee-house-smart-reorder', JSON.stringify(rows))
    setReordering(null)
    window.location.href = '/menu?reorder=1'
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Your orders</h1>
        <Link to="/dashboard" className="text-sm text-espresso-light underline hover:text-espresso">
          Dashboard
        </Link>
      </div>

      {loading && (
        <div className="space-y-3">
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-20 w-full" />
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="border border-line p-8 text-center">
          <p className="text-espresso-light">No orders yet.</p>
          <Link to="/menu" className="inline-block mt-4 text-sm text-caramel-dark underline">
            Order something
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="block border border-line p-5 hover:border-caramel transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-lg">{order.order_number}</p>
              <span className="text-sm text-caramel-dark">{statusLabel[order.status]}</span>
            </div>
            <p className="text-sm text-espresso-light mt-1">
              {new Date(order.created_at).toLocaleString()} · ₹{order.total}
            </p>
            {order.status === 'completed' && <button onClick={(e) => { e.preventDefault(); void reorder(order) }} className="mt-3 text-xs border border-line px-3 py-1.5 hover:border-caramel">{reordering === order.id ? 'Preparing…' : 'Order again ↗'}</button>}
          </Link>
        ))}
      </div>
    </div>
  )
}
