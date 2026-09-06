import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { supabase } from '@/lib/supabase'

type RangeKey = '7' | '30' | '90'

type Summary = {
  total_sales: number
  order_count: number
  avg_order_value: number
  new_customers: number
  active_customers: number
}

type DailyPoint = { day: string; total: number; order_count: number }
type TopProduct = { product_name: string; total_quantity: number; total_revenue: number }
type LoyaltyStats = { points_awarded: number; points_redeemed: number; birthday_rewards_redeemed: number }

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '7', label: '7 days' },
  { key: '30', label: '30 days' },
  { key: '90', label: '90 days' },
]

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function AdminAnalytics() {
  const [range, setRange] = useState<RangeKey>('7')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [daily, setDaily] = useState<DailyPoint[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [loyalty, setLoyalty] = useState<LoyaltyStats | null>(null)
  const [lowStockCount, setLowStockCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      const to = new Date()
      const from = new Date()
      from.setDate(to.getDate() - Number(range) + 1)
      const pFrom = toDateStr(from)
      const pTo = toDateStr(to)

      const [summaryRes, dailyRes, topRes, loyaltyRes, stockRes] = await Promise.all([
        supabase.rpc('admin_sales_summary', { p_from: pFrom, p_to: pTo }),
        supabase.rpc('admin_daily_sales', { p_from: pFrom, p_to: pTo }),
        supabase.rpc('admin_top_products', { p_from: pFrom, p_to: pTo, p_limit: 5 }),
        supabase.rpc('admin_loyalty_stats', { p_from: pFrom, p_to: pTo }),
        supabase.rpc('admin_low_stock_count'),
      ])

      if (summaryRes.error) {
        setError('Could not load analytics — you may not have admin/manager access.')
        setLoading(false)
        return
      }

      setSummary(summaryRes.data?.[0] ?? null)
      setDaily((dailyRes.data ?? []).map((d: DailyPoint) => ({ ...d, day: d.day.slice(5) })))
      setTopProducts(topRes.data ?? [])
      setLoyalty(loyaltyRes.data?.[0] ?? null)
      setLowStockCount(stockRes.data ?? 0)
      setLoading(false)
    }
    load()
  }, [range])

  return (
    <div className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl">Analytics</h1>
        <Link to="/staff" className="text-sm text-espresso-light underline hover:text-espresso">
          Orders
        </Link>
      </div>

      <div className="flex gap-2 mb-8">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setRange(opt.key)}
            className={`px-3.5 py-1.5 text-sm border ${range === opt.key ? 'border-caramel bg-caramel text-cream' : 'border-line'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading && <div className="skeleton h-64 w-full" />}
      {error && <p className="text-sm text-burgundy mb-6">{error}</p>}

      {!loading && !error && summary && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            <div className="border border-line p-4">
              <p className="text-xs text-espresso-light">Revenue</p>
              <p className="font-display text-xl">₹{summary.total_sales}</p>
            </div>
            <div className="border border-line p-4">
              <p className="text-xs text-espresso-light">Orders</p>
              <p className="font-display text-xl">{summary.order_count}</p>
            </div>
            <div className="border border-line p-4">
              <p className="text-xs text-espresso-light">Avg order value</p>
              <p className="font-display text-xl">₹{summary.avg_order_value}</p>
            </div>
            <div className="border border-line p-4">
              <p className="text-xs text-espresso-light">New customers</p>
              <p className="font-display text-xl">{summary.new_customers}</p>
            </div>
            <div className="border border-line p-4">
              <p className="text-xs text-espresso-light">Active customers</p>
              <p className="font-display text-xl">{summary.active_customers}</p>
            </div>
            <div className="border border-line p-4">
              <p className="text-xs text-espresso-light">Low stock items</p>
              <p className={`font-display text-xl ${lowStockCount && lowStockCount > 0 ? 'text-burgundy' : ''}`}>
                {lowStockCount ?? 0}
              </p>
            </div>
          </div>

          <div className="border border-line p-4 mb-8">
            <p className="text-sm font-medium mb-3">Revenue over time</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={daily}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#4A3226' }} axisLine={{ stroke: '#DDD2BE' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#4A3226' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ background: '#F6EFE4', border: '1px solid #DDD2BE', fontSize: 12 }} />
                <Line type="monotone" dataKey="total" stroke="#B9793B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="border border-line p-4 mb-8">
            <p className="text-sm font-medium mb-3">Top products by revenue</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#4A3226' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="product_name" type="category" tick={{ fontSize: 11, fill: '#4A3226' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={{ background: '#F6EFE4', border: '1px solid #DDD2BE', fontSize: 12 }} />
                <Bar dataKey="total_revenue" fill="#6B2A2A" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {loyalty && (
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-line p-4">
                <p className="text-xs text-espresso-light">Points awarded</p>
                <p className="font-display text-lg">{loyalty.points_awarded}</p>
              </div>
              <div className="border border-line p-4">
                <p className="text-xs text-espresso-light">Points redeemed</p>
                <p className="font-display text-lg">{loyalty.points_redeemed}</p>
              </div>
              <div className="border border-line p-4">
                <p className="text-xs text-espresso-light">Birthday rewards used</p>
                <p className="font-display text-lg">{loyalty.birthday_rewards_redeemed}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
