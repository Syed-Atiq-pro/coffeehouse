import { supabase } from '@/lib/supabase'

const DEFAULT_BUCKET = (import.meta.env.VITE_PRODUCT_IMAGE_BUCKET as string | undefined)?.trim() || 'product-images'
const SIGNED_URL_TTL = 60 * 60

const resolvedCache = new Map<string, string | null>()
const pendingCache = new Map<string, Promise<string | null>>()

function isBrowserUrl(value: string) {
  return /^(https?:\/\/|data:|blob:|\/)/i.test(value)
}

function parseStorageObjectUrl(value: string) {
  try {
    const url = new URL(value)
    const marker = '/storage/v1/object/'
    const markerIndex = url.pathname.indexOf(marker)
    if (markerIndex < 0) return null

    const parts = url.pathname.slice(markerIndex + marker.length).split('/').filter(Boolean)
    if (parts.length < 3) return null

    const mode = parts[0]
    if (!['public', 'sign', 'authenticated', 'private', 'download'].includes(mode)) return null

    return {
      bucket: decodeURIComponent(parts[1]),
      path: parts.slice(2).map(decodeURIComponent).join('/'),
    }
  } catch {
    return null
  }
}

function parseStoragePath(value: string) {
  const explicitSeparator = value.indexOf(':')
  if (explicitSeparator > 0 && !value.includes('://')) {
    const bucket = value.slice(0, explicitSeparator).trim()
    const path = value.slice(explicitSeparator + 1).replace(/^\/+/, '').trim()
    if (bucket && path) return { bucket, path }
  }

  const prefix = `${DEFAULT_BUCKET}/`
  if (value.startsWith(prefix)) {
    return { bucket: DEFAULT_BUCKET, path: value.slice(prefix.length) }
  }

  return { bucket: DEFAULT_BUCKET, path: value.replace(/^\/+/, '') }
}

async function resolveProductImageValue(value: string): Promise<string | null> {
  const raw = value.trim()
  if (!raw) return null

  if (isBrowserUrl(raw)) {
    // Local Vite/static assets such as /images/products/foo.jpg should be
    // returned directly. Only Supabase Storage URLs need signing.
    if (raw.startsWith('/')) return raw

    const storageObject = parseStorageObjectUrl(raw)
    if (!storageObject || raw.includes('/object/sign/')) return raw

    const { data, error } = await supabase.storage
      .from(storageObject.bucket)
      .createSignedUrl(storageObject.path, SIGNED_URL_TTL)

    return error ? raw : data?.signedUrl ?? raw
  }

  const { bucket, path } = parseStoragePath(raw)
  if (!path) return null

  // Try a signed URL first. This works for private product-image buckets.
  const { data: signed, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL)

  if (!signedError && signed?.signedUrl) return signed.signedUrl

  // Public buckets do not require signed URLs.
  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path)
  return publicUrl?.publicUrl ?? null
}

export function resolveProductImage(value: string | null | undefined) {
  if (!value?.trim()) return Promise.resolve(null)

  const key = value.trim()
  if (resolvedCache.has(key)) return Promise.resolve(resolvedCache.get(key) ?? null)

  const existing = pendingCache.get(key)
  if (existing) return existing

  const request = resolveProductImageValue(key)
    .then((url) => {
      resolvedCache.set(key, url)
      return url
    })
    .catch(() => {
      resolvedCache.set(key, null)
      return null
    })
    .finally(() => pendingCache.delete(key))

  pendingCache.set(key, request)
  return request
}
