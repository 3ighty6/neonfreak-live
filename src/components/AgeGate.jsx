import React, { useState } from 'react'

export default function AgeGate({ onVerify }) {
  const [birthdate, setBirthdate] = useState('')
  const [error, setError] = useState('')

  const handleVerify = () => {
    if (!birthdate) {
      setError('Enter your birth date')
      return
    }
    const birth = new Date(birthdate)
    const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    
    if (age >= 18) {
      onVerify()
    } else {
      setError('You must be 18+ to enter. Access denied.')
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-950 border border-pink-500/30 p-8 rounded-2xl text-center">
        <div className="text-6xl mb-4">🔥</div>
        <h1 className="text-4xl font-bold tracking-widest text-pink-500 mb-2">NEONFREAK LIVE</h1>
        <p className="text-pink-400 mb-8">18+ ADULT LIVE CAMS • NO LIMITS</p>

        <div className="mb-6">
          <label className="block text-sm mb-2 text-left">DATE OF BIRTH</label>
          <input 
            type="date" 
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            className="w-full bg-black border border-pink-500/50 p-3 rounded text-white"
          />
        </div>

        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

        <button 
          onClick={handleVerify}
          className="w-full py-4 bg-pink-600 hover:bg-pink-700 active:bg-pink-800 rounded-xl font-bold tracking-widest text-lg transition"
        >
          VERIFY AGE & ENTER
        </button>

        <p className="text-[10px] text-zinc-500 mt-6">By entering you confirm you are 18+. NSFW content ahead.</p>
      </div>
    </div>
  )
}
