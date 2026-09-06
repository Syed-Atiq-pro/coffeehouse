import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import QrScanner from '@/components/QrScanner'
import QRCode from 'qrcode'

type LookupResult = {
  customer_id: string
  full_name: string | null
  profile_photo_url: string | null
  member_id: string | null
  loyalty_tier: string
  loyalty_points: number
  total_orders: number
  account_status: string
  identity_verified: boolean
  birthday_reward_available: boolean
}

export default function StaffVerify() {
  const [tokenInput, setTokenInput] = useState('')
  const [result, setResult] = useState<LookupResult | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redeeming, setRedeeming] = useState(false)
  const [redeemedJustNow, setRedeemedJustNow] = useState(false)

  async function lookupToken(token: string) {
    setError(null)
    setResult(null)
    setPhotoUrl(null)
    setQrDataUrl('')
    setRedeemedJustNow(false)

    if (!token) return

    setLoading(true)
    const { data, error: rpcError } = await supabase.rpc('staff_lookup_by_qr', { p_token: token })
    setLoading(false)

    if (rpcError) {
      setError('Invalid QR code, or you do not have permission to verify customers.')
      return
    }
    if (!data || data.length === 0) {
      setError('No customer found for this code.')
      return
    }

    const customer = data[0] as LookupResult
    setResult(customer)
    const qrImage = await QRCode.toDataURL(token, { margin: 1, width: 180, color: { dark: '#2A1810', light: '#F6EFE4' } })
    setQrDataUrl(qrImage)

    if (customer.profile_photo_url) {
      const { data: signed } = await supabase.storage
        .from('avatars')
        .createSignedUrl(customer.profile_photo_url, 60 * 5)
      setPhotoUrl(signed?.signedUrl ?? null)
    }
  }

  async function handleLookup(e: FormEvent) {
    e.preventDefault()
    await lookupToken(tokenInput.trim())
  }

  async function handleRedeemBirthday() {
    if (!result) return
    setRedeeming(true)
    const { data, error: rpcError } = await supabase.rpc('redeem_birthday_reward', {
      p_customer_id: result.customer_id,
    })
    setRedeeming(false)
    if (rpcError || !data) {
      setError('Could not redeem — it may have already been used.')
      return
    }
    setRedeemedJustNow(true)
    setResult({ ...result, birthday_reward_available: false })
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Verify customer</h1>
        <Link to="/staff" className="text-sm text-espresso-light underline hover:text-espresso">
          Orders
        </Link>
      </div>

      <QrScanner onScan={(text) => { setTokenInput(text); lookupToken(text) }} />

      <form onSubmit={handleLookup} className="mb-8">
        <label htmlFor="token" className="block text-sm mb-1.5">
          Customer QR code
        </label>
        <p className="text-xs text-espresso-light mb-2">
          Use the camera above, or paste/type the code manually.
        </p>
        <div className="flex gap-2">
          <input
            id="token"
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste QR code value manually"
            className="flex-1 border border-line bg-white/60 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-caramel"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-espresso text-cream px-5 hover:bg-espresso-light transition-colors disabled:opacity-50"
          >
            {loading ? '…' : 'Verify'}
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-burgundy mb-6" role="alert">{error}</p>}

      {result && (
        <div className="rounded-2xl overflow-hidden border border-[#c79a62]/50 shadow-2xl bg-[#160d09]">
          <div className="p-6 border-b border-white/10 bg-[#24150f]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] tracking-[.28em] uppercase text-[#c79a62] mb-2">Coffee House · Customer Card</p>
                <h2 className="font-display text-3xl text-[#f3e5d0]">{result.full_name ?? 'Member'}</h2>
                <p className="text-xs text-[#f3e5d0]/55 mt-1">{result.account_status}</p>
              </div>
              <span className="text-[10px] uppercase tracking-wider border border-emerald-400/40 text-emerald-300 px-2 py-1 rounded-full">Verified</span>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#2a1a13] border border-white/10 shrink-0 flex items-center justify-center">
                {photoUrl ? <img src={photoUrl} alt="Customer" className="w-full h-full object-cover" /> : <span className="text-xs text-[#f3e5d0]/40">No photo</span>}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[#f3e5d0]/45">Membership</p>
                <p className="font-display text-xl text-[#f3e5d0]">{result.member_id ?? 'Active member'}</p>
                <p className="text-sm text-[#f3e5d0]/60 mt-1">Identity {result.identity_verified ? 'verified' : 'not verified'}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/10 p-3 text-center bg-white/[.03]"><p className="text-[10px] uppercase tracking-wider text-[#f3e5d0]/40">Tier</p><p className="font-display text-lg">{result.loyalty_tier}</p></div>
              <div className="rounded-xl border border-white/10 p-3 text-center bg-white/[.03]"><p className="text-[10px] uppercase tracking-wider text-[#f3e5d0]/40">Points</p><p className="font-display text-lg">{result.loyalty_points}</p></div>
              <div className="rounded-xl border border-white/10 p-3 text-center bg-white/[.03]"><p className="text-[10px] uppercase tracking-wider text-[#f3e5d0]/40">Orders</p><p className="font-display text-lg">{result.total_orders}</p></div>
            </div>

            {qrDataUrl && <div className="mt-6 flex justify-center"><div className="bg-[#f6efe4] rounded-xl p-3"><img src={qrDataUrl} alt="Customer QR" className="w-36 h-36" /></div></div>}

            {result.birthday_reward_available && (
              <div className="border border-[#c79a62]/40 bg-[#c79a62]/10 p-4 mt-6 rounded-xl">
                <p className="text-sm font-medium mb-1">🎂 Birthday reward available</p>
                <p className="text-xs text-[#f3e5d0]/55 mb-3">This customer is eligible for a free birthday coffee.</p>
                <button onClick={handleRedeemBirthday} disabled={redeeming} className="w-full bg-[#c79a62] text-[#160d09] py-2.5 text-sm rounded-lg hover:opacity-90 disabled:opacity-50">{redeeming ? 'Redeeming…' : 'Redeem birthday reward'}</button>
              </div>
            )}
            {redeemedJustNow && <p className="text-sm text-emerald-300 mt-4">Birthday reward redeemed successfully.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
