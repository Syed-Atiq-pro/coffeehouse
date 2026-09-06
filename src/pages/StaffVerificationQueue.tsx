import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { IdentityVerification } from '@/lib/types'

export default function StaffVerificationQueue() {
  const [queue, setQueue] = useState<IdentityVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [openDocUrl, setOpenDocUrl] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase
      .from('identity_verifications')
      .select('*, profiles!identity_verifications_customer_id_fkey(full_name, member_id)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    setQueue((data as IdentityVerification[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function viewDocument(path: string) {
    const { data, error } = await supabase.storage.from('id-documents').createSignedUrl(path, 300)
    if (!error && data) setOpenDocUrl(data.signedUrl)
  }

  async function approve(id: string) {
    setBusyId(id)
    await supabase.from('identity_verifications').update({ status: 'verified' }).eq('id', id)
    setBusyId(null)
    load()
  }

  async function reject(id: string) {
    setBusyId(id)
    await supabase
      .from('identity_verifications')
      .update({ status: 'rejected', rejection_reason: rejectReason || 'Document unclear or invalid.' })
      .eq('id', id)
    setBusyId(null)
    setRejectingId(null)
    setRejectReason('')
    load()
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Verification queue</h1>
        <Link to="/staff" className="text-sm text-espresso-light underline hover:text-espresso">
          Orders
        </Link>
      </div>

      {loading && <div className="skeleton h-24 w-full" />}

      {!loading && queue.length === 0 && (
        <p className="text-sm text-espresso-light">No pending requests.</p>
      )}

      <div className="space-y-4">
        {queue.map((item) => (
          <div key={item.id} className="border border-line p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-display text-lg">{item.profiles?.full_name ?? 'Customer'}</p>
                <p className="text-xs text-espresso-light">{item.profiles?.member_id} · {item.document_type}</p>
              </div>
              <button
                onClick={() => viewDocument(item.file_path)}
                className="text-sm text-caramel-dark underline"
              >
                View document
              </button>
            </div>

            {rejectingId === item.id ? (
              <div className="mt-3">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection"
                  className="w-full border border-line px-3 py-2 text-sm mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => reject(item.id)}
                    disabled={busyId === item.id}
                    className="text-sm bg-burgundy text-cream px-4 py-1.5 disabled:opacity-50"
                  >
                    Confirm reject
                  </button>
                  <button
                    onClick={() => setRejectingId(null)}
                    className="text-sm text-espresso-light underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => approve(item.id)}
                  disabled={busyId === item.id}
                  className="text-sm bg-sage text-cream px-4 py-1.5 disabled:opacity-50"
                >
                  {busyId === item.id ? '…' : 'Approve'}
                </button>
                <button
                  onClick={() => setRejectingId(item.id)}
                  className="text-sm border border-burgundy text-burgundy px-4 py-1.5"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {openDocUrl && (
        <div
          className="fixed inset-0 bg-espresso/60 flex items-center justify-center z-50 p-6"
          onClick={() => setOpenDocUrl(null)}
        >
          <div className="bg-cream max-w-lg w-full max-h-[85vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpenDocUrl(null)} className="text-sm text-espresso-light underline mb-3">
              Close
            </button>
            {openDocUrl.includes('.pdf') ? (
              <iframe src={openDocUrl} className="w-full h-[70vh]" title="ID document" />
            ) : (
              <img src={openDocUrl} alt="ID document" className="w-full h-auto" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
