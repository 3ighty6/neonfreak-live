import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import { Search, Users, TrendingUp, Radio, Heart } from 'lucide-react'
import LiveStreamCard from '../components/LiveStreamCard'

export default function HomePage({
  session,
  onSelectStream,
  onSelectCreator,
}: {
  session: Session
  onSelectStream?: (roomId: string) => void
  onSelectCreator?: (creatorId: string) => void
}) {
  const [streams, setStreams] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const [followingOnly, setFollowingOnly] = useState(false)
  const [tipsToday, setTipsToday] = useState(0)

  useEffect(() => {
    const loadFollowed = async () => {
      const { data } = await supabase
        .from('followers')
        .select('streamer_id')
        .eq('follower_id', session.user.id)
      setFollowedIds(new Set((data || []).map((f) => f.streamer_id)))
    }
    loadFollowed()
  }, [session.user.id])

  useEffect(() => {
    const fetchData = async () => {
      // Fetch categories
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      setCategories(cats || [])

      // Fetch live streams
      const { data: liveStreams } = await supabase
        .from('rooms')
        .select(`
          *,
          users:streamer_id(username, avatar_url, is_verified, is_ai_creator)
        `)
        .eq('is_live', true)
        .order('viewer_count', { ascending: false })

      // Featured/Boosted creators sort above everyone else, featured
      // above boost, viewer count as the tiebreaker within each tier.
      const { data: activeSubs } = await supabase
        .from('creator_subscriptions')
        .select('user_id, tier')
        .eq('status', 'active')
      const tierByUser = new Map((activeSubs || []).map((s) => [s.user_id, s.tier]))
      const tierRank: Record<string, number> = { elite: 3, featured: 2, boost: 1 }

      const sortedStreams = [...(liveStreams || [])]
        .map((s) => ({ ...s, promotionTier: tierByUser.get(s.streamer_id) || null }))
        .sort((a, b) => {
          const rankA = tierRank[a.promotionTier || ''] || 0
          const rankB = tierRank[b.promotionTier || ''] || 0
          if (rankA !== rankB) return rankB - rankA
          return (b.viewer_count || 0) - (a.viewer_count || 0)
        })

      setStreams(sortedStreams)

      // Real "Trending" signal -- was Math.random() before. Count of
      // tips sent platform-wide today, a genuine activity indicator.
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const { count } = await supabase
        .from('tips')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString())
      setTipsToday(count || 0)
      setLoading(false)
    }

    fetchData()

    // Subscribe to stream updates
    const subscription = supabase
      .channel('live_streams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const filteredStreams = streams.filter(stream => {
    const matchesCategory = !selectedCategory || stream.category_id === selectedCategory
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      !query ||
      stream.title.toLowerCase().includes(query) ||
      (stream.users?.username || '').toLowerCase().includes(query)
    const matchesFollowing = !followingOnly || followedIds.has(stream.streamer_id)
    return matchesCategory && matchesSearch && matchesFollowing
  })

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-cyan-400 to-yellow-300 mb-2">
          🎬 NeonLights
        </h1>
        <p className="text-cyan-300 text-lg mb-4">Discover Live Creators</p>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3 text-pink-500" size={20} />
          <input
            type="text"
            placeholder="Search creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-pink-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-400 transition focus:shadow-lg focus:shadow-pink-500/30"
          />
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 pb-2">
          <button
            onClick={() => setFollowingOnly((v) => !v)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition font-semibold flex items-center gap-1.5 ${
              followingOnly
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/50'
                : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 border border-pink-500/30'
            }`}
          >
            <Heart size={14} fill={followingOnly ? 'currentColor' : 'none'} />
            Following
          </button>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition font-semibold ${
              !selectedCategory 
                ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-lg shadow-pink-500/50' 
                : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 border border-pink-500/30'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition font-semibold ${
                selectedCategory === cat.id 
                  ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-lg shadow-pink-500/50' 
                  : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 border border-pink-500/30'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-pink-600/20 to-cyan-600/20 border border-pink-500/30 rounded-lg p-4 shadow-lg shadow-pink-500/10">
          <div className="flex items-center gap-2 text-cyan-300 text-sm mb-2">
            <Radio size={16} /> 🔴 Live Now
          </div>
          <div className="text-2xl font-bold text-pink-400">{streams.length}</div>
        </div>
        <div className="bg-gradient-to-br from-cyan-600/20 to-yellow-600/20 border border-cyan-500/30 rounded-lg p-4 shadow-lg shadow-cyan-500/10">
          <div className="flex items-center gap-2 text-cyan-300 text-sm mb-2">
            <Users size={16} /> Viewers
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {streams.reduce((sum, s) => sum + s.viewer_count, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-600/20 to-pink-600/20 border border-yellow-500/30 rounded-lg p-4 shadow-lg shadow-yellow-500/10">
          <div className="flex items-center gap-2 text-yellow-300 text-sm mb-2">
            <TrendingUp size={16} /> Tips Today
          </div>
          <div className="text-2xl font-bold text-yellow-400">{tipsToday.toLocaleString()}</div>
        </div>
      </div>

      {/* Streams Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading streams...</p>
        </div>
      ) : filteredStreams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">
            {followingOnly
              ? "Nobody you follow is live right now — check back later!"
              : 'No streams found. Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStreams.map(stream => (
            <LiveStreamCard
              key={stream.id}
              stream={stream}
              onClick={() => onSelectStream?.(stream.id)}
              onCreatorClick={onSelectCreator}
            />
          ))}
        </div>
      )}
    </div>
  )
}
