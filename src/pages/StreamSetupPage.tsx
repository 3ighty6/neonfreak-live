import { useState } from 'react'
import { Copy, Check, Video, AlertCircle } from 'lucide-react'

export default function StreamSetupPage() {
  const [copied, setCopied] = useState<string | null>(null)
  const [rtmpUrl, setRtmpUrl] = useState('')
  const [rtmpKey, setRtmpKey] = useState('')
  const [hlsUrl, setHlsUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const createStream = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/mux/create-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamerId: 'user-123', // Would get from context
          title: 'My Stream',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create stream')
      }

      const data = await response.json()
      setRtmpUrl(data.rtmpServerUrl || '')
      setRtmpKey(data.rtmpStreamKey || '')
      setHlsUrl(data.hlsUrl || '')
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
          Go Live Setup
        </h1>
        <p className="text-gray-400 mb-8">Configure OBS to stream on Neon Chat</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded text-red-300 flex gap-2">
            <AlertCircle size={20} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Create Stream Button */}
        {!rtmpUrl && (
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Step 1: Create Your Stream</h2>
            <p className="text-gray-400 mb-4">Click below to generate your RTMP credentials</p>
            <button
              onClick={createStream}
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-6 py-3 rounded font-semibold transition"
            >
              {loading ? 'Creating Stream...' : 'Generate RTMP Credentials'}
            </button>
          </div>
        )}

        {/* RTMP Details */}
        {rtmpUrl && (
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
                    value={rtmpUrl}
                    readOnly
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-300 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(rtmpUrl, 'server')}
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
                    value={rtmpKey}
                    readOnly
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-300 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(rtmpKey, 'key')}
                    className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded flex items-center gap-2 transition"
                  >
                    {copied === 'key' ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              {/* HLS URL */}
              {hlsUrl && (
                <div>
                  <label className="text-sm text-gray-400 block mb-2">HLS Playback URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={hlsUrl}
                      readOnly
                      className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-300 font-mono text-sm text-xs"
                    />
                    <button
                      onClick={() => copyToClipboard(hlsUrl, 'hls')}
                      className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded flex items-center gap-2 transition"
                    >
                      {copied === 'hls' ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-gray-950 rounded p-4 mt-6">
                <h3 className="font-semibold mb-3 text-cyan-400">Steps in OBS:</h3>
                <ol className="space-y-2 text-sm text-gray-300">
                  <li>1. Go to Settings → Stream</li>
                  <li>2. Set Service to "Custom RTMP Server"</li>
                  <li>3. Paste Server URL above</li>
                  <li>4. Paste Stream Key above</li>
                  <li>5. Click "Start Streaming"</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Settings */}
        <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Recommended Stream Settings</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-950 rounded p-4">
              <h3 className="font-semibold text-cyan-400 mb-2">Video</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>Resolution: 1920x1080</li>
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
      </div>
    </div>
  )
}
