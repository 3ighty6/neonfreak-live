import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, Users, Clock } from 'lucide-react'

interface CreatorStats {
  totalEarnings: number
  pendingPayout: number
  totalStreams: number
  totalViewers: number
  avgViewersPerStream: number
  thisMonthEarnings: number
  lastPayoutDate: string
}

export default function CreatorAnalytics() {
  const [stats, setStats] = useState<CreatorStats>({
    totalEarnings: 0,
    pendingPayout: 0,
    totalStreams: 0,
    totalViewers: 0,
    avgViewersPerStream: 0,
    thisMonthEarnings: 0,
    lastPayoutDate: 'Never',
  })
  const [loading, setLoading] = useState(true)
  const [earningsChart, setEarningsChart] = useState<Array<{ date: string; amount: number }>>([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/creator/analytics')
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
          setEarningsChart(data.chart || [])
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div className="text-center text-gray-400">Loading analytics...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
          Creator Analytics
        </h1>
        <p className="text-gray-400 mb-8">Track your earnings and performance</p>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-semibold">Total Earnings</h3>
              <DollarSign className="text-green-400" size={24} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">${stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-gray-500">All time</p>
          </div>

          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-semibold">Pending Payout</h3>
              <Clock className="text-yellow-400" size={24} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">${stats.pendingPayout.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Next payment: {stats.lastPayoutDate}</p>
          </div>

          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-semibold">Total Streams</h3>
              <TrendingUp className="text-blue-400" size={24} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalStreams}</div>
            <p className="text-xs text-gray-500">Lifetime</p>
          </div>

          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-semibold">Total Viewers</h3>
              <Users className="text-purple-400" size={24} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalViewers.toLocaleString()}</div>
            <p className="text-xs text-gray-500">Avg: {stats.avgViewersPerStream} per stream</p>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">This Month</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-cyan-400">${stats.thisMonthEarnings.toFixed(2)}</span>
            <span className="text-gray-400">in earnings</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Calculated from tips, token sales, and photo bundles</p>
        </div>

        {/* Chart */}
        {earningsChart.length > 0 && (
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Earnings History</h2>
            <div className="space-y-4">
              {earningsChart.slice(-7).map((entry) => (
                <div key={entry.date} className="flex items-center justify-between">
                  <span className="text-gray-400">{entry.date}</span>
                  <div className="flex items-center gap-4 flex-1 ml-4">
                    <div className="flex-1 max-w-xs bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-600 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((entry.amount / stats.totalEarnings) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-green-400 font-semibold min-w-fit">${entry.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payout Info */}
        <div className="mt-8 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6">
          <h3 className="font-semibold text-cyan-400 mb-2">💰 How Payouts Work</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>✓ Earnings are calculated daily</li>
            <li>✓ Payouts processed every 7 days</li>
            <li>✓ Minimum payout threshold: $20</li>
            <li>✓ Received via Paddle to your linked bank account</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
