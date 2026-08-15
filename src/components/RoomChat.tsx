import { useState, useEffect, useRef } from 'react'
import { Session } from '@supabase/supabase-js'
import { Send } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface ChatMessage {
  id: string
  user_id: string
  content: string
  username?: string
  type?: 'chat' | 'tip' | 'follow'
}

/**
 * Shared chat panel for a room -- used on both the viewer's watch page
 * and the streamer's own Go Live page. Previously only the viewer side
 * had this; a streamer broadcasting (camera or OBS) had no visibility
 * into their own chat at all.
 */
export default function RoomChat({
  session,
  roomId,
  streamerId,
  compact = false,
}: {
  session: Session
  roomId: string
  streamerId?: string
  compact?: boolean
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messageEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, user_id, content, users:user_id(username)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (data) {
        setMessages(
          data.map((m: any) => ({
            id: m.id,
            user_id: m.user_id,
            content: m.content,
            username: m.users?.username,
            type: 'chat' as const,
          }))
        )
      }
    }
    loadMessages()
  }, [roomId])

  useEffect(() => {
    const subscription = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const row = payload.new as any
          const { data: userRow } = await supabase.from('users').select('username').eq('id', row.user_id).single()
          setMessages((prev) => [
            ...prev,
            { id: row.id, user_id: row.user_id, content: row.content, username: userRow?.username, type: 'chat' },
          ])
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tips', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const row = payload.new as any
          const { data: userRow } = await supabase.from('users').select('username').eq('id', row.sender_id).single()
          setMessages((prev) => [
            ...prev,
            {
              id: `tip-${row.id}`,
              user_id: row.sender_id,
              content: `tipped ${row.amount} tokens! 🎉`,
              username: userRow?.username || 'Someone',
              type: 'tip',
            },
          ])
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'followers', filter: `streamer_id=eq.${streamerId}` },
        async (payload) => {
          if (!streamerId) return
          const row = payload.new as any
          const { data: userRow } = await supabase.from('users').select('username').eq('id', row.follower_id).single()
          setMessages((prev) => [
            ...prev,
            {
              id: `follow-${row.id}`,
              user_id: row.follower_id,
              content: 'started following! 💜',
              username: userRow?.username || 'Someone',
              type: 'follow',
            },
          ])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [roomId, streamerId])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      user_id: session.user.id,
      content: newMessage.trim(),
    })
    if (!error) setNewMessage('')
  }

  return (
    <div className={`flex flex-col ${compact ? 'h-80' : 'h-full'} bg-gray-950 rounded-lg border border-gray-800`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-gray-600 text-sm text-center mt-4">No messages yet.</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm ${
              msg.type === 'tip'
                ? 'bg-purple-500/10 border border-purple-500/20 rounded px-2 py-1'
                : msg.type === 'follow'
                  ? 'bg-pink-500/10 border border-pink-500/20 rounded px-2 py-1'
                  : ''
            }`}
          >
            <span
              className={
                msg.type === 'tip'
                  ? 'text-purple-400 font-semibold'
                  : msg.type === 'follow'
                    ? 'text-pink-400 font-semibold'
                    : 'text-cyan-400 font-semibold'
              }
            >
              {msg.username || 'User'}
              {msg.type === 'chat' ? ':' : ''}
            </span>
            <span className="text-gray-300 ml-2">{msg.content}</span>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      <div className="border-t border-gray-800 p-3 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
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
  )
}
