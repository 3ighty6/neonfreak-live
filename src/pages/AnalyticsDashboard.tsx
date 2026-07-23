import { useState, useEffect } from 'react'
import { TrendingUp, Eye, DollarSign, Users, Clock } from 'lucide-react'
import { supabase } from '@/supabaseClient'

interface StreamStat {
  date: string
  viewers: number
  tips: number
  duration: number
}

export default function AnalyticsDashboard({ userId }: { userId: string }) {
  const [_stats, _setStats] = useState<StreamStat[]>([])
  const [totalViewers, setTotalViewers] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [avgViewers, setAvgViewers] = useState(0)

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch room stats
      const { data: rooms } = await supabase
        .from('rooms')
        .select('viewer_count, total_tips, duration_seconds')
        .eq('streamer_id', userId)

      if (rooms) {
        const total = rooms.reduce((sum, room) => sum + (room.viewer_count || 0), 0)
        const earnings = rooms.reduce((sum, room) => sum + (room.total_tips || 0), 0)
        const avg = Math.round(total / rooms.length)

        setTotalViewers(total)
        setTotalEarnings(earnings)
        setAvgViewers(avg)
      }
    }

    fetchStats()
  }, [userId])

  const statCards = [
    {
      label: 'Total Views',
      value: totalViewers.toLocaleString(),
      icon: Eye,
      color: 'cyan',
      trend: '+12%',
    },
    {
      label: 'Total Earnings',
      value: `$${totalEarnings.toLocaleString()}`,
      icon: DollarSign,
      color: 'green',
      trend: '+8%',
    },
    {
      label: 'Avg Viewers',
      value: avgViewers.toLocaleString(),
      icon: Users,
      color: 'purple',
      trend: '+5%',
    },
    {
      label: 'Streams',
      value: 1,
      icon: Clock,
      color: 'pink',
      trend: '+2',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
          Analytics
        </h1>
        <p className="text-gray-400 mb-8">Your streaming performance & earnings</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon
            const colorMap: Record<string, string> = {
              cyan: 'text-cyan-400 border-cyan-500/20',
              green: 'text-green-400 border-green-500/20',
              purple: 'text-purple-400 border-purple-500/20',
              pink: 'text-pink-400 border-pink-500/20',
            }
            const colorClass = colorMap[stat.color] || colorMap.cyan

            return (
              <div key={stat.label} className={`bg-gray-900 border ${colorClass} rounded-lg p-6`}>
                <div className="flex justify-between items-start mb-4">
                  <Icon size={24} className={colorClass.split(' ')[0]} />
                  <span className="text-green-400 text-sm font-semibold">{stat.trend}</span>
                </div>
                <div className="text-gray-400 text-sm mb-1">{stat.label}</div>
                <div className="text-3xl font-bold">{stat.value}</div>
              </div>
            )
          })}
        </div>

        {/* Performance Chart */}
        <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-cyan-400" />
            Performance This Week
          </h2>
          
          <div className="h-80 bg-gray-950 rounded p-4 flex items-end justify-around gap-2">
            {[65, 78, 82, 70, 88, 95, 92].map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-cyan-500 to-purple-600 rounded-t transition hover:opacity-80"
                  style={{ height: `${(value / 100) * 300}px` }}
                />
                <div className="text-xs text-gray-400 mt-2">Day {i + 1}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">Top Hours</h2>
            <div className="space-y-3">
              {[
                { time: '8 PM - 9 PM', viewers: 342 },
                { time: '9 PM - 10 PM', viewers: 289 },
                { time: '10 PM - 11 PM', viewers: 256 },
              ].map((slot) => (
                <div key={slot.time} className="flex justify-between items-center">
                  <span className="text-gray-300">{slot.time}</span>
                  <span className="text-cyan-400 font-semibold">{slot.viewers}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">Earnings Breakdown</h2>
            <div className="space-y-3">
              {[
                { source: 'Tips', amount: 245.50 },
                { source: 'Private Shows', amount: 180.00 },
                { source: 'Subscriptions', amount: 120.00 },
              ].map((item) => (
                <div key={item.source} className="flex justify-between items-center">
                  <span className="text-gray-300">{item.source}</span>
                  <span className="text-green-400 font-semibold">${item.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
