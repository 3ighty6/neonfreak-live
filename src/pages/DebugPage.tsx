import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function DebugPage() {
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const test = async (name: string, fn: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [name]: true }))
    try {
      const result = await fn()
      setResults(prev => ({ ...prev, [name]: { status: 'OK', data: result } }))
    } catch (error: any) {
      setResults(prev => ({ ...prev, [name]: { status: 'ERROR', error: error?.message || String(error) } }))
    }
    setLoading(prev => ({ ...prev, [name]: false }))
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-pink-500">🔧 Debug Tests</h1>

      <div className="grid grid-cols-1 gap-6">
        {/* Auth Test */}
        <div className="bg-gray-800 p-6 rounded">
          <button
            onClick={() => test('auth', async () => {
              const { data } = await supabase.auth.getSession()
              return data
            })}
            disabled={loading['auth']}
            className="bg-pink-500 px-4 py-2 rounded hover:bg-pink-600 disabled:opacity-50"
          >
            {loading['auth'] ? 'Testing...' : 'Test Auth'}
          </button>
          {results['auth'] && (
            <pre className={`mt-4 p-4 rounded ${results['auth'].status === 'OK' ? 'bg-green-900' : 'bg-red-900'}`}>
              {JSON.stringify(results['auth'], null, 2)}
            </pre>
          )}
        </div>

        {/* Mux Stream Test */}
        <div className="bg-gray-800 p-6 rounded">
          <button
            onClick={() => test('mux', async () => {
              const res = await fetch('/api/mux-create-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ streamerId: 'test-user', title: 'Test Stream' })
              })
              const data = await res.json()
              if (!res.ok) throw new Error(JSON.stringify(data))
              return data
            })}
            disabled={loading['mux']}
            className="bg-cyan-500 px-4 py-2 rounded hover:bg-cyan-600 disabled:opacity-50"
          >
            {loading['mux'] ? 'Testing...' : 'Test Mux Stream Creation'}
          </button>
          {results['mux'] && (
            <pre className={`mt-4 p-4 rounded ${results['mux'].status === 'OK' ? 'bg-green-900' : 'bg-red-900'}`}>
              {JSON.stringify(results['mux'], null, 2)}
            </pre>
          )}
        </div>

        {/* Token Balance Test */}
        <div className="bg-gray-800 p-6 rounded">
          <button
            onClick={() => test('token', async () => {
              const res = await fetch('/api/get-token-balance?userId=test-user')
              const data = await res.json()
              if (!res.ok) throw new Error(JSON.stringify(data))
              return data
            })}
            disabled={loading['token']}
            className="bg-yellow-500 px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            {loading['token'] ? 'Testing...' : 'Test Token Balance'}
          </button>
          {results['token'] && (
            <pre className={`mt-4 p-4 rounded ${results['token'].status === 'OK' ? 'bg-green-900' : 'bg-red-900'}`}>
              {JSON.stringify(results['token'], null, 2)}
            </pre>
          )}
        </div>

        {/* Hashtag Search Test */}
        <div className="bg-gray-800 p-6 rounded">
          <button
            onClick={() => test('search', async () => {
              const res = await fetch('/api/search-hashtags?tag=test')
              const data = await res.json()
              if (!res.ok) throw new Error(JSON.stringify(data))
              return data
            })}
            disabled={loading['search']}
            className="bg-purple-500 px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading['search'] ? 'Testing...' : 'Test Hashtag Search'}
          </button>
          {results['search'] && (
            <pre className={`mt-4 p-4 rounded ${results['search'].status === 'OK' ? 'bg-green-900' : 'bg-red-900'}`}>
              {JSON.stringify(results['search'], null, 2)}
            </pre>
          )}
        </div>

        {/* Supabase Connection Test */}
        <div className="bg-gray-800 p-6 rounded">
          <button
            onClick={() => test('supabase', async () => {
              const { data, error } = await supabase.from('streams').select('count')
              if (error) throw error
              return data
            })}
            disabled={loading['supabase']}
            className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading['supabase'] ? 'Testing...' : 'Test Supabase Connection'}
          </button>
          {results['supabase'] && (
            <pre className={`mt-4 p-4 rounded ${results['supabase'].status === 'OK' ? 'bg-green-900' : 'bg-red-900'}`}>
              {JSON.stringify(results['supabase'], null, 2)}
            </pre>
          )}
        </div>

        {/* Environment Variables Test */}
        <div className="bg-gray-800 p-6 rounded">
          <button
            onClick={() => test('env', async () => {
              const res = await fetch('/api/debug-env')
              const data = await res.json()
              if (!res.ok) throw new Error(JSON.stringify(data))
              return data
            })}
            disabled={loading['env']}
            className="bg-orange-500 px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {loading['env'] ? 'Testing...' : 'Test Environment Variables'}
          </button>
          {results['env'] && (
            <pre className={`mt-4 p-4 rounded ${results['env'].status === 'OK' ? 'bg-green-900' : 'bg-red-900'}`}>
              {JSON.stringify(results['env'], null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
