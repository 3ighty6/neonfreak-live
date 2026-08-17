import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

export default function DiagnosticPage({ session }: { session: Session }) {
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setIsAdmin(!!data?.is_admin))
  }, [session.user.id])

  if (isAdmin === null) {
    return <div className="min-h-screen bg-black text-gray-400 flex items-center justify-center">Loading...</div>
  }
  if (!isAdmin) {
    return <div className="min-h-screen bg-black text-red-400 flex items-center justify-center">Access denied.</div>
  }

  const runDiagnostics = async () => {
    setLoading(true)
    const newResults: Record<string, any> = {}

    try {
      // Test 1: Supabase connection (rooms is the canonical live-stream table)
      try {
        const { error } = await supabase.from('rooms').select('id').limit(1)
        newResults.supabaseConnection = error ? `❌ ${error.message}` : '✅ Connected'
      } catch (e) {
        newResults.supabaseConnection = `❌ ${String(e)}`
      }

      // Test 2: Token balance API
      try {
        const res = await fetch('/api/get-token-balance?userId=test-user')
        const data = await res.json()
        newResults.tokenBalanceAPI = res.ok ? `✅ ${JSON.stringify(data)}` : `❌ ${res.status}`
      } catch (e) {
        newResults.tokenBalanceAPI = `❌ ${String(e)}`
      }

      // Test 3: Mux stream creation
      try {
        const res = await fetch('/api/mux-create-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streamerId: 'test', title: 'Test' }),
        })
        const data = await res.json()
        newResults.muxAPI = res.ok ? `✅ ${JSON.stringify(data).slice(0, 100)}` : `❌ ${data.error || res.status}`
      } catch (e) {
        newResults.muxAPI = `❌ ${String(e)}`
      }

      // Test 4: Hashtag search API
      try {
        const res = await fetch('/api/search-hashtags?tag=test')
        const data = await res.json()
        newResults.searchAPI = res.ok ? `✅ ${JSON.stringify(data).slice(0, 100)}` : `❌ ${res.status}`
      } catch (e) {
        newResults.searchAPI = `❌ ${String(e)}`
      }

      // Test 5: Environment variables
      try {
        const hasSupabaseUrl = !!import.meta.env.VITE_SUPABASE_URL
        const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY
        newResults.envVars = `${hasSupabaseUrl ? '✅' : '❌'} Supabase URL, ${hasSupabaseKey ? '✅' : '❌'} Supabase Key`
      } catch (e) {
        newResults.envVars = `❌ ${String(e)}`
      }

      // Test 6: users table read (profile edits now go direct through Supabase, RLS-scoped)
      try {
        const { error } = await supabase.from('users').select('id').limit(1)
        newResults.profileAPI = error ? `❌ ${error.message}` : '✅ users table reachable'
      } catch (e) {
        newResults.profileAPI = `❌ ${String(e)}`
      }

      // Test 7: Age verification API
      try {
        const res = await fetch('/api/verify-age-dob', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'test', dob: '2000-01-01' }),
        })
        const data = await res.json()
        newResults.ageVerifyAPI = res.ok ? `✅ ${JSON.stringify(data).slice(0, 100)}` : `❌ ${data.error || res.status}`
      } catch (e) {
        newResults.ageVerifyAPI = `❌ ${String(e)}`
      }
    } finally {
      setLoading(false)
      setResults(newResults)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-pink-500">🔧 Diagnostic Report</h1>
      
      <button
        onClick={runDiagnostics}
        disabled={loading}
        className="px-6 py-3 bg-cyan-500 text-black font-bold rounded mb-8 hover:bg-cyan-400 disabled:opacity-50"
      >
        {loading ? 'Running...' : 'Run Full Diagnostic'}
      </button>

      <div className="space-y-4">
        {Object.entries(results).map(([key, value]) => (
          <div key={key} className="bg-slate-800 p-4 rounded border border-cyan-500">
            <div className="font-bold text-cyan-400">{key}</div>
            <div className="text-sm mt-2 font-mono break-all">{String(value)}</div>
          </div>
        ))}
      </div>

      {Object.keys(results).length === 0 && !loading && (
        <div className="text-gray-400 mt-8">Click "Run Full Diagnostic" to test all APIs</div>
      )}
    </div>
  )
}
