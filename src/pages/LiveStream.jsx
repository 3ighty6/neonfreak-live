import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function LiveStream({ credits, setCredits, user }) {
  const { id } = useParams()
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState([])

  useEffect(() => {
    // Load initial messages
    const loadMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('stream_id', id)
        .order('created_at', { ascending: true })
      if (data) setChat(data)
    }
    loadMessages()

    // Realtime
    const channel = supabase
      .channel(`stream-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `stream_id=eq.${id}` }, (payload) => {
        setChat(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [id])

  const sendMessage = async () => {
    if (!message.trim() || !user) return
    await supabase.from('chat_messages').insert([{
      stream_id: parseInt(id),
      user_id: user.id,
      message: message.trim()
    }])
    setMessage('')
  }

  const sendGift = async (amount) => {
    if (credits < amount) return alert("Not enough credits")
    setCredits(c => c - amount)
    alert(`Sent ${amount} credit gift!`)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="aspect-video bg-zinc-950 border border-pink-500/30 rounded-2xl flex items-center justify-center relative">
          <div className="text-center">
            <div className="text-6xl mb-2">📹 LIVE</div>
            <div className="text-pink-400">Stream #{id} • High Quality Cam</div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={() => sendGift(50)} className="flex-1 py-3 bg-pink-600 rounded-xl font-bold">TIP 50</button>
          <button onClick={() => sendGift(250)} className="flex-1 py-3 bg-purple-600 rounded-xl font-bold">BIG TIP 250</button>
          <button onClick={() => alert("Private show requested!")} className="flex-1 py-3 border border-pink-500 rounded-xl font-bold">GO PRIVATE</button>
        </div>
      </div>

      <div className="bg-zinc-950 border border-pink-500/30 rounded-2xl flex flex-col h-[600px]">
        <div className="p-4 border-b font-bold">LIVE CHAT</div>
        <div className="flex-1 overflow-auto p-4 space-y-2 text-sm">
          {chat.map((c, i) => (
            <div key={i}><span className="text-pink-400">User:</span> {c.message}</div>
          ))}
        </div>
        <div className="p-4 border-t flex gap-2">
          <input 
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Send a tip or message..."
            className="flex-1 bg-black border border-pink-500 p-3 rounded"
          />
          <button onClick={sendMessage} className="px-6 bg-pink-600 rounded">SEND</button>
        </div>
      </div>
    </div>
  )
}
