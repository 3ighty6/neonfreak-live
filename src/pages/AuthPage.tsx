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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 mb-2">
            Neon Chat
          </h1>
          <p className="text-gray-400">Live streaming platform</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-8">
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
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded text-blue-300 text-sm">
              <strong>Check your email!</strong> Click the verification link to confirm your account.
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded font-semibold transition ${
                isLogin
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded font-semibold transition ${
                !isLogin
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm text-gray-400 block mb-2">Username</label>
                <div className="flex items-center bg-gray-800 border border-gray-700 rounded px-3 py-2">
                  <User size={18} className="text-gray-500 mr-2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                    className="flex-1 bg-transparent text-white outline-none"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-400 block mb-2">Email</label>
              <div className="flex items-center bg-gray-800 border border-gray-700 rounded px-3 py-2">
                <Mail size={18} className="text-gray-500 mr-2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-transparent text-white outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Password</label>
              <div className="flex items-center bg-gray-800 border border-gray-700 rounded px-3 py-2">
                <Lock size={18} className="text-gray-500 mr-2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-white outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:opacity-50 text-white py-2 rounded font-semibold transition mt-6"
            >
              {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-800 rounded text-xs text-gray-400">
            <strong>Test Account:</strong>
            <div className="mt-2">
              Email: demo@test.com
              <br />
              Password: demo123456
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
