import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import logoWordmark from '../assets/logo-wordmark.png'

type Mode = 'login' | 'signup' | 'forgot' | 'recovery'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)

  useEffect(() => {
    // Check for confirmation/recovery token in URL
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const type = params.get('type')

    if (token && type === 'email') {
      verifyEmail(token)
    } else if (token && type === 'recovery') {
      verifyRecovery(token)
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
        setMode('login')
      }
    } catch (err) {
      setError('Verification failed. Try logging in.')
    }
  }

  const verifyRecovery = async (token: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      })

      if (error) {
        setError(`Reset link error: ${error.message}. Request a new one below.`)
        setMode('forgot')
      } else {
        // verifyOtp establishes a session — now let them set a new password
        setMode('recovery')
      }
    } catch (err) {
      setError('Reset link failed. Try requesting a new one.')
      setMode('forgot')
    } finally {
      setLoading(false)
      // Clean the token out of the visible URL
      window.history.replaceState({}, '', window.location.pathname)
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
          data: { username },
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
      const { error } = await supabase.auth.signInWithPassword({ email, password })

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('✅ Check your email for a password reset link.')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError(error.message)
      } else {
        setMessage('✅ Password updated! You can now use it to log in.')
        setPassword('')
        setConfirmPassword('')
        setMode('login')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 flex items-center justify-center">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">
        {/* Marketing / earning breakdown */}
        <div className="order-2 lg:order-1">
          <img src={logoWordmark} alt="NeonLights" className="h-16 w-auto mb-2 drop-shadow-[0_0_18px_rgba(255,45,149,0.45)]" />
          <p className="text-cyan-300 text-lg mb-6">The all-in-one creator platform</p>

          <p className="text-gray-300 mb-6 max-w-md">
            Every other platform makes you pick one thing — subscriptions, or cam tips, or clip sales. NeonLights pays you
            for all of it, in one place, with an <span className="text-yellow-300 font-semibold">85% creator share</span> —
            notably above the industry-standard 80%.
          </p>

          <div className="space-y-3 max-w-md">
            {[
              { emoji: '💬', title: 'Live tips', desc: 'Fixed menu or any custom amount, straight from viewers watching you' },
              { emoji: '🎬', title: 'Video & photo sales', desc: 'Pay-per-view videos and photo bundles, priced however you want' },
              { emoji: '⭐', title: 'Perks & extras', desc: 'Sell access to your Snapchat, a subscription, custom requests — your call' },
              { emoji: '🔒', title: 'Private shows', desc: 'Get paid up front for an exclusive session' },
              { emoji: '📼', title: 'Private show resale', desc: 'Recordings can keep earning after the show ends' },
              { emoji: '🚀', title: 'Get boosted', desc: 'Paid promotion tiers put you higher in the discovery feed' },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 items-start bg-slate-800/40 border border-pink-500/10 rounded-lg p-3">
                <span className="text-xl">{item.emoji}</span>
                <div>
                  <div className="font-semibold text-sm">{item.title}</div>
                  <div className="text-xs text-gray-400">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-6 max-w-md">
            Even watching helps you earn — suggest tags and titles on other creators' videos and get paid tokens when they're approved.
          </p>
        </div>

        {/* Login / Signup */}
        <div className="order-1 lg:order-2 w-full max-w-md mx-auto">
        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur border border-pink-500/30 rounded-lg p-8 shadow-2xl shadow-pink-500/20">
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

          {/* Recovery: set a new password */}
          {mode === 'recovery' && (
            <>
              <h2 className="text-xl font-bold mb-4 text-center">Set a New Password</h2>
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div>
                  <label className="text-sm text-cyan-300 block mb-2">New Password</label>
                  <div className="flex items-center bg-slate-700/50 border border-pink-500/30 rounded-lg px-3 py-2 focus-within:border-pink-400 transition">
                    <Lock size={18} className="text-pink-500 mr-2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="flex-1 bg-transparent text-white outline-none placeholder-gray-400"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-cyan-300 block mb-2">Confirm Password</label>
                  <div className="flex items-center bg-slate-700/50 border border-pink-500/30 rounded-lg px-3 py-2 focus-within:border-pink-400 transition">
                    <Lock size={18} className="text-pink-500 mr-2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent text-white outline-none placeholder-gray-400"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition mt-2 shadow-lg shadow-pink-500/30"
                >
                  {loading ? '⏳ Saving...' : 'Set New Password'}
                </button>
              </form>
            </>
          )}

          {/* Forgot password: request a reset email */}
          {mode === 'forgot' && (
            <>
              <h2 className="text-xl font-bold mb-4 text-center">Reset Your Password</h2>
              <form onSubmit={handleForgotPassword} className="space-y-4">
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition mt-2 shadow-lg shadow-pink-500/30"
                >
                  {loading ? '⏳ Sending...' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setMessage('') }}
                  className="w-full text-sm text-cyan-300 hover:text-cyan-200 transition"
                >
                  ← Back to Login
                </button>
              </form>
            </>
          )}

          {/* Login / Signup */}
          {(mode === 'login' || mode === 'signup') && (
            <>
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    mode === 'login'
                      ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-lg shadow-pink-500/50'
                      : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 border border-pink-500/30'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    mode === 'signup'
                      ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-lg shadow-pink-500/50'
                      : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 border border-pink-500/30'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={mode === 'login' ? handleLogin : handleSignUp} className="space-y-4">
                {mode === 'signup' && (
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
                        required
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

                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); setMessage('') }}
                    className="text-sm text-cyan-300 hover:text-cyan-200 transition"
                  >
                    Forgot password?
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition mt-2 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50"
                >
                  {loading ? '⏳ Loading...' : mode === 'login' ? '🔓 Login' : '✨ Sign Up'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="flex justify-center gap-4 mt-6 text-xs text-gray-500">
          <a href="/terms" className="hover:text-gray-300 transition">Terms of Service</a>
          <a href="/privacy" className="hover:text-gray-300 transition">Privacy Policy</a>
        </div>
        </div>
      </div>
    </div>
  )
}
