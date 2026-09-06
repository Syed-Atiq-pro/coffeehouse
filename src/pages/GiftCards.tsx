import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const PRESET_AMOUNTS = [200, 500, 1000, 2000]

export default function GiftCards() {
  const [amount, setAmount] = useState(500)
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ code: string; balance: number } | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { data, error: rpcError } = await supabase.rpc('purchase_gift_card', {
      p_amount: amount,
      p_recipient_name: recipientName || null,
      p_recipient_email: recipientEmail || null,
      p_message: message || null,
    })

    setSubmitting(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }

    setResult({ code: data.code, balance: data.balance })
  }

  if (result) {
    return (
      <div className="min-h-screen px-6 py-10 max-w-lg mx-auto">
        <h1 className="font-display text-3xl mb-8">Gift card created</h1>
        <div className="bg-espresso text-cream p-6 mb-6">
          <p className="text-xs uppercase tracking-widest text-cream/70 mb-2">Coffee House Gift Card</p>
          <p className="font-display text-2xl mb-1">₹{result.balance}</p>
          <p className="text-sm text-cream/80 tracking-wider">{result.code}</p>
        </div>
        <p className="text-sm text-espresso-light mb-6">
          Share this code with the recipient — they can enter it at checkout to redeem the balance.
        </p>
        <Link to="/dashboard" className="text-sm text-caramel-dark underline">Back to dashboard</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Gift a coffee</h1>
        <Link to="/dashboard" className="text-sm text-espresso-light underline hover:text-espresso">
          Dashboard
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm mb-2">Amount</label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(a)}
                className={`px-4 py-2 text-sm border ${amount === a ? 'border-caramel bg-caramel text-cream' : 'border-line'}`}
              >
                ₹{a}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={1}
            max={10000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full border border-line px-3.5 py-2.5 mt-3"
          />
        </div>

        <div>
          <label htmlFor="recipientName" className="block text-sm mb-1.5">Recipient name (optional)</label>
          <input
            id="recipientName"
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="w-full border border-line px-3.5 py-2.5"
          />
        </div>

        <div>
          <label htmlFor="recipientEmail" className="block text-sm mb-1.5">Recipient email (optional)</label>
          <input
            id="recipientEmail"
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full border border-line px-3.5 py-2.5"
          />
          <p className="text-xs text-espresso-light mt-1">
            Emailing the code isn't wired up yet — you'll need to share it yourself for now.
          </p>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm mb-1.5">Message (optional)</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full border border-line px-3.5 py-2.5"
          />
        </div>

        {error && <p className="text-sm text-burgundy" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-espresso text-cream py-3 hover:bg-espresso-light transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating…' : `Purchase gift card · ₹${amount}`}
        </button>
        <p className="text-xs text-espresso-light">Payment is simulated for now.</p>
      </form>
    </div>
  )
}
