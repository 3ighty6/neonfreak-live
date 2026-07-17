import { useState, useEffect } from 'react'
import { Play, Download, Trash2, Eye } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface Recording {
  id: string
  title: string
  duration: number
  views: number
  createdAt: string
  thumbnail?: string
}

export default function VODLibrary({ userId }: { userId: string }) {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecordings = async () => {
      const { data } = await supabase
        .from('stream_recordings')
        .select('*')
        .eq('streamer_id', userId)
        .order('created_at', { ascending: false })

      if (data) {
        setRecordings(data.map(r => ({
          id: r.id,
          title: `Stream ${new Date(r.created_at).toLocaleDateString()}`,
          duration: r.duration_seconds || 0,
          views: r.view_count || 0,
          createdAt: r.created_at,
        })))
      }
      setLoading(false)
    }

    fetchRecordings()
  }, [userId])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
          Video Library
        </h1>
        <p className="text-gray-400 mb-8">Your past streams and recordings</p>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Loading videos...</div>
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">No videos yet</div>
            <p className="text-sm text-gray-500">Your recordings will appear here after streaming</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="bg-gray-900 border border-gray-800 hover:border-cyan-500/50 rounded-lg overflow-hidden group transition cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="relative bg-gray-800 aspect-video flex items-center justify-center">
                  <div className="text-4xl opacity-50">📹</div>
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition flex items-center justify-center">
                    <Play size={48} className="text-white opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-semibold">
                    {formatDuration(recording.duration)}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold mb-2 group-hover:text-cyan-400 transition">{recording.title}</h3>
                  
                  <div className="flex gap-3 text-sm text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Eye size={14} />
                      <span>{recording.views} views</span>
                    </div>
                    <div className="text-gray-600">
                      {new Date(recording.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded text-sm font-semibold flex items-center justify-center gap-1 transition">
                      <Play size={14} />
                      Watch
                    </button>
                    <button className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded transition">
                      <Download size={16} />
                    </button>
                    <button className="bg-gray-800 hover:bg-red-900 text-gray-300 hover:text-red-400 px-3 py-2 rounded transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
