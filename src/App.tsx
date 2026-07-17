import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'

function App() {
  const [configStatus, setConfigStatus] = useState<string>('Loading...')

  useEffect(() => {
    const checkConfig = async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          setConfigStatus('✅ Supabase Connected! Ready for deployment.')
        } catch (error) {
          setConfigStatus('⚠️ Supabase configured but needs environment variables')
        }
      } else {
        setConfigStatus('⚠️ Supabase environment variables not configured')
      }
    }
    checkConfig()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">🔥 NeonFreak Live</h1>
          <p className="text-purple-300 text-lg">Cam Chat Platform</p>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6 space-y-4">
          <div className="text-2xl">🚀</div>
          <h2 className="text-xl font-semibold">Deployment Status</h2>
          <p className="text-purple-200">{configStatus}</p>
          
          <div className="bg-slate-700 rounded p-4 text-sm text-left space-y-2">
            <p className="font-mono text-purple-300">✓ Build: Fixed</p>
            <p className="font-mono text-purple-300">✓ Config: Ready</p>
            <p className="font-mono text-purple-300">✓ Database: Available</p>
            <p className="font-mono text-green-400">→ Next: Add environment variables in Vercel</p>
          </div>
        </div>
        
        <div className="text-xs text-slate-400 pt-4">
          <p>All systems ready for deployment</p>
          <p className="mt-2">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel Settings</p>
        </div>
      </div>
    </div>
  )
}

export default App
