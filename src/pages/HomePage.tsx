import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import { Search, Users, TrendingUp, Radio, Heart } from 'lucide-react'
import LiveStreamCard from '../components/LiveStreamCard'
import DiscoverCreators from '../components/DiscoverCreators'
import Leaderboard from '../components/Leaderboard'
import ParticleField from '../components/ParticleField'

export default function HomePage({
  session,
  onSelectStream,
  onSelectCreator,
  onSelectAIProfile,
  searchQuery: externalSearchQuery,
  onSearchQueryChange,
  hideOwnSearchBar,
}: {
  session: Session
  onSelectStream?: (roomId: string) => void
  onSelectCreator?: (creatorId: string) => void
  onSelectAIProfile?: (profileId: string) => void
  /** Controlled search value -- pass this + onSearchQueryChange when a global top bar owns the search input. */
  searchQuery?: string
  onSearchQueryChange?: (q: string) => void
  /** Hide the inline search bar (e.g. when a global TopBar already renders one). */
  hideOwnSearchBar?: boolean
}) {
  const [streams, setStreams] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery
  const setSearchQuery = onSearchQueryChange || setInternalSearchQuery
  const [loading, setLoading] = useState(true)
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const [followingOnly, setFollowingOnly] = useState(false)
  const [tipsToday, setTipsToday] = useState(0)
  const [allCreators, setAllCreators] = useState<any[]>([])
  const [viewerIsVip, setViewerIsVip] = useState(false)

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

      const { data: vip } = await supabase
        .from('viewer_vip_subscriptions')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle()
      setViewerIsVip(!!vip)

      // Everyone with a discoverable footprint (streamed, or has
      // videos/bundles/perks listed) -- not just who's live right now.
      const { data: creators } = await supabase
        .from('discoverable_creators')
        .select('*')
      const { data: aiProfiles } = await supabase
        .from('discoverable_ai_profiles')
        .select('*')

      setAllCreators([
        ...(creators || [])
          .filter((c) => c.id !== session.user.id)
          .map((c) => ({ ...c, promotionTier: tierByUser.get(c.id) || null, isAiProfile: false })),
        ...(aiProfiles || []).map((p) => ({
          id: p.id,
          username: p.username,
          avatar_url: p.avatar_url,
          bio: p.bio,
          is_verified: false,
          is_ai_creator: true,
          followers_count: 0,
          created_at: p.created_at,
          has_streamed: false,
          video_count: p.video_count,
          bundle_count: p.bundle_count,
          perk_count: 0,
          promotionTier: null,
          isAiProfile: true,
        })),
      ])

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
      (stream.users?.username || '').toLowerCase().includes(query) ||
      (stream.tags || []).some((t: string) => t.toLowerCase().includes(query))
    const matchesFollowing = !followingOnly || followedIds.has(stream.streamer_id)
    return matchesCategory && matchesSearch && matchesFollowing
  })

  return (
    <div className="p-4 md:p-6 relative">
      <ParticleField count={25} />
      <div className="relative z-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
          Discover <span className="neon-text">Live Creators</span>
        </h1>
        <p className="text-gray-400 text-sm mb-4">Everything happening on NeonLights right now</p>
        
        {/* Search Bar (hidden when a global TopBar already owns search) */}
        {!hideOwnSearchBar && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-3 text-pink-500" size={20} />
            <input
              type="text"
              placeholder="Search creators, titles, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-pink-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-pink-400 transition focus:shadow-lg focus:shadow-pink-500/30"
            />
          </div>
        )}

        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 pb-2">
          <button
            onClick={() => setFollowingOnly((v) => !v)}
            className={`neon-pill flex items-center gap-1.5 ${followingOnly ? 'neon-pill-active' : 'neon-pill-inactive'}`}
          >
            <Heart size={14} fill={followingOnly ? 'currentColor' : 'none'} />
            Following
          </button>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`neon-pill ${!selectedCategory ? 'neon-pill-active' : 'neon-pill-inactive'}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`neon-pill ${selectedCategory === cat.id ? 'neon-pill-active' : 'neon-pill-inactive'}`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <Leaderboard />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="neon-liquid p-4">
          <div className="light-streak" />
          <div className="relative z-10 flex items-center gap-2 text-cyan-300 text-sm mb-2">
            <Radio size={16} /> <span className="live-badge-pulse w-2 h-2 rounded-full bg-pink-500 inline-block" /> Live Now
          </div>
          <div className="relative z-10 text-2xl font-bold text-pink-400">{streams.length}</div>
        </div>
        <div className="neon-liquid p-4">
          <div className="light-streak" />
          <div className="relative z-10 flex items-center gap-2 text-cyan-300 text-sm mb-2">
            <Users size={16} /> Viewers
          </div>
          <div className="relative z-10 text-2xl font-bold text-cyan-400">
            {streams.reduce((sum, s) => sum + s.viewer_count, 0).toLocaleString()}
          </div>
        </div>
        <div className="neon-liquid p-4">
          <div className="light-streak" />
          <div className="relative z-10 flex items-center gap-2 text-yellow-300 text-sm mb-2">
            <TrendingUp size={16} /> Tips Today
          </div>
          <div className="relative z-10 text-2xl font-bold text-yellow-400">{tipsToday.toLocaleString()}</div>
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
              viewerIsVip={viewerIsVip}
            />
          ))}
        </div>
      )}

      {!loading && !followingOnly && (
        <DiscoverCreators creators={allCreators} onSelectCreator={onSelectCreator} onSelectAIProfile={onSelectAIProfile} />
      )}
      </div>
    </div>
  )
}
