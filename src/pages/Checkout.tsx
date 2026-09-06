import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/contexts/CartContext'

type Store = { id: string; name: string; address: string | null }

export default function Checkout() {
  const { lines, subtotal, clearCart } = useCart()
  const navigate = useNavigate()
  const [stores, setStores] = useState<Store[]>([])
  const [storeId, setStoreId] = useState('')
  const [pickupOption, setPickupOption] = useState<'asap' | 'scheduled'>('asap')
  const [scheduledTime, setScheduledTime] = useState('')

  const [couponCode, setCouponCode] = useState('')
  const [couponPreview, setCouponPreview] = useState<{ discount: number } | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [checkingCoupon, setCheckingCoupon] = useState(false)

  const [giftCardCode, setGiftCardCode] = useState('')
  const [giftCardPreview, setGiftCardPreview] = useState<{ balance: number } | null>(null)
  const [giftCardError, setGiftCardError] = useState<string | null>(null)
  const [checkingGiftCard, setCheckingGiftCard] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('stores').select('id, name, address').eq('is_active', true).then(({ data }) => {
      setStores(data ?? [])
      if (data && data.length > 0) setStoreId(data[0].id)
    })
  }, [])

  const discount = couponPreview?.discount ?? 0
  const taxableAmount = Math.max(subtotal - discount, 0)
  const tax = Math.round(taxableAmount * 0.05 * 100) / 100
  const totalBeforeGiftCard = taxableAmount + tax
  const giftCardApplied = giftCardPreview ? Math.min(giftCardPreview.balance, totalBeforeGiftCard) : 0
  const finalTotal = totalBeforeGiftCard - giftCardApplied

  async function checkCoupon() {
    setCouponError(null)
    setCouponPreview(null)
    if (!couponCode.trim()) return
    setCheckingCoupon(true)
    const { data, error } = await supabase.rpc('validate_coupon', { p_code: couponCode, p_subtotal: subtotal })
    setCheckingCoupon(false)
    if (error) {
      setCouponError(error.message.replace(/^.*?:\s*/, ''))
      return
    }
    setCouponPreview({ discount: data?.[0]?.discount ?? 0 })
  }

  async function checkGiftCard() {
    setGiftCardError(null)
    setGiftCardPreview(null)
    if (!giftCardCode.trim()) return
    setCheckingGiftCard(true)
    const { data, error } = await supabase.rpc('validate_gift_card', { p_code: giftCardCode })
    setCheckingGiftCard(false)
    if (error) {
      setGiftCardError(error.message.replace(/^.*?:\s*/, ''))
      return
    }
    setGiftCardPreview({ balance: data?.[0]?.available_balance ?? 0 })
  }

  async function handlePlaceOrder() {
    setError(null)
    if (lines.length === 0) return

    let pickupTime: string | null = null
    if (pickupOption === 'scheduled') {
      if (!scheduledTime) {
        setError('Choose a pickup time, or switch to ASAP.')
        return
      }
      pickupTime = new Date(scheduledTime).toISOString()
    }

    setSubmitting(true)
    const items = lines.map((line) => ({
      product_id: line.product.id,
      quantity: line.quantity,
      option_ids: line.selectedOptions.map((o) => o.id),
    }))

    const { data, error: rpcError } = await supabase.rpc('create_order', {
      p_store_id: storeId || null,
      p_pickup_time: pickupTime,
      p_items: items,
      p_coupon_code: couponPreview ? couponCode.trim() : null,
      p_gift_card_code: giftCardPreview ? giftCardCode.trim() : null,
    })

    setSubmitting(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }

    clearCart()
    navigate(`/orders/${data.id}`)
  }

  if (lines.length === 0) {
    return (
      <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
        <p className="text-espresso-light">Your cart is empty.</p>
        <Link to="/menu" className="text-sm text-caramel-dark underline">Browse the menu</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Checkout</h1>
        <Link to="/cart" className="text-sm text-espresso-light underline hover:text-espresso">
          Back to cart
        </Link>
      </div>

      {stores.length > 0 && (
        <div className="border border-line p-5 mb-6">
          <label htmlFor="store" className="block text-sm font-medium mb-2">Pickup store</label>
          <select
            id="store"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="w-full border border-line bg-white/60 px-3.5 py-2.5"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="border border-line p-5 mb-6">
        <p className="text-sm font-medium mb-3">Pickup time</p>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setPickupOption('asap')}
            className={`px-3.5 py-2 text-sm border ${pickupOption === 'asap' ? 'border-caramel bg-caramel text-cream' : 'border-line'}`}
          >
            As soon as possible
          </button>
          <button
            type="button"
            onClick={() => setPickupOption('scheduled')}
            className={`px-3.5 py-2 text-sm border ${pickupOption === 'scheduled' ? 'border-caramel bg-caramel text-cream' : 'border-line'}`}
          >
            Schedule
          </button>
        </div>
        {pickupOption === 'scheduled' && (
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="border border-line px-3 py-2 text-sm w-full"
          />
        )}
      </div>

      <div className="border border-line p-5 mb-4">
        <label htmlFor="coupon" className="block text-sm font-medium mb-2">Coupon code</label>
        <div className="flex gap-2">
          <input
            id="coupon"
            type="text"
            value={couponCode}
            onChange={(e) => { setCouponCode(e.target.value); setCouponPreview(null) }}
            placeholder="e.g. WELCOME20"
            className="flex-1 border border-line px-3 py-2 text-sm uppercase"
          />
          <button
            onClick={checkCoupon}
            disabled={checkingCoupon || !couponCode.trim()}
            className="text-sm border border-espresso px-4 hover:bg-espresso hover:text-cream transition-colors disabled:opacity-50"
          >
            {checkingCoupon ? '…' : 'Apply'}
          </button>
        </div>
        {couponPreview && <p className="text-sm text-sage mt-2">−₹{couponPreview.discount} applied</p>}
        {couponError && <p className="text-sm text-burgundy mt-2">{couponError}</p>}
      </div>

      <div className="border border-line p-5 mb-6">
        <label htmlFor="giftcard" className="block text-sm font-medium mb-2">Gift card code</label>
        <div className="flex gap-2">
          <input
            id="giftcard"
            type="text"
            value={giftCardCode}
            onChange={(e) => { setGiftCardCode(e.target.value); setGiftCardPreview(null) }}
            placeholder="e.g. GIFT-XXXXXXXX"
            className="flex-1 border border-line px-3 py-2 text-sm uppercase"
          />
          <button
            onClick={checkGiftCard}
            disabled={checkingGiftCard || !giftCardCode.trim()}
            className="text-sm border border-espresso px-4 hover:bg-espresso hover:text-cream transition-colors disabled:opacity-50"
          >
            {checkingGiftCard ? '…' : 'Apply'}
          </button>
        </div>
        {giftCardPreview && <p className="text-sm text-sage mt-2">₹{giftCardPreview.balance} balance available</p>}
        {giftCardError && <p className="text-sm text-burgundy mt-2">{giftCardError}</p>}
      </div>

      <div className="border border-line p-5 space-y-2 mb-6">
        <p className="text-sm font-medium mb-2">Order summary</p>
        {lines.map((line) => (
          <div key={line.lineId} className="flex justify-between text-sm">
            <span>{line.quantity}× {line.product.name}</span>
            <span>₹{line.unitPrice * line.quantity}</span>
          </div>
        ))}
        <div className="border-t border-line pt-2 mt-2 flex justify-between text-sm">
          <span>Subtotal</span><span>₹{subtotal}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-sage">
            <span>Coupon discount</span><span>−₹{discount}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-espresso-light">
          <span>Tax (5%)</span><span>₹{tax.toFixed(2)}</span>
        </div>
        {giftCardApplied > 0 && (
          <div className="flex justify-between text-sm text-sage">
            <span>Gift card</span><span>−₹{giftCardApplied.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-display text-lg pt-1">
          <span>Total</span><span>₹{finalTotal.toFixed(2)}</span>
        </div>
      </div>

      <p className="text-xs text-espresso-light mb-4">
        Payment is simulated for now — no real charge is made.
      </p>

      {error && <p className="text-sm text-burgundy mb-4" role="alert">{error}</p>}

      <div className="fixed bottom-0 inset-x-0 bg-cream border-t border-line">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <button
            onClick={handlePlaceOrder}
            disabled={submitting}
            className="w-full bg-espresso text-cream py-3 hover:bg-espresso-light transition-colors disabled:opacity-50"
          >
            {submitting ? 'Placing order…' : `Place order · ₹${finalTotal.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
