import React, { useState } from 'react'
import { Copy, Check, ArrowLeft } from 'lucide-react'
import { supabase } from '@/supabaseClient'

export default function GoLivePage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [loading, setLoading] = useState(false)
  const [rtmpKey, setRtmpKey] = useState('')
  const [rtmpUrl] = useState('rtmp://live.mux.com/app')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const handleGoLive = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Stream title is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Not authenticated')
        return
      }

      // Generate RTMP key
      const key = `${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create stream record
      const { data: stream, error: streamError } = await supabase
        .from('live_streams')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          category,
          mux_stream_id: key,
          mux_playback_id: key,
          is_active: true,
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (streamError) throw streamError

      setRtmpKey(key)
      setSuccess(true)
      
      // Update user streamer status
      await supabase.from('users').update({ is_streamer: true }).eq('id', user.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create stream')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: 'key' | 'url') => {
    navigator.clipboard.writeText(text)
    if (type === 'key') {
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    } else {
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <h1 className="text-5xl font-black mb-2" style={{ color: '#FF1493' }}>
          Go Live
        </h1>
        <p className="text-gray-400 mb-8">Set up your live stream</p>

        {error && (
          <div className="bg-red-900/50 border-2 border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">❌ {error}</p>
          </div>
        )}

        {!success ? (
          <form
            onSubmit={handleGoLive}
            className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-pink-500 rounded-xl p-8"
            style={{ boxShadow: '0 0 20px rgba(255, 20, 147, 0.2)' }}
          >
            <div className="space-y-6">
              <div>
                <label className="block text-white font-bold mb-2">Stream Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's your stream about?"
                  className="w-full bg-slate-950 text-white p-3 rounded-lg border-2 border-pink-500 focus:border-cyan-500 focus:outline-none transition-colors"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about your stream (optional)..."
                  className="w-full bg-slate-950 text-white p-3 rounded-lg border-2 border-pink-500 focus:border-cyan-500 focus:outline-none transition-colors h-24"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 text-white p-3 rounded-lg border-2 border-pink-500 focus:border-cyan-500 focus:outline-none transition-colors"
                  disabled={loading}
                >
                  <option value="general">General</option>
                  <option value="music">🎵 Music</option>
                  <option value="gaming">🎮 Gaming</option>
                  <option value="chat">💬 Just Chatting</option>
                  <option value="creative">🎨 Creative</option>
                  <option value="fitness">💪 Fitness</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="w-full py-3 px-6 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  textShadow: '0 0 10px rgba(255, 20, 147, 0.5)',
                }}
              >
                {loading ? '⏳ Creating Stream...' : '🎥 Go Live Now'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div
              className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-green-500 rounded-xl p-8"
              style={{ boxShadow: '0 0 20px rgba(0, 255, 0, 0.2)' }}
            >
              <h2 className="text-3xl font-bold text-green-400 mb-6">✅ Stream Created!</h2>

              <div className="space-y-4 mb-6">
                {/* RTMP URL */}
                <div>
                  <p className="text-gray-400 text-sm mb-2 font-bold">RTMP SERVER URL</p>
                  <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-lg border-2 border-cyan-500">
                    <code className="flex-1 text-cyan-300 font-mono text-sm break-all">{rtmpUrl}</code>
                    <button
                      onClick={() => copyToClipboard(rtmpUrl, 'url')}
                      className="text-cyan-400 hover:text-cyan-300 transition"
                    >
                      {copiedUrl ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Stream Key */}
                <div>
                  <p className="text-gray-400 text-sm mb-2 font-bold">STREAM KEY</p>
                  <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-lg border-2 border-pink-500">
                    <code className="flex-1 text-pink-300 font-mono text-sm break-all">{rtmpKey}</code>
                    <button
                      onClick={() => copyToClipboard(rtmpKey, 'key')}
                      className="text-pink-400 hover:text-pink-300 transition"
                    >
                      {copiedKey ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border-l-4 border-yellow-500">
                <p className="text-gray-300">
                  <strong>📺 Use OBS:</strong> Settings → Stream → Server (paste RTMP URL) → Stream Key (paste above)
                </p>
              </div>
            </div>

            <button
              onClick={() => (window.location.href = '/')}
              className="w-full py-3 px-6 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white font-bold rounded-lg transition-all"
              style={{
                textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
              }}
            >
              ✅ Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
