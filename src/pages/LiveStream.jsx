import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'

export default function LiveStream({ credits, setCredits, user }) {
  const { id } = useParams()
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState([
    { user: "DaddyDom92", msg: "Twerk that ass baby 🔥" },
    { user: "FreakyMike", msg: "Send me a private show" },
  ])

  const sendMessage = () => {
    if (!message.trim()) return
    setChat([...chat, { user: user?.username || "Guest", msg: message }])
    setMessage('')
  }

  const sendGift = (amount) => {
    if (credits < amount) return alert("Not enough credits")
    setCredits(c => c - amount)
    alert(`Sent ${amount} credit gift! Streamer loves you 😈`)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-3 gap-6">
      {/* Video Player */}
      <div className="lg:col-span-2">
        <div className="aspect-video bg-zinc-950 border border-pink-500/30 rounded-2xl flex items-center justify-center relative overflow-hidden">
          <div className="text-center">
            <div className="text-6xl mb-2">📹</div>
            <div className="text-pink-400">LIVE STREAM • ID #{id}</div>
            <div className="text-xs mt-1">High quality cam • Private enabled</div>
          </div>
          <div className="absolute top-4 right-4 bg-red-600 px-3 py-0.5 text-xs rounded">LIVE</div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={() => sendGift(50)} className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 rounded-xl font-bold">SEND 50 CREDITS GIFT</button>
          <button onClick={() => sendGift(250)} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold">VIP GIFT 250</button>
          <button onClick={() => alert("Private room requested!")} className="flex-1 py-3 border border-pink-500 hover:bg-pink-950 rounded-xl font-bold">REQUEST PRIVATE</button>
        </div>
      </div>

      {/* Chat */}
      <div className="bg-zinc-950 border border-pink-500/30 rounded-2xl flex flex-col h-[600px]">
        <div className="p-4 border-b border-pink-500/20 font-bold flex justify-between">
          LIVE CHAT <span className="text-xs opacity-60">2.4k watching</span>
        </div>
        
        <div className="flex-1 overflow-auto p-4 space-y-3 text-sm">
          {chat.map((c, i) => (
            <div key={i}><span className="text-pink-400 font-bold">{c.user}:</span> {c.msg}</div>
          ))}
        </div>

        <div className="p-4 border-t border-pink-500/20 flex gap-2">
          <input 
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Say something freaky..."
            className="flex-1 bg-black border border-pink-500/40 rounded p-3 text-sm"
          />
          <button onClick={sendMessage} className="px-6 bg-pink-600 hover:bg-pink-700 rounded">SEND</button>
        </div>
      </div>
    </div>
  )
}
