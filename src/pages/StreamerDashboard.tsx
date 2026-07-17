import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import type { Room } from '../types'

export function StreamerDashboard() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user?.is_streamer) {
      navigate('/')
      return
    }
    fetchMyRooms()
  }, [user, navigate])

  const fetchMyRooms = async () => {
    try {
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .eq('streamer_id', user?.id)

      setRooms(data || [])
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    }
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const { data } = await supabase
        .from('rooms')
        .insert({
          streamer_id: user.id,
          title,
          description,
          is_live: true,
          viewer_count: 0,
        })
        .select()
        .single()

      if (data) {
        setTitle('')
        setDescription('')
        fetchMyRooms()
        navigate(`/room/${data.id}`)
      }
    } catch (error) {
      console.error('Failed to create room:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleLive = async (roomId: string, isLive: boolean) => {
    try {
      await supabase
        .from('rooms')
        .update({ is_live: !isLive })
        .eq('id', roomId)

      fetchMyRooms()
    } catch (error) {
      console.error('Failed to toggle live:', error)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🎬 Streamer Dashboard</h1>

      <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2>Create New Stream</h2>
        <form onSubmit={handleCreateRoom}>
          <div style={{ marginBottom: '15px' }}>
            <label>Stream Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Late Night Gaming"
              required
              style={{
                width: '100%',
                padding: '8px',
                boxSizing: 'border-box',
                borderRadius: '4px',
                border: '1px solid #333',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's your stream about?"
              style={{
                width: '100%',
                padding: '8px',
                boxSizing: 'border-box',
                borderRadius: '4px',
                border: '1px solid #333',
                minHeight: '80px',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              background: '#ff006e',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            {loading ? 'Creating...' : '🔴 Go Live'}
          </button>
        </form>
      </div>

      <h2>Your Streams</h2>
      {rooms.length === 0 ? (
        <p>No streams yet. Create one above!</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {rooms.map((room) => (
            <div
              key={room.id}
              style={{
                border: `2px solid ${room.is_live ? '#ff006e' : '#333'}`,
                borderRadius: '8px',
                padding: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3>{room.title}</h3>
                <p style={{ margin: '5px 0', color: '#aaa' }}>
                  {room.is_live ? '🔴 LIVE' : '⚫ OFFLINE'} • {room.viewer_count} viewers
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => navigate(`/room/${room.id}`)}
                  style={{
                    padding: '8px 16px',
                    background: '#333',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  View
                </button>
                <button
                  onClick={() => toggleLive(room.id, room.is_live)}
                  style={{
                    padding: '8px 16px',
                    background: room.is_live ? '#666' : '#ff006e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {room.is_live ? 'End Stream' : 'Go Live'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
