import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import './index.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check auth state
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return user ? <DashboardPage user={user} /> : <AuthPage />
}
