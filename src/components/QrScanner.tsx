import { useEffect, useRef, useState } from 'react'

type Props = {
  onScan: (decodedText: string) => void
}

// Live camera QR scanning, with a manual toggle since not every device/browser
// grants camera access cleanly (desktop without a webcam, permissions denied, etc.)
export default function QrScanner({ onScan }: Props) {
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerId = 'qr-scanner-region'
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null)

  useEffect(() => {
    if (!active) return

    let cancelled = false

    async function start() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return
        const scanner = new Html5Qrcode(containerId)
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 220 },
          (decodedText) => {
            onScan(decodedText)
            setActive(false)
          },
          () => {
            // per-frame decode failures are expected constantly while aiming — ignore
          }
        )
      } catch {
        setError('Could not access the camera. Check permissions, or enter the code manually below.')
        setActive(false)
      }
    }
    start()

    return () => {
      cancelled = true
      scannerRef.current?.stop().then(() => scannerRef.current?.clear()).catch(() => {})
    }
  }, [active, onScan])

  return (
    <div className="mb-4">
      {!active ? (
        <button
          type="button"
          onClick={() => { setError(null); setActive(true) }}
          className="w-full border border-espresso py-2.5 text-sm hover:bg-espresso hover:text-cream transition-colors"
        >
          Scan with camera
        </button>
      ) : (
        <div>
          <div id={containerId} className="w-full" />
          <button
            type="button"
            onClick={() => setActive(false)}
            className="w-full text-sm text-espresso-light underline mt-2"
          >
            Cancel scan
          </button>
        </div>
      )}
      {error && <p className="text-xs text-burgundy mt-2">{error}</p>}
    </div>
  )
}
