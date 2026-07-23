import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)

  useEffect(() => {
    // Check for confirmation token in URL
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const type = params.get('type')

    if (token && type === 'email') {
      verifyEmail(token)
    }
  }, [])

  const verifyEmail = async (token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      })

      if (error) {
        setError(`Verification error: ${error.message}`)
      } else {
        setMessage('✅ Email verified! You can now log in.')
        setIsLogin(true)
      }
    } catch (err) {
      setError('Verification failed. Try logging in.')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: `${window.location.origin}/auth?type=email`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('✅ Signup successful! Check your email to verify.')
        setVerificationSent(true)
        setEmail('')
        setPassword('')
        setUsername('')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('✅ Logged in successfully!')
        setEmail('')
        setPassword('')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-cyan-400 to-yellow-300 mb-2">
            🎬 NeonLights
          </h1>
          <p className="text-cyan-300 text-lg">Creator Platform</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur border border-pink-500/30 rounded-lg p-8 shadow-2xl shadow-pink-500/20">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded flex gap-2 text-red-300 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded flex gap-2 text-green-300 text-sm">
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
              {message}
            </div>
          )}

          {verificationSent && (
            <div className="mb-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-300 text-sm">
              <strong>✉️ Check your email!</strong> Click the verification link to confirm your account.
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                isLogin
                  ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-lg shadow-pink-500/50'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 border border-pink-500/30'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                !isLogin
                  ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-lg shadow-pink-500/50'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 border border-pink-500/30'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm text-cyan-300 block mb-2">Username</label>
                <div className="flex items-center bg-slate-700/50 border border-pink-500/30 rounded-lg px-3 py-2 focus-within:border-pink-400 transition">
                  <User size={18} className="text-pink-500 mr-2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                    className="flex-1 bg-transparent text-white outline-none placeholder-gray-400"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm text-cyan-300 block mb-2">Email</label>
              <div className="flex items-center bg-slate-700/50 border border-pink-500/30 rounded-lg px-3 py-2 focus-within:border-pink-400 transition">
                <Mail size={18} className="text-pink-500 mr-2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-transparent text-white outline-none placeholder-gray-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-cyan-300 block mb-2">Password</label>
              <div className="flex items-center bg-slate-700/50 border border-pink-500/30 rounded-lg px-3 py-2 focus-within:border-pink-400 transition">
                <Lock size={18} className="text-pink-500 mr-2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-white outline-none placeholder-gray-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition mt-6 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50"
            >
              {loading ? '⏳ Loading...' : isLogin ? '🔓 Login' : '✨ Sign Up'}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-xs text-cyan-300">
            <strong>🧪 Test Account:</strong>
            <div className="mt-2 font-mono text-gray-300">
              📧 demo@test.com
              <br />
              🔐 demo123456
            </div>
          </div>

          {/* Admin Setup Link */}
          <div className="mt-4 p-4 bg-pink-500/10 border border-pink-500/30 rounded-lg text-xs text-pink-300">
            <strong>👑 Admin Setup:</strong>
            <div className="mt-2">
              Need unlimited tokens?{' '}
              <a
                href="/setup"
                className="text-pink-400 hover:text-pink-300 hover:underline font-semibold"
              >
                Create Admin Account →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
