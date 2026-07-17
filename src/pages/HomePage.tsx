import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Search, Users, TrendingUp, Radio } from 'lucide-react'
import LiveStreamCard from '../components/LiveStreamCard'

export default function HomePage() {
  const [streams, setStreams] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

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
          users:streamer_id(username, avatar_url, is_verified)
        `)
        .eq('is_live', true)
        .order('viewer_count', { ascending: false })

      setStreams(liveStreams || [])
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
    const matchesSearch = !searchQuery || stream.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-4">Live Streams</h1>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search streams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              !selectedCategory ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                selectedCategory === cat.id ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-cyan-600/20 to-purple-600/20 border border-cyan-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <Radio size={16} /> Live Now
          </div>
          <div className="text-2xl font-bold text-cyan-400">{streams.length}</div>
        </div>
        <div className="bg-gradient-to-br from-cyan-600/20 to-purple-600/20 border border-cyan-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <Users size={16} /> Viewers
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {streams.reduce((sum, s) => sum + s.viewer_count, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-gradient-to-br from-cyan-600/20 to-purple-600/20 border border-cyan-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <TrendingUp size={16} /> Trending
          </div>
          <div className="text-2xl font-bold text-cyan-400">{Math.floor(Math.random() * 100) + 20}</div>
        </div>
      </div>

      {/* Streams Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading streams...</p>
        </div>
      ) : filteredStreams.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No streams found. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStreams.map(stream => (
            <LiveStreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      )}
    </div>
  )
}
