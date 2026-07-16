import React from 'react'

export default function Profile({ user, credits, setCredits }) {
  if (!user) return <div className="p-8 text-center">Login to see profile</div>

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-3xl">Welcome, {user.username}</h1>
      <div className="mt-8 text-5xl font-mono text-pink-400">{credits} CREDITS</div>
      <button onClick={() => setCredits(c => c + 1000)} className="mt-4 px-6 py-3 bg-pink-600 rounded">ADD CREDITS</button>
    </div>
  )
}
