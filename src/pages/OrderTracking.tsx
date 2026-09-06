import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { OrderRow, OrderStatus } from '@/lib/types'

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'placed', label: 'Order placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready for pickup' },
  { key: 'completed', label: 'Completed' },
]

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<OrderRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return

    async function load() {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name))')
        .eq('id', orderId)
        .single()

      if (error) {
        setError('Could not find this order.')
      } else {
        setOrder(data as OrderRow)
      }
      setLoading(false)
    }
    load()

    // Subscribe to live status updates on this exact order
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder((prev) => (prev ? { ...prev, ...(payload.new as OrderRow) } : prev))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="skeleton h-32 w-full" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
        <p className="text-burgundy">{error ?? 'Order not found.'}</p>
        <Link to="/dashboard" className="text-sm text-caramel-dark underline">Back to dashboard</Link>
      </div>
    )
  }

  const isCancelled = order.status === 'cancelled'
  const currentStepIndex = STEPS.findIndex((s) => s.key === order.status)

  return (
    <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-espresso-light">Order {order.order_number}</p>
        <Link to="/dashboard" className="text-sm text-espresso-light underline hover:text-espresso">
          Dashboard
        </Link>
      </div>
      <h1 className="font-display text-3xl mb-8">Tracking your order</h1>

      {isCancelled ? (
        <div className="border border-burgundy p-5 mb-8">
          <p className="text-burgundy">This order was cancelled.</p>
        </div>
      ) : (
        <div className="mb-10">
          {STEPS.map((step, i) => {
            const isDone = i <= currentStepIndex
            const isCurrent = i === currentStepIndex
            return (
              <div key={step.key} className="flex items-start gap-3 pb-6 last:pb-0 relative">
                {i < STEPS.length - 1 && (
                  <div
                    className={`absolute left-[7px] top-4 w-px h-full ${isDone ? 'bg-caramel' : 'bg-line'}`}
                    aria-hidden="true"
                  />
                )}
                <div
                  className={`w-4 h-4 rounded-full mt-0.5 shrink-0 z-10 ${
                    isDone ? 'bg-caramel' : 'bg-cream border border-line'
                  }`}
                />
                <p className={isCurrent ? 'font-medium' : isDone ? '' : 'text-espresso-light'}>
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <div className="border border-line p-5 space-y-2 mb-6">
        <p className="text-sm font-medium mb-2">Order details</p>
        {order.order_items?.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.quantity}× {item.products?.name ?? 'Item'}
              {item.selected_options.length > 0 && (
                <span className="text-espresso-light"> · {item.selected_options.map((o) => o.label).join(', ')}</span>
              )}
            </span>
            <span>₹{item.line_total}</span>
          </div>
        ))}
        <div className="border-t border-line pt-2 mt-2 flex justify-between font-display text-lg">
          <span>Total</span><span>₹{order.total}</span>
        </div>
      </div>

      <p className="text-sm text-espresso-light">
        Earned <span className="text-caramel-dark font-medium">{order.loyalty_points_earned} points</span> on this order.
      </p>
    </div>
  )
}
