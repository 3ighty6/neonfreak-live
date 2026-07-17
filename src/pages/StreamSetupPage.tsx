import { useState } from 'react'
import { Copy, Check, Video } from 'lucide-react'

export default function StreamSetupPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const RTMP_SERVER = 'rtmp://stream.neon-chat.com:1935/live'
  const RTMP_KEY = 'stream_key_' + Math.random().toString(36).substring(7)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
          Go Live Setup
        </h1>
        <p className="text-gray-400 mb-8">Configure your streaming software to broadcast on Neon Chat</p>

        {/* OBS Setup */}
        <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Video className="text-cyan-400" size={24} />
            <h2 className="text-2xl font-bold">OBS Studio Setup</h2>
          </div>

          <div className="space-y-4">
            {/* RTMP Server */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">RTMP Server URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={RTMP_SERVER}
                  readOnly
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-300 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(RTMP_SERVER, 'server')}
                  className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded flex items-center gap-2 transition"
                >
                  {copied === 'server' ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {/* Stream Key */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Stream Key</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={RTMP_KEY}
                  readOnly
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-300 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(RTMP_KEY, 'key')}
                  className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded flex items-center gap-2 transition"
                >
                  {copied === 'key' ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-950 rounded p-4 mt-4">
              <h3 className="font-semibold mb-3 text-cyan-400">Steps in OBS:</h3>
              <ol className="space-y-2 text-sm text-gray-300">
                <li>1. Go to Settings → Stream</li>
                <li>2. Select "Custom..." as Service</li>
                <li>3. Paste Server URL above</li>
                <li>4. Paste Stream Key above</li>
                <li>5. Click "Start Streaming"</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Recommended Settings */}
        <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Recommended Stream Settings</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-950 rounded p-4">
              <h3 className="font-semibold text-cyan-400 mb-2">Video</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>Resolution: 1920x1080 (1080p)</li>
                <li>FPS: 60</li>
                <li>Bitrate: 6000 kbps</li>
                <li>Encoder: H.264</li>
              </ul>
            </div>
            <div className="bg-gray-950 rounded p-4">
              <h3 className="font-semibold text-cyan-400 mb-2">Audio</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>Bitrate: 192 kbps</li>
                <li>Sample Rate: 44100 Hz</li>
                <li>Channels: Stereo</li>
                <li>Encoder: AAC</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quality Tiers */}
        <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Auto Quality Adaptation</h2>
          <p className="text-gray-400 mb-4">Stream adapts based on viewer bandwidth:</p>
          
          <div className="grid md:grid-cols-3 gap-3">
            <div className="bg-gray-950 rounded p-3 border border-gray-800">
              <div className="text-cyan-400 font-semibold mb-2">1080p</div>
              <div className="text-sm text-gray-400">6000 kbps • 60fps</div>
            </div>
            <div className="bg-gray-950 rounded p-3 border border-gray-800">
              <div className="text-cyan-400 font-semibold mb-2">720p</div>
              <div className="text-sm text-gray-400">4000 kbps • 60fps</div>
            </div>
            <div className="bg-gray-950 rounded p-3 border border-gray-800">
              <div className="text-cyan-400 font-semibold mb-2">480p</div>
              <div className="text-sm text-gray-400">2000 kbps • 30fps</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
