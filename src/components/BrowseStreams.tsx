import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Users, Heart } from 'lucide-react'
import LiveRoom from './LiveRoom'

export default function BrowseStreams() {
  const [streams, setStreams] = useState<any[]>([])
  const [selectedStream, setSelectedStream] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStreams = async () => {
      const { data } = await supabase
        .from('rooms')
        .select('*, users:streamer_id(username, avatar_url)')
        .eq('is_live', true)
        .order('viewer_count', { ascending: false })

      setStreams(data || [])
      setLoading(false)
    }

    fetchStreams()

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchStreams()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (selectedStream) {
    return <LiveRoom room={selectedStream} onBack={() => setSelectedStream(null)} />
  }

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-8">Live Streams</h2>

      {loading ? (
        <div>Loading streams...</div>
      ) : streams.length === 0 ? (
        <div className="text-gray-400 text-center py-12">
          <p>No live streams right now. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <div
              key={stream.id}
              onClick={() => setSelectedStream(stream)}
              className="bg-gray-900 rounded-lg overflow-hidden hover:scale-105 transition cursor-pointer group"
            >
              <div className="bg-gradient-to-b from-purple-600 to-gray-900 h-40 relative">
                <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  LIVE
                </div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-white line-clamp-2">{stream.title}</p>
                <p className="text-sm text-gray-400 mt-2">{stream.users?.username}</p>
                <div className="flex items-center gap-2 text-gray-400 text-sm mt-3">
                  <Users size={16} />
                  {stream.viewer_count} viewers
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
