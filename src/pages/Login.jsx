import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username) {
      onLogin({ username, id: Date.now() })
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="bg-zinc-950 border border-pink-500/30 p-8 rounded-2xl w-full max-w-md">
        <h1 className="text-4xl font-bold text-pink-500 mb-8 text-center">NEONFREAK LOGIN</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="Username or Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-4 bg-black border border-pink-500/50 rounded-xl text-white"
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-4 bg-black border border-pink-500/50 rounded-xl text-white"
          />
          <button type="submit" className="w-full py-4 bg-pink-600 hover:bg-pink-700 rounded-xl font-bold text-lg">
            LOGIN / CREATE ACCOUNT
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500 mt-6">18+ • NSFW • Credits Ready</p>
      </div>
    </div>
  )
}
