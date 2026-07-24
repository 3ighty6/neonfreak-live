import { useState, useEffect } from 'react'
import { Users, TrendingUp, Shield, AlertCircle } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeStreams: 0,
    totalRevenue: 0,
    pendingReports: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
          Admin Dashboard
        </h1>
        <p className="text-gray-400 mb-8">Platform overview and management</p>

        {loading ? (
          <div className="text-center text-gray-400">Loading statistics...</div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-400 text-sm font-semibold">Total Users</h3>
                  <Users className="text-cyan-400" size={24} />
                </div>
                <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
              </div>

              <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-400 text-sm font-semibold">Active Streams</h3>
                  <TrendingUp className="text-green-400" size={24} />
                </div>
                <div className="text-3xl font-bold text-white">{stats.activeStreams}</div>
              </div>

              <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-400 text-sm font-semibold">Total Revenue</h3>
                  <TrendingUp className="text-yellow-400" size={24} />
                </div>
                <div className="text-3xl font-bold text-white">${stats.totalRevenue}</div>
              </div>

              <div className="bg-gray-900 border border-red-500/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-400 text-sm font-semibold">Reports</h3>
                  <AlertCircle className="text-red-400" size={24} />
                </div>
                <div className="text-3xl font-bold text-white">{stats.pendingReports}</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Shield className="text-cyan-400" />
                Quick Actions
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded font-semibold transition">
                  Manage Users
                </button>
                <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded font-semibold transition">
                  View Reports
                </button>
                <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded font-semibold transition">
                  Verify Creators
                </button>
                <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded font-semibold transition">
                  Platform Settings
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
