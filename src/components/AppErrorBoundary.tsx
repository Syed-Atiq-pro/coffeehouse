import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean; message: string }

/** Prevent an unexpected render error from becoming an unexplained white page. */
export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'An unexpected error occurred.',
    }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Coffee House render error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#100a07', color: '#f3e5d0', fontFamily: 'system-ui, sans-serif' }}>
        <section style={{ width: 'min(620px, 100%)', border: '1px solid rgba(243,229,208,.16)', padding: 32, background: '#19100b' }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: '.2em', color: '#c89155' }}>COFFEE HOUSE · RECOVERY</p>
          <h1 style={{ margin: '16px 0 12px', fontSize: 'clamp(34px, 7vw, 58px)', fontWeight: 500, lineHeight: 1 }}>Something interrupted the experience.</h1>
          <p style={{ color: '#b9aa92', lineHeight: 1.7 }}>The app caught a frontend error instead of showing a blank screen. Check the browser console for the technical details.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: 12, padding: '12px 18px', border: 0, background: '#c89155', color: '#1b0d07', cursor: 'pointer', fontWeight: 700 }}
          >
            Reload Coffee House
          </button>
          {import.meta.env.DEV && this.state.message && (
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 24, padding: 16, background: '#0c0806', color: '#d9c4a5', overflow: 'auto' }}>{this.state.message}</pre>
          )}
        </section>
      </main>
    )
  }
}
