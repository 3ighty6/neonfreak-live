import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import AgeGate from './components/AgeGate'
import Home from './pages/Home'
import LiveStream from './pages/LiveStream'
import Login from './pages/Login'
import Profile from './pages/Profile'
import './index.css'

function App() {
  const [isVerified, setIsVerified] = useState(false)
  const [user, setUser] = useState(null)
  const [credits, setCredits] = useState(1250)

  // Check localStorage for age gate
  useEffect(() => {
    const verified = localStorage.getItem('ageVerified')
    if (verified === 'true') setIsVerified(true)
    
    const savedUser = localStorage.getItem('user')
    if (savedUser) setUser(JSON.parse(savedUser))
  }, [])

  const handleAgeVerify = () => {
    localStorage.setItem('ageVerified', 'true')
    setIsVerified(true)
  }

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  if (!isVerified) {
    return <AgeGate onVerify={handleAgeVerify} />
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Neon Nav */}
      <nav className="bg-zinc-950 border-b border-pink-500/30 p-4 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="text-3xl font-bold tracking-widest text-pink-500">NEONFREAK</Link>
        
        <div className="flex items-center gap-6 text-sm">
          <Link to="/" className="hover:text-pink-400">LIVE</Link>
          <Link to="/profile" className="hover:text-pink-400">PROFILE</Link>
          {user ? (
            <button onClick={handleLogout} className="text-red-400 hover:text-red-500">LOGOUT</button>
          ) : (
            <Link to="/login" className="px-4 py-1.5 bg-pink-600 hover:bg-pink-700 rounded">LOGIN / SIGNUP</Link>
          )}
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-pink-500/50 rounded">
            <span>∞</span> <span className="text-pink-400 font-bold">{credits}</span> CREDITS
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home credits={credits} setCredits={setCredits} user={user} />} />
        <Route path="/stream/:id" element={<LiveStream credits={credits} setCredits={setCredits} user={user} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/profile" element={<Profile user={user} credits={credits} setCredits={setCredits} />} />
      </Routes>

      <footer className="text-center text-xs text-zinc-500 py-8 border-t border-pink-500/20">
        NEONFREAK LIVE • 18+ ONLY • WE FREE • NO LIMITS
      </footer>
    </div>
  )
}

export default App
