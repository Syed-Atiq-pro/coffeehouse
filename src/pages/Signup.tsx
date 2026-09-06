import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSubmitting(true)
    const { error } = await signUp(email, password, fullName, referralCode)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-sm tracking-wide text-espresso-light mb-2">Join us</p>
        <h1 className="font-display text-4xl mb-8">Create your account</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-sm mb-1.5">Full name</label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-line bg-white/60 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-caramel"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line bg-white/60 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-caramel"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm mb-1.5">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line bg-white/60 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-caramel"
            />
            <p className="text-xs text-espresso-light mt-1">At least 8 characters.</p>
          </div>
          <div>
            <label htmlFor="referralCode" className="block text-sm mb-1.5">Referral code (optional)</label>
            <input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="w-full border border-line bg-white/60 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-caramel"
            />
          </div>

          {error && (
            <p className="text-sm text-burgundy" role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-espresso text-cream py-2.5 hover:bg-espresso-light transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-sm mt-6 text-espresso-light">
          Already have an account? <Link to="/login" className="text-caramel-dark underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
