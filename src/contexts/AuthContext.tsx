import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase, SUPABASE_CONFIG_ERROR } from '@/lib/supabase'

export type Profile = {
  id: string
  role: 'customer' | 'staff' | 'manager' | 'admin'
  full_name: string | null
  phone: string | null
  profile_photo_url: string | null
  loyalty_points: number
  loyalty_tier: string
  total_orders: number
  total_spending: number
  member_id: string | null
  qr_token: string
  identity_verified: boolean
  referred_by: string | null
}

type AuthContextType = {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, referralCode?: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null; isStaff: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Profile load failed:', error.message)
      setProfile(null)
      return null
    }

    const nextProfile = data as Profile | null
    setProfile(nextProfile)
    return nextProfile
  }

  useEffect(() => {
    let mounted = true

    if (!isSupabaseConfigured) {
      setLoading(false)
      return () => { mounted = false }
    }

    async function bootstrap() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) console.error('Auth bootstrap failed:', error.message)
        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.error('Auth bootstrap failed:', error)
        if (mounted) {
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void bootstrap()

    // Do not perform Supabase database/storage calls directly inside
    // onAuthStateChange. Supabase documents a potential auth deadlock when
    // another async Supabase call is made from inside this callback.
    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, nextSession: Session | null) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      if (!nextSession?.user) {
        setProfile(null)
        setLoading(false)
        return
      }

      setLoading(true)
      window.setTimeout(() => {
        if (!mounted) return
        void loadProfile(nextSession.user.id).finally(() => {
          if (mounted) setLoading(false)
        })
      }, 0)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function signUp(email: string, password: string, fullName: string, referralCode?: string) {
    if (!isSupabaseConfigured) return { error: SUPABASE_CONFIG_ERROR }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) return { error: error.message }

    // Profile creation is handled by the database auth trigger. This is important
    // when email confirmation is enabled because the browser may not have an
    // authenticated session immediately after sign-up.
    if (data.session && referralCode?.trim()) {
      // Referral application is best-effort and must never block account creation.
      await supabase.rpc('apply_referral_code', { p_code: referralCode.trim() })
    }

    return { error: null }
  }

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured) return { error: SUPABASE_CONFIG_ERROR, isStaff: false }

    const normalizedEmail = email.trim().toLowerCase()

    // Authentication is handled entirely by Supabase Auth. Staff status is
    // determined by the trusted profile role, never by an email pattern or a
    // password hard-coded into the client bundle.
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
    if (error) return { error: error.message, isStaff: false }

    // Load the profile immediately so the login page can route correctly without
    // waiting for the auth-state listener to finish its asynchronous profile load.
    const signedInProfile = data.user ? await loadProfile(data.user.id) : null
    const isStaff = signedInProfile?.role === 'staff' || signedInProfile?.role === 'manager' || signedInProfile?.role === 'admin'

    return { error: null, isStaff }
  }

  async function signOut() {
    if (!isSupabaseConfigured) return
    await supabase.auth.signOut()
  }

  async function refreshProfile() {
    if (!user || !isSupabaseConfigured) return
    await loadProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
