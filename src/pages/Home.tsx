import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import type { Room } from '../types'

export function HomePage() {
  const { user, signOut } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }

    fetchRooms()
  }, [user, navigate])

  const fetchRooms = async () => {
    try {
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_live', true)
        .order('viewer_count', { ascending: false })

      setRooms(data || [])
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>🔥 NeonFreak Live</h1>
        <div>
          <span style={{ marginRight: '15px' }}>👤 {user?.username}</span>
          {user?.is_streamer && (
            <button
              onClick={() => navigate('/streamer')}
              style={{
                padding: '8px 16px',
                background: '#ff006e',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                marginRight: '10px',
                cursor: 'pointer',
              }}
            >
              My Stream
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <h2>🔴 Live Streams</h2>
      {loading ? (
        <p>Loading streams...</p>
      ) : rooms.length === 0 ? (
        <p>No live streams right now. Check back later!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => navigate(`/room/${room.id}`)}
              style={{
                border: '1px solid #ff006e',
                borderRadius: '8px',
                padding: '15px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <h3>{room.title}</h3>
              <p>{room.description}</p>
              <p style={{ color: '#ff006e', fontWeight: 'bold' }}>👥 {room.viewer_count} viewers</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
