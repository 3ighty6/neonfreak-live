/**
 * Vercel API Route: /api/mux/live-streams
 * Creates and manages Mux live streams
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../src/supabaseClient'

const MUX_API_BASE = 'https://api.mux.com'
const MUX_API_KEY = process.env.MUX_API_KEY || ''
const MUX_API_SECRET = process.env.MUX_API_SECRET || ''

function getAuthHeader() {
  const credentials = Buffer.from(`${MUX_API_KEY}:${MUX_API_SECRET}`).toString('base64')
  return `Basic ${credentials}`
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    return await createLiveStream(req, res)
  } else if (req.method === 'GET') {
    return await getLiveStream(req, res)
  }

  res.status(405).json({ error: 'Method not allowed' })
}

async function createLiveStream(req: VercelRequest, res: VercelResponse) {
  const { streamerId, streamTitle } = req.body

  if (!streamerId || !streamTitle) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // Create live stream in Mux
    const muxResponse = await fetch(`${MUX_API_BASE}/video/v1/live-streams`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playback_policy: ['public'],
        new_asset_settings: {
          playback_policy: ['public'],
        },
      }),
    })

    if (!muxResponse.ok) {
      throw new Error(`Mux API error: ${muxResponse.statusText}`)
    }

    const muxData = await muxResponse.json()
    const liveStreamId = muxData.data.id
    const playbackId = muxData.data.playback_ids?.[0]?.id
    const rtmpIngestionUrl = muxData.data.rtmp_server_url
    const rtmpStreamKey = muxData.data.rtmp_stream_key

    // Save to Supabase
    await supabase.from('rooms').insert({
      streamer_id: streamerId,
      title: streamTitle,
      is_live: true,
      rtmp_key: rtmpStreamKey,
      hls_url: `https://stream.mux.com/${playbackId}.m3u8`,
      thumbnail_url: `https://image.mux.com/v1/thumbnails/time/00:00:00?token=${playbackId}`,
    })

    res.status(201).json({
      id: liveStreamId,
      rtmpIngestionUrl,
      rtmpStreamKey,
      playbackId,
      status: 'active',
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error creating live stream:', error)
    res.status(500).json({ error: 'Failed to create live stream' })
  }
}

async function getLiveStream(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing stream ID' })
  }

  try {
    const muxResponse = await fetch(`${MUX_API_BASE}/video/v1/live-streams/${id}`, {
      headers: {
        'Authorization': getAuthHeader(),
      },
    })

    if (!muxResponse.ok) {
      throw new Error(`Mux API error: ${muxResponse.statusText}`)
    }

    const muxData = await muxResponse.json()
    const status = muxData.data.status

    res.json({
      id: muxData.data.id,
      status,
      createdAt: muxData.data.created_at,
    })
  } catch (error) {
    console.error('Error fetching live stream:', error)
    res.status(500).json({ error: 'Failed to fetch live stream' })
  }
}
