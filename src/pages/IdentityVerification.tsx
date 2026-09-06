import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { IdentityVerification } from '@/lib/types'

const DOC_TYPES = ['Government ID', 'Driving License', 'Passport', 'College ID', 'Other']
const MAX_SIZE = 8 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

const statusCopy: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending review', className: 'text-caramel-dark border-caramel' },
  verified: { label: 'Verified', className: 'text-sage border-sage' },
  rejected: { label: 'Rejected', className: 'text-burgundy border-burgundy' },
}

export default function IdentityVerificationPage() {
  const { user, profile } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [docType, setDocType] = useState(DOC_TYPES[0])
  const [latest, setLatest] = useState<IdentityVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setLatest(data as IdentityVerification | null)
      setLoading(false)
    }
    load()
  }, [user])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, or PDF.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('File must be under 8MB.')
      return
    }

    setSubmitting(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('id-documents')
      .upload(path, file, { contentType: file.type })

    if (uploadError) {
      setError(uploadError.message)
      setSubmitting(false)
      return
    }

    const { data: inserted, error: insertError } = await supabase
      .from('identity_verifications')
      .insert({ customer_id: user.id, document_type: docType, file_path: path })
      .select()
      .single()

    setSubmitting(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setLatest(inserted as IdentityVerification)
    e.target.value = ''
  }

  const status = latest ? statusCopy[latest.status] : null
  const canSubmitNew = !latest || latest.status === 'rejected'

  return (
    <div className="min-h-screen px-6 py-10 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Identity verification</h1>
        <Link to="/dashboard" className="text-sm text-espresso-light underline hover:text-espresso">
          Dashboard
        </Link>
      </div>

      <p className="text-sm text-espresso-light mb-6">
        Verifying your identity unlocks birthday rewards and helps us keep the loyalty program fair for everyone.
        Your document is stored securely and is only ever seen by staff reviewing your request.
      </p>

      {loading ? (
        <div className="skeleton h-32 w-full" />
      ) : (
        <>
          {latest && (
            <div className="border border-line p-5 mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{latest.document_type}</p>
                {status && (
                  <span className={`text-xs border px-2 py-0.5 ${status.className}`}>{status.label}</span>
                )}
              </div>
              <p className="text-xs text-espresso-light">
                Submitted {new Date(latest.created_at).toLocaleDateString()}
              </p>
              {latest.status === 'rejected' && latest.rejection_reason && (
                <p className="text-sm text-burgundy mt-2">Reason: {latest.rejection_reason}</p>
              )}
              {profile?.identity_verified && (
                <p className="text-sm text-sage mt-2">Your account is verified.</p>
              )}
            </div>
          )}

          {canSubmitNew && (
            <div className="border border-line p-5">
              <label htmlFor="docType" className="block text-sm mb-1.5">Document type</label>
              <select
                id="docType"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full border border-line bg-white/60 px-3.5 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-caramel"
              >
                {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={submitting}
                className="w-full border border-espresso py-2.5 hover:bg-espresso hover:text-cream transition-colors disabled:opacity-50"
              >
                {submitting ? 'Uploading…' : 'Upload document'}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFile}
                className="hidden"
              />
              {error && <p className="text-sm text-burgundy mt-3" role="alert">{error}</p>}
            </div>
          )}
        </>
      )}
    </div>
  )
}
