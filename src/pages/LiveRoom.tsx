import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabaseClient'
import type { Room, Message, Tip } from '../types'

export function LiveRoom() {
  const { roomId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [room, setRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [tipAmount, setTipAmount] = useState('5')
  const [tipMessage, setTipMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }

    if (!roomId) return

    fetchRoom()
    subscribeToMessages()
    incrementViewerCount()
  }, [roomId, user, navigate])

  const fetchRoom = async () => {
    try {
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      setRoom(data)

      // Fetch messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*, user:user_id(username, avatar_url)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50)

      setMessages(msgs || [])
    } catch (error) {
      console.error('Failed to fetch room:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload: any) => {
        setMessages((prev) => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const incrementViewerCount = async () => {
    try {
      await supabase.rpc('increment_viewer_count', { room_id: roomId })
    } catch (error) {
      console.error('Failed to increment viewer count:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !roomId || !user) return

    try {
      await supabase.from('messages').insert({
        room_id: roomId,
        user_id: user.id,
        content: messageText,
      })
      setMessageText('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const sendTip = async () => {
    if (!roomId || !room || !user) return

    try {
      await supabase.from('tips').insert({
        room_id: roomId,
        sender_id: user.id,
        receiver_id: room.streamer_id,
        amount: parseFloat(tipAmount),
        message: tipMessage || undefined,
      })

      // Send tip notification as message
      await supabase.from('messages').insert({
        room_id: roomId,
        user_id: user.id,
        content: `💰 Sent a $${tipAmount} tip! ${tipMessage ? `"${tipMessage}"` : ''}`,
      })

      setTipAmount('5')
      setTipMessage('')
    } catch (error) {
      console.error('Failed to send tip:', error)
    }
  }

  if (loading) return <div style={{ padding: '20px' }}>Loading stream...</div>
  if (!room) return <div style={{ padding: '20px' }}>Stream not found</div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', padding: '20px', fontFamily: 'sans-serif' }}>
      {/* Main Stream Area */}
      <div>
        <div style={{
          background: '#000',
          aspectRatio: '16/9',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          position: 'relative',
        }}>
          <div style={{
            textAlign: 'center',
            fontSize: '24px',
          }}>
            {room.is_live ? '🔴 STREAMING' : '⚫ OFFLINE'}
          </div>
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#ff006e',
            color: '#fff',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '14px',
          }}>
            👥 {room.viewer_count}
          </div>
        </div>

        <h1>{room.title}</h1>
        <p>{room.description}</p>
      </div>

      {/* Sidebar - Chat & Tips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Tips Section */}
        <div style={{
          background: '#1a1a1a',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #ff006e',
        }}>
          <h3>💰 Send a Tip</h3>
          <div style={{ marginBottom: '10px' }}>
            <label>Amount</label>
            <input
              type="number"
              min="1"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                boxSizing: 'border-box',
                borderRadius: '4px',
                border: '1px solid #333',
                marginTop: '5px',
              }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Message (optional)</label>
            <input
              type="text"
              value={tipMessage}
              onChange={(e) => setTipMessage(e.target.value)}
              placeholder="Shout out..."
              style={{
                width: '100%',
                padding: '8px',
                boxSizing: 'border-box',
                borderRadius: '4px',
                border: '1px solid #333',
                marginTop: '5px',
              }}
            />
          </div>
          <button
            onClick={sendTip}
            style={{
              width: '100%',
              padding: '10px',
              background: '#ff006e',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Send ${tipAmount}
          </button>
        </div>

        {/* Chat Section */}
        <div style={{
          background: '#1a1a1a',
          padding: '15px',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: '400px',
        }}>
          <h3 style={{ marginTop: 0 }}>💬 Live Chat</h3>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: '10px',
            minHeight: '200px',
          }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ marginBottom: '10px', fontSize: '14px' }}>
                <strong style={{ color: '#ff006e' }}>{msg.user?.username || 'Guest'}:</strong>{' '}
                <span>{msg.content}</span>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '5px' }}>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Say something..."
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #333',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '8px 15px',
                background: '#ff006e',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
