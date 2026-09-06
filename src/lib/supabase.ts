import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

/**
 * The public landing page must be able to render even when a developer has not
 * configured Supabase yet. Authentication/data operations will report a clear
 * configuration error instead of crashing the entire React application.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

const clientUrl = supabaseUrl || 'https://placeholder.supabase.co'
const clientKey = supabaseAnonKey || 'placeholder-anon-key'

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export const SUPABASE_CONFIG_ERROR =
  'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
