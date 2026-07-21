import { useState } from 'react'
import { Lock, Check } from 'lucide-react'
import { createAdminAccount } from '../lib/admin'

export default function SetupPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleCreateAdmin = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    const result = await createAdminAccount(password)
    if (result.error) {
      setError(result.error)
    } else {
      setMessage('✅ Admin account created! m.zarling86@gmail.com with unlimited tokens.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
          Neon Chat Setup
        </h1>
        <p className="text-gray-400 mb-8">Initial configuration page</p>

        <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="text-cyan-400" size={24} />
            <h2 className="text-2xl font-bold">Create Admin Account</h2>
          </div>

          <p className="text-gray-400 mb-6">
            Create an admin account with unlimited tokens for testing.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password"
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:border-cyan-500 outline-none"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-4 text-red-300 text-sm">
                ❌ Error: {error}
              </div>
            )}

            {message && (
              <div className="bg-green-500/10 border border-green-500/30 rounded p-4 text-green-300 text-sm">
                {message}
              </div>
            )}

            <button
              onClick={handleCreateAdmin}
              disabled={loading || !password}
              className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-3 rounded font-semibold transition flex items-center justify-center gap-2"
            >
              {loading ? 'Creating...' : (
                <>
                  <Check size={18} />
                  Create Admin Account
                </>
              )}
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded text-sm text-blue-300">
            <strong>Admin Account Details:</strong>
            <div className="mt-2 text-gray-300">
              • Email: m.zarling86@gmail.com
              <br />
              • Tokens: Unlimited (999,999)
              <br />
              • Verified: Automatically
              <br />
              • Streamer: Yes
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
