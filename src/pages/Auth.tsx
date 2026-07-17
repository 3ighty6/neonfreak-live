import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export function AuthPage() {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isStreamer, setIsStreamer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signUp, signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignup) {
        await signUp(email, password, username, isStreamer)
      } else {
        await signIn(email, password)
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', fontFamily: 'sans-serif' }}>
      <h1>{isSignup ? '🔥 Join NeonFreak' : '🔥 Sign In'}</h1>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        {isSignup && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={isStreamer}
                  onChange={(e) => setIsStreamer(e.target.checked)}
                />
                {' '}I want to be a streamer
              </label>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            background: '#ff006e',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Loading...' : isSignup ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsSignup(!isSignup)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ff006e',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {isSignup ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  )
}
