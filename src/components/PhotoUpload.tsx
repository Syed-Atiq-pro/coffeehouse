import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function PhotoUpload({ currentUrl }: { currentUrl: string | null }) {
  const { user, refreshProfile } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl)

  useEffect(() => {
    setPreview(currentUrl)
  }, [currentUrl])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please choose a JPG, PNG, or WEBP image.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Image must be under 5MB.')
      return
    }

    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${user.id}/photo.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    // Store the storage path (not a public URL — bucket is private).
    // The card page resolves this to a signed URL when displaying.
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_photo_url: path })
      .eq('id', user.id)

    setUploading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setPreview(URL.createObjectURL(file))
    await refreshProfile()
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-cream-dark border border-line overflow-hidden flex items-center justify-center shrink-0">
        {preview ? (
          <img src={preview} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-espresso-light">No photo</span>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm border border-line px-3 py-1.5 hover:border-caramel transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload photo'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="hidden"
        />
        {error && <p className="text-xs text-burgundy mt-1">{error}</p>}
      </div>
    </div>
  )
}
