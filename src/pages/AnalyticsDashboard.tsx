import { useState, useEffect } from 'react'
import { DollarSign, Users, Radio, Heart, Clock, Video, ShoppingBag } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface StreamRow {
  id: string
  title: string
  viewer_count: number
  duration_seconds: number | null
  total_tips: number | null
  created_at: string
  is_live: boolean
}

interface TipRow {
  id: string
  amount: number
  created_at: string
  sender: { username: string } | null
}

export default function AnalyticsDashboard({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)
  const [streams, setStreams] = useState<StreamRow[]>([])
  const [recentTips, setRecentTips] = useState<TipRow[]>([])
  const [videoCount, setVideoCount] = useState(0)
  const [videoUnlocks, setVideoUnlocks] = useState(0)
  const [bundleCount, setBundleCount] = useState(0)
  const [bundleUnlocks, setBundleUnlocks] = useState(0)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)

      const [
        { data: profile },
        { data: roomRows },
        { data: tipRows },
        { count: videos },
        { count: vUnlocks },
        { count: bundles },
        { count: bUnlocks },
      ] = await Promise.all([
        supabase.from('users').select('total_earnings, followers_count').eq('id', userId).single(),
        supabase
          .from('rooms')
          .select('id, title, viewer_count, duration_seconds, total_tips, created_at, is_live')
          .eq('streamer_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('tips')
          .select('id, amount, created_at, sender:sender_id(username)')
          .eq('receiver_id', userId)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase.from('vod_library').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase
          .from('video_unlocks')
          .select('video_id, vod_library!inner(user_id)', { count: 'exact', head: true })
          .eq('vod_library.user_id', userId),
        supabase.from('photo_bundles').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase
          .from('bundle_unlocks')
          .select('bundle_id, photo_bundles!inner(user_id)', { count: 'exact', head: true })
          .eq('photo_bundles.user_id', userId),
      ])

      setTotalEarnings(Number(profile?.total_earnings || 0))
      setFollowersCount(profile?.followers_count || 0)
      setStreams(roomRows || [])
      setRecentTips((tipRows as any) || [])
      setVideoCount(videos || 0)
      setVideoUnlocks(vUnlocks || 0)
      setBundleCount(bundles || 0)
      setBundleUnlocks(bUnlocks || 0)
      setLoading(false)
    }

    fetchStats()
  }, [userId])

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const totalStreamCount = streams.length
  const peakViewers = streams.reduce((max, s) => Math.max(max, s.viewer_count || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">
        Loading analytics...
      </div>
    )
  }

  const statCards = [
    { label: 'Total Earnings', value: `$${totalEarnings.toFixed(2)}`, icon: DollarSign, color: 'green' },
    { label: 'Followers', value: followersCount.toLocaleString(), icon: Users, color: 'cyan' },
    { label: 'Peak Viewers', value: peakViewers.toLocaleString(), icon: Radio, color: 'pink' },
    { label: 'Total Streams', value: totalStreamCount.toLocaleString(), icon: Clock, color: 'purple' },
  ]

  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400 border-cyan-500/20',
    green: 'text-green-400 border-green-500/20',
    purple: 'text-purple-400 border-purple-500/20',
    pink: 'text-pink-400 border-pink-500/20',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
          Analytics
        </h1>
        <p className="text-gray-400 mb-8">Your real streaming performance & earnings</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon
            const colorClass = colorMap[stat.color]
            return (
              <div key={stat.label} className={`bg-gray-900 border ${colorClass} rounded-lg p-6`}>
                <Icon size={24} className={colorClass.split(' ')[0]} />
                <div className="text-gray-400 text-sm mt-4 mb-1">{stat.label}</div>
                <div className="text-3xl font-bold">{stat.value}</div>
              </div>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Recent streams */}
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Radio size={18} className="text-cyan-400" /> Recent Streams
            </h2>
            {streams.length === 0 ? (
              <p className="text-gray-500 text-sm">No streams yet — go live to start building history.</p>
            ) : (
              <div className="space-y-3">
                {streams.map((s) => (
                  <div key={s.id} className="flex justify-between items-center text-sm border-b border-gray-800 pb-2 last:border-0">
                    <div>
                      <div className="font-semibold truncate max-w-[180px]">{s.title}</div>
                      <div className="text-gray-500 text-xs">{new Date(s.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-cyan-400">{s.viewer_count} viewers</div>
                      <div className="text-gray-500 text-xs">{formatDuration(s.duration_seconds)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent tips */}
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Heart size={18} className="text-pink-400" /> Recent Tips
            </h2>
            {recentTips.length === 0 ? (
              <p className="text-gray-500 text-sm">No tips yet.</p>
            ) : (
              <div className="space-y-3">
                {recentTips.map((t) => (
                  <div key={t.id} className="flex justify-between items-center text-sm border-b border-gray-800 pb-2 last:border-0">
                    <div>
                      <span className="font-semibold">{t.sender?.username || 'Someone'}</span>
                      <div className="text-gray-500 text-xs">{new Date(t.created_at).toLocaleString()}</div>
                    </div>
                    <span className="text-green-400 font-semibold">{t.amount} tokens</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content performance */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Video size={18} className="text-cyan-400" /> Videos
            </h2>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Uploaded</span>
              <span className="font-semibold">{videoCount}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-400">Total unlocks</span>
              <span className="font-semibold text-cyan-400">{videoUnlocks}</span>
            </div>
          </div>

          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ShoppingBag size={18} className="text-purple-400" /> Photo Bundles
            </h2>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Created</span>
              <span className="font-semibold">{bundleCount}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-400">Total unlocks</span>
              <span className="font-semibold text-purple-400">{bundleUnlocks}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
