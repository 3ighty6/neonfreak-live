import { useState } from 'react'
import { Bug, CheckCircle, AlertCircle } from 'lucide-react'

interface TestResult {
  endpoint: string
  status: 'idle' | 'loading' | 'success' | 'error'
  message: string
  response?: any
}

export default function DebugPage() {
  const [results, setResults] = useState<TestResult[]>([])

  const testEndpoint = async (endpoint: string, method: string = 'GET', body?: any) => {
    const testName = `${method} ${endpoint}`
    setResults((prev) => [...prev, { endpoint: testName, status: 'loading', message: 'Testing...' }])

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = await response.json()

      setResults((prev) =>
        prev.map((r) =>
          r.endpoint === testName
            ? {
                ...r,
                status: response.ok ? 'success' : 'error',
                message: response.ok ? 'Success' : `Error: ${data.error}`,
                response: data,
              }
            : r
        )
      )
    } catch (error) {
      setResults((prev) =>
        prev.map((r) =>
          r.endpoint === testName
            ? {
                ...r,
                status: 'error',
                message: `Network error: ${String(error)}`,
              }
            : r
        )
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Bug className="text-yellow-400" size={32} />
          <h1 className="text-4xl font-bold">Debug Console</h1>
        </div>

        <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Test Endpoints</h2>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => testEndpoint('/api/mux-create-stream', 'POST', {
                streamerId: 'test-user',
                title: 'Test Stream',
              })}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded font-semibold transition"
            >
              Test Mux Stream Creation
            </button>

            <button
              onClick={() => testEndpoint('/api/get-token-balance', 'GET')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded font-semibold transition"
            >
              Test Token Balance
            </button>

            <button
              onClick={() => testEndpoint('/api/search-hashtags?tag=%23live', 'GET')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded font-semibold transition"
            >
              Test Hashtag Search
            </button>

            <button
              onClick={() => testEndpoint('/api/admin/stats', 'GET')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded font-semibold transition"
            >
              Test Admin Stats
            </button>

            <button
              onClick={() => testEndpoint('/api/verify-age-dob', 'POST', {
                dob: '2000-01-01',
              })}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded font-semibold transition"
            >
              Test Age Verification
            </button>

            <button
              onClick={() => testEndpoint('/api/creator/analytics', 'GET')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded font-semibold transition"
            >
              Test Creator Analytics
            </button>
          </div>

          <button
            onClick={() => setResults([])}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition"
          >
            Clear Results
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {results.map((result, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-4 ${
                result.status === 'success'
                  ? 'bg-green-500/10 border-green-500/30'
                  : result.status === 'error'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-gray-800/50 border-gray-700'
              }`}
            >
              <div className="flex items-start gap-3 mb-2">
                {result.status === 'success' && (
                  <CheckCircle className="text-green-400 mt-1" size={20} />
                )}
                {result.status === 'error' && (
                  <AlertCircle className="text-red-400 mt-1" size={20} />
                )}
                {result.status === 'loading' && (
                  <div className="animate-spin">⏳</div>
                )}
                <div className="flex-1">
                  <p className="font-mono text-sm font-semibold">{result.endpoint}</p>
                  <p
                    className={`text-sm ${
                      result.status === 'success'
                        ? 'text-green-300'
                        : result.status === 'error'
                          ? 'text-red-300'
                          : 'text-gray-400'
                    }`}
                  >
                    {result.message}
                  </p>
                </div>
              </div>

              {result.response && (
                <div className="mt-3 p-3 bg-black/50 rounded font-mono text-xs text-gray-400 overflow-auto max-h-48">
                  <pre>{JSON.stringify(result.response, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm text-gray-300">
          <p className="font-semibold text-yellow-400 mb-2">🔍 Debug Info</p>
          <p>Check browser console for detailed logs when testing endpoints.</p>
          <p>Check Vercel Deployments for real-time logs: https://vercel.com/dashboard/neonfreak-live</p>
        </div>
      </div>
    </div>
  )
}
