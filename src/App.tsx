import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthPage } from './pages/Auth'
import { HomePage } from './pages/Home'
import { StreamerDashboard } from './pages/StreamerDashboard'
import { LiveRoom } from './pages/LiveRoom'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={user ? <HomePage /> : <Navigate to="/auth" />} />
      <Route path="/streamer" element={user?.is_streamer ? <StreamerDashboard /> : <Navigate to="/" />} />
      <Route path="/room/:roomId" element={user ? <LiveRoom /> : <Navigate to="/auth" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
