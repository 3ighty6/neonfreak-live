import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import AuthPage from './pages/AuthPage'
import SetupPage from './pages/SetupPage'
import MainApp from './pages/MainApp'
import './index.css'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription?.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 mb-4">
            Neon Chat
          </div>
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  // Check if user is trying to access setup page
  const isSetupPage = window.location.pathname === '/setup'
  const isPitchDeck = window.location.pathname === '/pitch-deck'

  if (isSetupPage) {
    return <SetupPage />
  }

  if (isPitchDeck) {
    // Redirect to static HTML file
    window.location.href = '/pitch-deck.html'
    return <div></div>
  }

  return session ? <MainApp session={session} /> : <AuthPage />
}
