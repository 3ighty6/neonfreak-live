import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Radio } from 'lucide-react'

export default function GoLive({ userId }: { userId: string }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState('')

  const handleGoLive = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: err } = await supabase
        .from('rooms')
        .insert({
          streamer_id: userId,
          title,
          description,
          is_live: true,
          viewer_count: 0,
        })
        .select()
        .single()

      if (err) throw err

      setIsLive(true)
      setRoomId(data.id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEndStream = async () => {
    try {
      await supabase.from('rooms').update({ is_live: false }).eq('id', roomId)
      setIsLive(false)
      setRoomId('')
      setTitle('')
      setDescription('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-3xl font-bold mb-8">Go Live</h2>

      {isLive ? (
        <div className="bg-green-900/30 border border-green-600 rounded-lg p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <h3 className="text-xl font-semibold text-green-400">Now Streaming</h3>
          </div>
          <p className="text-gray-300 mb-6">{title}</p>
          <p className="text-sm text-gray-400 mb-6">Room ID: {roomId}</p>
          <p className="text-sm text-gray-400 mb-6">
            Share your room ID with viewers so they can join your stream!
          </p>
          <button
            onClick={handleEndStream}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
          >
            End Stream
          </button>
        </div>
      ) : (
        <form onSubmit={handleGoLive} className="bg-gray-900 rounded-lg p-8 border border-gray-800">
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Stream Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you streaming?"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers what to expect..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 h-32"
            />
          </div>

          {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Radio size={20} />
            {loading ? 'Starting Stream...' : 'Go Live Now'}
          </button>
        </form>
      )}
    </div>
  )
}
