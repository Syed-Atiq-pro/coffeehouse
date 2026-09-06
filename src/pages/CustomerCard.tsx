import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import PhotoUpload from '@/components/PhotoUpload'

const tierLabel: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
}

export default function CustomerCard() {
  const { profile, refreshProfile } = useAuth()
  const cardRef = useRef<HTMLDivElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.qr_token) return
    QRCode.toDataURL(profile.qr_token, { margin: 1, width: 240, color: { dark: '#2A1810', light: '#F6EFE4' } })
      .then(setQrDataUrl)
      .catch(() => setError('Could not generate QR code.'))
  }, [profile?.qr_token])

  useEffect(() => {
    async function resolvePhoto() {
      if (!profile?.profile_photo_url) {
        setPhotoUrl(null)
        return
      }
      // profile_photo_url stores a storage path since the bucket is private —
      // resolve it to a short-lived signed URL for display.
      const { data } = await supabase.storage
        .from('avatars')
        .createSignedUrl(profile.profile_photo_url, 60 * 60)
      setPhotoUrl(data?.signedUrl ?? null)
    }
    resolvePhoto()
  }, [profile?.profile_photo_url])

  async function handleRegenerate() {
    setRegenerating(true)
    setError(null)
    const { error } = await supabase.rpc('regenerate_qr_token')
    setRegenerating(false)
    if (error) {
      setError(error.message)
      return
    }
    await refreshProfile()
  }

  async function handleDownload() {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 3 })
      const link = document.createElement('a')
      link.download = `coffee-house-card-${profile?.member_id ?? 'member'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      setError('Could not generate the download. Try again.')
    }
    setDownloading(false)
  }

  if (!profile) {
    return (
      <div className="min-h-screen px-6 py-10 max-w-lg mx-auto">
        <div className="skeleton h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Your card</h1>
        <Link to="/dashboard" className="text-sm text-espresso-light underline hover:text-espresso">
          Dashboard
        </Link>
      </div>

      {/* The card itself — this exact element is what gets exported to PNG */}
      <div
        ref={cardRef}
        className="bg-espresso text-cream p-7 relative overflow-hidden"
        style={{ aspectRatio: '1.6 / 1' }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs tracking-widest uppercase text-cream/70">Coffee House</p>
            <p className="font-display text-lg">Customer Card</p>
          </div>
          <span className="text-xs border border-caramel text-caramel px-2 py-0.5">
            {tierLabel[profile.loyalty_tier] ?? profile.loyalty_tier}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-cream/10 border border-cream/30 overflow-hidden flex items-center justify-center shrink-0">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <span className="text-xs text-cream/50">Photo</span>
            )}
          </div>
          <div>
            <p className="font-display text-xl">{profile.full_name ?? 'Member'}</p>
            <p className="text-xs text-cream/70">Member ID: {profile.member_id}</p>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-cream/70">Loyalty points</p>
            <p className="font-display text-lg">{profile.loyalty_points}</p>
          </div>
          {qrDataUrl && <img src={qrDataUrl} alt="QR code" className="w-16 h-16" />}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium mb-2">Profile photo</p>
        <PhotoUpload currentUrl={photoUrl} />
      </div>

      {error && <p className="text-sm text-burgundy mt-4" role="alert">{error}</p>}

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 bg-espresso text-cream py-2.5 hover:bg-espresso-light transition-colors disabled:opacity-50"
        >
          {downloading ? 'Preparing…' : 'Download PNG'}
        </button>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex-1 border border-line py-2.5 hover:border-caramel transition-colors disabled:opacity-50"
        >
          {regenerating ? 'Regenerating…' : 'Regenerate QR'}
        </button>
      </div>
      <p className="text-xs text-espresso-light mt-3">
        Regenerating your QR code invalidates the old one — use this if you think someone else saw your code.
      </p>
    </div>
  )
}
