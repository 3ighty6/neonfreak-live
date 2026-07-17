import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Radio, Copy, Check } from 'lucide-react'

export default function GoLivePage({ userId }: { userId: string }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [isLive, setIsLive] = useState(false)
  const [rtmpKey, setRtmpKey] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGoLive = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const key = Math.random().toString(36).substring(2, 15)
    
    const { error } = await supabase
      .from('rooms')
      .insert({ streamer_id: userId, title, category_id: category, is_live: true, rtmp_key: key })
      .select()
      .single()

    if (!error) {
      setIsLive(true)
      setRtmpKey(key)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <h1 className="text-3xl font-black mb-8">Go Live</h1>

      {isLive ? (
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <h2 className="text-2xl font-bold text-green-400">Now Broadcasting</h2>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm text-gray-400 mb-2">RTMP URL</p>
              <div className="flex gap-2">
                <input type="text" value="rtmp://neon-chat.live/live" readOnly className="flex-1 px-3 py-2 bg-black border border-gray-700 rounded text-gray-300 text-sm" />
                <button onClick={() => copyToClipboard('rtmp://neon-chat.live/live')} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition flex items-center gap-2">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-2">Stream Key</p>
              <div className="flex gap-2">
                <input type="text" value={rtmpKey} readOnly className="flex-1 px-3 py-2 bg-black border border-gray-700 rounded text-gray-300 text-sm font-mono" />
                <button onClick={() => copyToClipboard(rtmpKey)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition flex items-center gap-2">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-6">Use OBS or any streaming software. Paste the RTMP URL and Stream Key in your settings.</p>
          
          <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition w-full">
            End Stream
          </button>
        </div>
      ) : (
        <form onSubmit={handleGoLive} className="bg-black/50 border border-cyan-500/30 rounded-lg p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Stream Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What are you streaming?" className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition" required />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition" required>
              <option value="">Select a category</option>
              <option value="music">🎵 Music</option>
              <option value="gaming">🎮 Gaming</option>
              <option value="chat">💬 Just Chatting</option>
              <option value="creative">🎨 Creative</option>
              <option value="sports">⚽ Sports</option>
              <option value="education">📚 Educational</option>
            </select>
          </div>

          <button type="submit" className="w-full py-3 px-6 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-2">
            <Radio size={20} /> Go Live Now
          </button>
        </form>
      )}
    </div>
  )
}
