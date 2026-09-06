import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await signIn(email, password)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate(result.isStaff ? '/staff/dashboard' : '/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-sm tracking-wide text-espresso-light mb-2">Welcome back</p>
        <h1 className="font-display text-4xl mb-8">Sign in</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm mt-6 text-espresso-light">
          New here? <Link to="/signup" className="text-caramel-dark underline">Create an account</Link>
        </p>
      </div>
    </div>
  )
}
