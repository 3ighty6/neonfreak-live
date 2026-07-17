import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Send, Heart, Gift, ArrowLeft, Users } from 'lucide-react'

export default function LiveRoom({ room, onBack }: { room: any; onBack: () => void }) {
  const [messages, setMessages] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [tip, setTip] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [viewerCount, setViewerCount] = useState(room.viewer_count || 0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Fetch messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, users:user_id(username)')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true })

      setMessages(data || [])
    }

    fetchMessages()

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel(`room:${room.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${room.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    // Update viewer count
    const updateViewers = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id)

      setViewerCount((count || 0) + 1)
    }

    updateViewers()

    return () => {
      messageSubscription.unsubscribe()
    }
  }, [room.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !user) return

    setLoading(true)

    try {
      const { error } = await supabase.from('messages').insert({
        room_id: room.id,
        user_id: user.id,
        content: message,
      })

      if (!error) {
        setMessage('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendTip = async () => {
    if (!tip || !user) return

    setLoading(true)

    try {
      // Create reaction/tip
      await supabase.from('reactions').insert({
        room_id: room.id,
        user_id: user.id,
        reaction_type: `tip:${tip}`,
      })

      // Send tip message
      await supabase.from('messages').insert({
        room_id: room.id,
        user_id: user.id,
        content: `💰 Sent a $${tip} tip!`,
      })

      setTip('')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const tipAmounts = ['1', '5', '10', '50', '100']

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex items-center gap-4 bg-gray-900 border-b border-gray-800 p-4">
        <button onClick={onBack} className="text-gray-400 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">{room.title}</h2>
          <p className="text-sm text-gray-400">{room.users?.username}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-red-500">
          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
          <Users size={18} />
          <span>{viewerCount} viewers</span>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Video player placeholder */}
        <div className="flex-1 bg-gradient-to-b from-purple-900 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Stream Video Player</p>
            <p className="text-sm text-gray-500">(WebRTC/HLS integration coming soon)</p>
          </div>
        </div>

        {/* Chat and tips */}
        <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <span className="font-semibold text-purple-400">{msg.users?.username}</span>
                <span className="text-gray-400 ml-2">{msg.content}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <div className="border-t border-gray-800 p-4 space-y-3">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Say something..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg"
              >
                <Send size={18} />
              </button>
            </form>

            {/* Tips */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">Send a Tip</p>
              <div className="flex gap-2 mb-2">
                {tipAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTip(amount)}
                    className={`flex-1 py-2 text-xs font-semibold rounded transition ${
                      tip === amount
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSendTip}
                disabled={!tip || loading}
                className="w-full py-2 px-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                <Gift size={16} />
                Send Tip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
