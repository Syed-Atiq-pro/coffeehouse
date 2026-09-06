import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

type Promotion = {
  id: string
  name: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_order: number
  max_discount: number | null
  end_date: string | null
  usage_limit: number | null
  is_active: boolean
}

type Coupon = { id: string; code: string; promotion_id: string }

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState(10)
  const [minOrder, setMinOrder] = useState(0)
  const [couponCode, setCouponCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const { data: promos } = await supabase.from('promotions').select('*').order('created_at', { ascending: false })
    const { data: coups } = await supabase.from('coupons').select('*')
    setPromotions((promos as Promotion[]) ?? [])
    setCoupons((coups as Coupon[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !couponCode.trim()) {
      setError('Name and coupon code are required.')
      return
    }

    setSubmitting(true)
    const { data: promo, error: promoError } = await supabase
      .from('promotions')
      .insert({ name, discount_type: discountType, discount_value: discountValue, min_order: minOrder })
      .select()
      .single()

    if (promoError) {
      setError(promoError.message)
      setSubmitting(false)
      return
    }

    const { error: couponError } = await supabase
      .from('coupons')
      .insert({ code: couponCode.trim().toUpperCase(), promotion_id: promo.id })

    setSubmitting(false)

    if (couponError) {
      setError(couponError.message)
      return
    }

    setName('')
    setCouponCode('')
    setDiscountValue(10)
    setMinOrder(0)
    load()
  }

  async function toggleActive(promo: Promotion) {
    await supabase.from('promotions').update({ is_active: !promo.is_active }).eq('id', promo.id)
    load()
  }

  function couponFor(promoId: string) {
    return coupons.find((c) => c.promotion_id === promoId)?.code ?? '—'
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Promotions</h1>
        <Link to="/staff" className="text-sm text-espresso-light underline hover:text-espresso">
          Orders
        </Link>
      </div>

      <form onSubmit={handleCreate} className="border border-line p-5 mb-8 space-y-4">
        <p className="text-sm font-medium">Create a coupon</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-line px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs mb-1">Coupon code</label>
            <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="w-full border border-line px-3 py-2 text-sm uppercase" />
          </div>
          <div>
            <label className="block text-xs mb-1">Type</label>
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')} className="w-full border border-line px-3 py-2 text-sm">
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount off</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1">Value {discountType === 'percent' ? '(%)' : '(₹)'}</label>
            <input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} className="w-full border border-line px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs mb-1">Minimum order (₹)</label>
            <input type="number" value={minOrder} onChange={(e) => setMinOrder(Number(e.target.value))} className="w-full border border-line px-3 py-2 text-sm" />
          </div>
        </div>
        {error && <p className="text-sm text-burgundy">{error}</p>}
        <button type="submit" disabled={submitting} className="bg-espresso text-cream px-5 py-2 text-sm hover:bg-espresso-light disabled:opacity-50">
          {submitting ? 'Creating…' : 'Create coupon'}
        </button>
      </form>

      {loading ? (
        <div className="skeleton h-32 w-full" />
      ) : (
        <div className="space-y-3">
          {promotions.map((promo) => (
            <div key={promo.id} className="border border-line p-4 flex items-center justify-between">
              <div>
                <p className="font-display">{promo.name}</p>
                <p className="text-xs text-espresso-light">
                  Code: {couponFor(promo.id)} · {promo.discount_type === 'percent' ? `${promo.discount_value}% off` : `₹${promo.discount_value} off`}
                  {promo.min_order > 0 && ` · min ₹${promo.min_order}`}
                </p>
              </div>
              <button
                onClick={() => toggleActive(promo)}
                className={`text-xs border px-3 py-1 ${promo.is_active ? 'border-sage text-sage' : 'border-line text-espresso-light'}`}
              >
                {promo.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
          {promotions.length === 0 && <p className="text-sm text-espresso-light">No coupons yet.</p>}
        </div>
      )}
    </div>
  )
}
