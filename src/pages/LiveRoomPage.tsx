import { useState, useEffect, useRef } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import { Send, Heart, Users, Share2, Settings } from 'lucide-react'

interface LiveRoomPageProps {
  session: Session
  roomId: string
}

export default function LiveRoomPage({ session, roomId }: LiveRoomPageProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [_viewers, _setViewers] = useState(0)
  const [_isStreaming, _setIsStreaming] = useState(true)
  const [tips, setTips] = useState<any[]>([])
  const messageEndRef = useRef<HTMLDivElement>(null)

  const TIP_AMOUNTS = [
    { amount: 1, emoji: '💬', label: 'Say Hi' },
    { amount: 5, emoji: '👋', label: 'Wave' },
    { amount: 10, emoji: '🎁', label: 'Gift' },
    { amount: 25, emoji: '❤️', label: 'Love' },
    { amount: 50, emoji: '🔥', label: 'Fire' },
  ]

  useEffect(() => {
    // Subscribe to messages
    const subscription = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [roomId])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    const { error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        user_id: session.user.id,
        content: newMessage,
      })

    if (!error) {
      setNewMessage('')
    }
  }

  const sendTip = async (amount: number) => {
    const { error } = await supabase
      .from('tips')
      .insert({
        room_id: roomId,
        sender_id: session.user.id,
        receiver_id: roomId,
        amount: amount,
      })

    if (!error) {
      setTips(prev => [...prev, { amount, timestamp: new Date() }])
    }
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Video Player */}
      <div className="flex-1 bg-gray-900 relative overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🎥</div>
            <div className="text-gray-400 mb-2">HLS Video Stream</div>
            <div className={`text-lg font-bold ${true ? 'text-red-500' : 'text-gray-500'}`}>
              {true ? '● LIVE' : 'OFFLINE'}
            </div>
          </div>
        </div>

        {/* Stats Overlay */}
        <div className="absolute top-4 left-4 bg-black/70 px-4 py-2 rounded-lg flex gap-4">
          <div className="flex items-center gap-2 text-white">
            <Users size={16} />
            <span>{0} viewers</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400">
            <Heart size={16} />
            <span>{tips.length} tips</span>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="bg-cyan-500/20 hover:bg-cyan-500/40 p-2 rounded-lg text-cyan-400">
            <Share2 size={20} />
          </button>
          <button className="bg-gray-700/40 hover:bg-gray-700/60 p-2 rounded-lg text-gray-300">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Chat & Tips Section */}
      <div className="h-80 bg-gray-950 border-t border-cyan-500/20 flex flex-col md:flex-row">
        {/* Chat */}
        <div className="flex-1 flex flex-col border-r border-cyan-500/20">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className="text-sm">
                <span className="text-cyan-400 font-semibold">{msg.user?.username || 'User'}:</span>
                <span className="text-gray-300 ml-2">{msg.content}</span>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-800 p-3 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Send a message..."
              className="flex-1 bg-gray-900 text-white rounded px-3 py-2 text-sm border border-gray-800 focus:border-cyan-500 outline-none"
            />
            <button
              onClick={sendMessage}
              className="bg-cyan-500 hover:bg-cyan-600 text-black px-3 py-2 rounded font-semibold flex items-center gap-1"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Tips Menu */}
        <div className="w-full md:w-48 p-3 flex flex-col gap-2 border-t md:border-t-0 md:border-l border-gray-800">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Quick Tips</div>
          {TIP_AMOUNTS.map((tip) => (
            <button
              key={tip.amount}
              onClick={() => sendTip(tip.amount)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <span>{tip.emoji}</span>
              <span>${tip.amount}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
