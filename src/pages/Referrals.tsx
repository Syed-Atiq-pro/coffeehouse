import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function Referrals() {
  const { user, profile, refreshProfile } = useAuth()
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [applyCode, setApplyCode] = useState('')
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [referralCount, setReferralCount] = useState(0)

  useEffect(() => {
    async function load() {
      if (!user) return
      // Generate (or fetch existing) referral code
      const { data } = await supabase.rpc('generate_referral_code')
      setCode(data)

      const { count } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id)
      setReferralCount(count ?? 0)

      setLoading(false)
    }
    load()
  }, [user])

  async function handleApply(e: FormEvent) {
    e.preventDefault()
    setApplyError(null)
    setSubmitting(true)
    const { error } = await supabase.rpc('apply_referral_code', { p_code: applyCode })
    setSubmitting(false)
    if (error) {
      setApplyError(error.message.replace(/^.*?:\s*/, ''))
      return
    }
    setApplySuccess(true)
    await refreshProfile()
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Refer a friend</h1>
        <Link to="/dashboard" className="text-sm text-espresso-light underline hover:text-espresso">
          Dashboard
        </Link>
      </div>

      {loading ? (
        <div className="skeleton h-32 w-full" />
      ) : (
        <>
          <div className="border border-line p-6 mb-6">
            <p className="text-sm text-espresso-light mb-2">Your referral code</p>
            <p className="font-display text-3xl mb-3">{code}</p>
            <p className="text-sm text-espresso-light">
              When a friend signs up with this code and places their first order, you both get{' '}
              <span className="text-caramel-dark">50 bonus points</span>.
            </p>
            <p className="text-sm text-espresso-light mt-3">
              {referralCount} friend{referralCount !== 1 ? 's' : ''} referred so far.
            </p>
          </div>

          {profile?.referred_by ? (
            <div className="border border-line p-5">
              <p className="text-sm text-sage">You already used a referral code when you joined.</p>
            </div>
          ) : applySuccess ? (
            <div className="border border-sage p-5">
              <p className="text-sm text-sage">Referral applied! Place your first order to earn your bonus points.</p>
            </div>
          ) : (
            <form onSubmit={handleApply} className="border border-line p-5">
              <label htmlFor="refCode" className="block text-sm font-medium mb-2">
                Have a friend's referral code?
              </label>
              <div className="flex gap-2">
                <input
                  id="refCode"
                  type="text"
                  value={applyCode}
                  onChange={(e) => setApplyCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 border border-line px-3 py-2 text-sm uppercase"
                />
                <button
                  type="submit"
                  disabled={submitting || !applyCode.trim()}
                  className="text-sm bg-espresso text-cream px-4 hover:bg-espresso-light disabled:opacity-50"
                >
                  {submitting ? '…' : 'Apply'}
                </button>
              </div>
              {applyError && <p className="text-sm text-burgundy mt-2">{applyError}</p>}
            </form>
          )}
        </>
      )}
    </div>
  )
}
