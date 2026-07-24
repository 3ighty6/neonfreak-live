/**
 * Vercel API Route: /api/mux/create-stream
 * Creates a real Mux live stream with proper RTMP details
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const MUX_API_KEY = process.env.MUX_TOKEN_ID || ''
const MUX_API_SECRET = process.env.MUX_TOKEN_SECRET || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!MUX_API_KEY || !MUX_API_SECRET) {
    return res.status(400).json({ error: 'Mux credentials not configured' })
  }

  const { streamerId: _streamerId, title: _title } = req.body

  try {
    // Validate credentials
    if (!MUX_API_KEY || !MUX_API_SECRET) {
      console.error('Missing Mux credentials:', {
        hasApiKey: !!MUX_API_KEY,
        hasSecret: !!MUX_API_SECRET,
      })
      return res.status(500).json({
        error: 'Mux credentials not configured',
        debug: { hasApiKey: !!MUX_API_KEY, hasSecret: !!MUX_API_SECRET },
      })
    }

    const auth = Buffer.from(`${MUX_API_KEY}:${MUX_API_SECRET}`).toString('base64')
    const requestBody = {
      playback_policy: ['public'],
      new_asset_settings: {
        playback_policy: ['public'],
      },
    }

    console.log('Creating Mux stream with:', {
      apiKeyPrefix: MUX_API_KEY.substring(0, 10),
      requestBody,
    })

    // Create live stream in Mux
    const response = await fetch('https://api.mux.com/video/v1/live-streams', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log('Mux API response:', {
      status: response.status,
      statusText: response.statusText,
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Mux error response:', error)
      return res.status(response.status).json({
        error: 'Failed to create Mux stream',
        details: error,
      })
    }

    const data = await response.json()
    const stream = data.data
    console.log('Stream created:', { id: stream.id })

    // Return RTMP credentials
    res.json({
      id: stream.id,
      rtmpServerUrl: stream.rtmp_server_url,
      rtmpStreamKey: stream.rtmp_stream_key,
      playbackId: stream.playback_ids?.[0]?.id,
      hlsUrl: stream.playback_ids?.[0]?.id ? `https://stream.mux.com/${stream.playback_ids[0].id}.m3u8` : null,
      status: 'active',
    })
  } catch (error) {
    console.error('Error creating stream:', error)
    res.status(500).json({ error: 'Failed to create stream' })
  }
}
