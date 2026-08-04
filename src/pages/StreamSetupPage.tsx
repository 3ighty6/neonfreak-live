import { useState, useEffect, useRef } from 'react'
import { Copy, Check, Video, AlertCircle, Radio, Square, Camera, Cable } from 'lucide-react'
import { supabase } from '../supabaseClient'

// WHIP relay running on Railway (MediaMTX) — forwards browser camera
// streams to Mux's RTMP ingest using the Mux stream key as the routing
// path. See 3ighty6/ralph-sons-digital-platform for the relay itself.
const WHIP_RELAY_URL = 'https://whip-relay-v2-production.up.railway.app'

export default function StreamSetupPage() {
  const [copied, setCopied] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [rtmpUrl, setRtmpUrl] = useState('')
  const [rtmpKey, setRtmpKey] = useState('')
  const [hlsUrl, setHlsUrl] = useState('')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [method, setMethod] = useState<'choose' | 'browser' | 'obs'>('choose')
  const [broadcasting, setBroadcasting] = useState(false)
  const [cameraStarting, setCameraStarting] = useState(false)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const whipSessionUrlRef = useRef<string | null>(null)

  // Resume an in-progress / already-live room on load, so refreshing this
  // page doesn't orphan your stream key.
  useEffect(() => {
    const loadExisting = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .eq('streamer_id', user.id)
        .eq('is_live', true)
        .maybeSingle()

      if (data) {
        setRoomId(data.id)
        setTitle(data.title || '')
        setRtmpKey(data.rtmp_key || '')
        setHlsUrl(data.hls_url || '')
        setIsLive(true)
        // A lost browser connection can't be silently resumed -- fall
        // back to showing RTMP credentials so they can restart via OBS
        // (or hit Start Broadcasting again from the chooser).
        setMethod('obs')
      }
    }
    loadExisting()
  }, [])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const createStream = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be signed in to go live')
      if (!title.trim()) throw new Error('Give your stream a title first')

      const response = await fetch('/api/mux-create-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamerId: user.id,
          title: title.trim(),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to create stream')
      }

      setRtmpUrl(data.rtmpServerUrl || '')
      setRtmpKey(data.rtmpStreamKey || '')
      setHlsUrl(data.hlsUrl || '')

      // Persist it so it actually shows up on the homepage / discovery feed.
      const { data: room, error: insertError } = await supabase
        .from('rooms')
        .insert({
          streamer_id: user.id,
          title: title.trim(),
          rtmp_key: data.rtmpStreamKey,
          hls_url: data.hlsUrl,
          is_live: true,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setRoomId(room.id)
      setIsLive(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const startBrowserBroadcast = async () => {
    setError('')
    setCameraStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      })

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
      }

      const pc = new RTCPeerConnection()
      peerConnectionRef.current = pc
      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      // Prefer H.264 so the relay can remux to RTMP with -c copy (no
      // server-side transcoding needed). Falls back silently if a
      // browser doesn't support codec preference selection.
      const videoTransceiver = pc.getTransceivers().find((t) => t.sender.track?.kind === 'video')
      if (videoTransceiver && 'setCodecPreferences' in videoTransceiver) {
        const codecs = RTCRtpSender.getCapabilities('video')?.codecs || []
        const h264Codecs = codecs.filter((c) => c.mimeType.toLowerCase() === 'video/h264')
        if (h264Codecs.length > 0) {
          videoTransceiver.setCodecPreferences(h264Codecs)
        }
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Wait for ICE gathering so the offer includes candidates (WHIP is
      // a single-shot POST, no trickle ICE negotiation afterward)
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') return resolve()
        const check = () => {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', check)
            resolve()
          }
        }
        pc.addEventListener('icegatheringstatechange', check)
      })

      const whipUrl = `${WHIP_RELAY_URL}/${rtmpKey}/whip`
      const response = await fetch(whipUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: pc.localDescription?.sdp,
      })

      if (!response.ok) {
        throw new Error(`Relay rejected connection (${response.status}). It may still be warming up — try again in a moment.`)
      }

      whipSessionUrlRef.current = response.headers.get('Location')
      const answerSdp = await response.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })

      setBroadcasting(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      peerConnectionRef.current?.close()
      peerConnectionRef.current = null
    } finally {
      setCameraStarting(false)
    }
  }

  const stopBrowserBroadcast = () => {
    const videoEl = videoPreviewRef.current
    const stream = videoEl?.srcObject as MediaStream | null
    stream?.getTracks().forEach((t) => t.stop())
    if (videoEl) videoEl.srcObject = null

    peerConnectionRef.current?.close()
    peerConnectionRef.current = null
    setBroadcasting(false)
  }


  const endStream = async () => {
    if (!roomId) return
    setLoading(true)
    setError('')
    try {
      if (broadcasting) stopBrowserBroadcast()

      const { error: updateError } = await supabase
        .from('rooms')
        .update({ is_live: false, ended_at: new Date().toISOString() })
        .eq('id', roomId)

      if (updateError) throw updateError

      setIsLive(false)
      setRoomId(null)
      setRtmpUrl('')
      setRtmpKey('')
      setHlsUrl('')
      setMethod('choose')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
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
        <p className="text-gray-400 mb-8">Configure OBS to stream on NeonLights</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded text-red-300 flex gap-2">
            <AlertCircle size={20} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Choose streaming method */}
        {method === 'choose' && !rtmpKey && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setMethod('browser')}
              className="bg-gray-900 border border-cyan-500/20 hover:border-cyan-500/50 rounded-lg p-6 text-left transition"
            >
              <Camera className="text-cyan-400 mb-3" size={32} />
              <h3 className="text-lg font-bold mb-1">Stream from Camera</h3>
              <p className="text-sm text-gray-400">
                Go live right from your browser — no extra software needed.
              </p>
            </button>
            <button
              onClick={() => setMethod('obs')}
              className="bg-gray-900 border border-cyan-500/20 hover:border-cyan-500/50 rounded-lg p-6 text-left transition"
            >
              <Cable className="text-cyan-400 mb-3" size={32} />
              <h3 className="text-lg font-bold mb-1">Stream with OBS</h3>
              <p className="text-sm text-gray-400">
                For more control — overlays, scenes, multiple sources.
              </p>
            </button>
          </div>
        )}

        {/* Create Stream */}
        {method !== 'choose' && !rtmpKey && (
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-6">
            <button onClick={() => setMethod('choose')} className="text-sm text-gray-400 hover:text-white mb-4 transition">
              ← Back
            </button>
            <h2 className="text-xl font-bold mb-4">Give your stream a title</h2>
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">Stream Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you streaming today?"
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
              />
            </div>
            <button
              onClick={createStream}
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-6 py-3 rounded font-semibold transition"
            >
              {loading ? 'Creating Stream...' : 'Continue'}
            </button>
          </div>
        )}

        {/* Browser Camera Broadcasting */}
        {method === 'browser' && rtmpKey && (
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Camera className="text-cyan-400" size={24} />
                <h2 className="text-2xl font-bold">Camera Broadcast</h2>
              </div>
              {broadcasting && (
                <span className="flex items-center gap-2 text-red-400 text-sm font-bold">
                  <Radio size={16} className="animate-pulse" /> LIVE — visible on homepage
                </span>
              )}
            </div>

            <video
              ref={videoPreviewRef}
              autoPlay
              muted
              playsInline
              className="w-full aspect-video bg-black rounded-lg mb-4"
            />

            {!broadcasting ? (
              <button
                onClick={startBrowserBroadcast}
                disabled={cameraStarting}
                className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white py-3 rounded font-bold transition flex items-center justify-center gap-2"
              >
                <Camera size={18} />
                {cameraStarting ? 'Connecting...' : 'Start Broadcasting'}
              </button>
            ) : (
              <button
                onClick={endStream}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded font-bold transition flex items-center justify-center gap-2"
              >
                <Square size={18} />
                {loading ? 'Ending...' : 'End Stream'}
              </button>
            )}

            <p className="text-xs text-gray-500 mt-3">
              Your browser connects directly — closing this tab will end your stream.
            </p>
          </div>
        )}

        {/* RTMP Details (OBS) */}
        {method === 'obs' && rtmpKey && (
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Video className="text-cyan-400" size={24} />
                <h2 className="text-2xl font-bold">OBS Studio Setup</h2>
              </div>
              {isLive && (
                <span className="flex items-center gap-2 text-red-400 text-sm font-bold">
                  <Radio size={16} className="animate-pulse" /> LIVE — visible on homepage
                </span>
              )}
            </div>

            <div className="space-y-4">
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

              {hlsUrl && (
                <div>
                  <label className="text-sm text-gray-400 block mb-2">HLS Playback URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={hlsUrl}
                      readOnly
                      className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-300 font-mono text-xs"
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

              <button
                onClick={endStream}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded font-bold transition flex items-center justify-center gap-2"
              >
                <Square size={18} />
                {loading ? 'Ending...' : 'End Stream'}
              </button>
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
