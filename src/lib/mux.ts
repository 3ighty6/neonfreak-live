/**
 * Mux Video Streaming Integration for Neon Chat
 * Handles RTMP input, HLS output, and VOD
 */

export const MUX_API_KEY = import.meta.env.VITE_MUX_API_KEY || ''

export interface MuxLiveStream {
  id: string
  rtmpIngestionUrl?: string
  rtmpStreamKey?: string
  playbackId?: string
  status: 'idle' | 'active' | 'error'
  createdAt: string
}

export interface MuxRecording {
  id: string
  duration: number
  status: 'ready' | 'processing' | 'failed'
  playbackId?: string
  createdAt: string
}

/**
 * Create a new live stream in Mux
 */
export async function createLiveStream(
  streamerId: string,
  streamTitle: string
): Promise<MuxLiveStream> {
  const response = await fetch('/api/mux/live-streams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ streamerId, streamTitle }),
  })

  if (!response.ok) throw new Error('Failed to create live stream')
  return response.json()
}

/**
 * End a live stream
 */
export async function endLiveStream(liveStreamId: string): Promise<void> {
  const response = await fetch(`/api/mux/live-streams/${liveStreamId}/end`, {
    method: 'POST',
  })

  if (!response.ok) throw new Error('Failed to end live stream')
}

/**
 * Get live stream details
 */
export async function getLiveStream(liveStreamId: string): Promise<MuxLiveStream> {
  const response = await fetch(`/api/mux/live-streams/${liveStreamId}`)

  if (!response.ok) throw new Error('Failed to fetch live stream')
  return response.json()
}

/**
 * List all recordings for a streamer
 */
export async function listRecordings(streamerId: string): Promise<MuxRecording[]> {
  const response = await fetch(`/api/mux/recordings?streamer=${streamerId}`)

  if (!response.ok) throw new Error('Failed to fetch recordings')
  return response.json()
}

/**
 * Get HLS stream URL (for video player)
 */
export function getHlsUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`
}
