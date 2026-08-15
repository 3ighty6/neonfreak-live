import { useState, useEffect, useRef } from 'react'
import { Session } from '@supabase/supabase-js'
import { Send, ArrowLeft, MessageCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface ConversationRow {
  id: string
  user_a: string
  user_b: string
  last_message_at: string
  other_user: { id: string; username: string; avatar_url: string | null }
  last_message?: string
}

interface DMRow {
  id: string
  sender_id: string
  content: string
  created_at: string
}

export default function MessagesPage({
  session,
  initialOtherUserId,
}: {
  session: Session
  initialOtherUserId?: string | null
}) {
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [activeConversation, setActiveConversation] = useState<ConversationRow | null>(null)
  const [messages, setMessages] = useState<DMRow[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messageEndRef = useRef<HTMLDivElement>(null)

  const myId = session.user.id

  const loadConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('id, user_a, user_b, last_message_at')
      .or(`user_a.eq.${myId},user_b.eq.${myId}`)
      .order('last_message_at', { ascending: false })

    if (!data) {
      setLoading(false)
      return
    }

    const withUsers: ConversationRow[] = await Promise.all(
      data.map(async (c) => {
        const otherId = c.user_a === myId ? c.user_b : c.user_a
        const { data: u } = await supabase.from('users').select('id, username, avatar_url').eq('id', otherId).single()
        const { data: lastMsg } = await supabase
          .from('direct_messages')
          .select('content')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        return {
          ...c,
          other_user: u || { id: otherId, username: 'Unknown', avatar_url: null },
          last_message: lastMsg?.content,
        }
      })
    )
    setConversations(withUsers)
    setLoading(false)
    return withUsers
  }

  const openThread = async (conv: ConversationRow) => {
    setActiveConversation(conv)
    const { data } = await supabase
      .from('direct_messages')
      .select('id, sender_id, content, created_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  useEffect(() => {
    const init = async () => {
      const convs = await loadConversations()
      if (initialOtherUserId && convs) {
        const { data: conversationId } = await supabase.rpc('get_or_create_conversation', {
          p_other_user_id: initialOtherUserId,
        })
        if (conversationId) {
          let conv = convs.find((c) => c.id === conversationId)
          if (!conv) {
            const { data: u } = await supabase
              .from('users')
              .select('id, username, avatar_url')
              .eq('id', initialOtherUserId)
              .single()
            conv = {
              id: conversationId,
              user_a: myId,
              user_b: initialOtherUserId,
              last_message_at: new Date().toISOString(),
              other_user: u || { id: initialOtherUserId, username: 'Unknown', avatar_url: null },
            }
          }
          openThread(conv)
        }
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!activeConversation) return
    const sub = supabase
      .channel(`dm:${activeConversation.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${activeConversation.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as DMRow])
        }
      )
      .subscribe()
    return () => {
      sub.unsubscribe()
    }
  }, [activeConversation?.id])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return
    const content = newMessage.trim()
    setNewMessage('')
    await supabase.from('direct_messages').insert({
      conversation_id: activeConversation.id,
      sender_id: myId,
      content,
    })
  }

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">Loading messages...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex">
      {/* Conversation list */}
      <div className={`w-full md:w-80 border-r border-gray-800 ${activeConversation ? 'hidden md:block' : ''}`}>
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="text-cyan-400" size={22} /> Messages
          </h1>
        </div>
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No conversations yet. Message a creator from their profile to start one.
          </div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => openThread(c)}
              className={`w-full text-left p-4 border-b border-gray-800 hover:bg-gray-900 transition ${
                activeConversation?.id === c.id ? 'bg-gray-900' : ''
              }`}
            >
              <div className="font-semibold">{c.other_user.username}</div>
              {c.last_message && <div className="text-sm text-gray-500 truncate">{c.last_message}</div>}
            </button>
          ))
        )}
      </div>

      {/* Thread */}
      <div className={`flex-1 flex flex-col ${activeConversation ? '' : 'hidden md:flex'}`}>
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">Select a conversation</div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-800 flex items-center gap-3">
              <button onClick={() => setActiveConversation(null)} className="md:hidden text-gray-400">
                <ArrowLeft size={20} />
              </button>
              <div className="font-semibold">{activeConversation.other_user.username}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_id === myId ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                      m.sender_id === myId ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-200'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>

            <div className="p-4 border-t border-gray-800 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Send a message..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
              />
              <button
                onClick={sendMessage}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded transition"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
