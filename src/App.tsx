import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import AuthPage from './pages/AuthPage'
import MainApp from './pages/MainApp'
import DiagnosticPage from './pages/DiagnosticPage'
import AgeVerificationGate from './components/AgeVerificationGate'
import PrivacyPolicy from './pages/legal/PrivacyPolicy'
import TermsOfService from './pages/legal/TermsOfService'
import OverlayPage from './pages/OverlayPage'
import './index.css'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [ageVerified, setAgeVerified] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('ageVerified') === 'true'
  )

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

  // Check if user is trying to access special pages
  const isPitchDeck = window.location.pathname === '/pitch-deck'
  const isDiagnostic = window.location.pathname === '/diagnostic'
  const isPrivacy = window.location.pathname === '/privacy'
  const isTerms = window.location.pathname === '/terms'
  const overlayMatch = window.location.pathname.match(/^\/overlay\/([a-zA-Z0-9-]+)$/)

  if (isPitchDeck) {
    // Redirect to static HTML file
    window.location.href = '/pitch-deck.html'
    return <div></div>
  }

  if (isDiagnostic) {
    return session ? <DiagnosticPage session={session} /> : <AuthPage />
  }

  // OBS Browser Sources have no session and can't click through an age
  // gate, so this bypasses both auth and age verification entirely --
  // gated instead by the private overlay_token in the URL itself.
  if (overlayMatch) {
    return <OverlayPage token={overlayMatch[1]} />
  }

  // Legal pages are viewable by anyone, logged in or not, verified or not --
  // standard practice, and the age gate itself links here before you've
  // agreed to anything.
  if (isPrivacy) {
    return <PrivacyPolicy />
  }
  if (isTerms) {
    return <TermsOfService />
  }

  if (!ageVerified) {
    return <AgeVerificationGate onVerified={() => setAgeVerified(true)} />
  }

  return session ? <MainApp session={session} /> : <AuthPage />
}
