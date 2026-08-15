import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  )
}

// sessionStorage instead of the default localStorage: sessions clear
// automatically when the browser/tab is actually closed, rather than
// persisting indefinitely. Tradeoff worth knowing -- sessionStorage is
// scoped per tab, so opening the site in a brand new tab (not one
// opened from a link within an already-logged-in tab) also requires
// logging in again, same as a closed-and-reopened browser would.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
})
