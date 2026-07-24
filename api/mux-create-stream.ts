import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID || ''
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET || ''
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { streamerId, title } = req.body
  if (!streamerId || !title) return res.status(400).json({ error: 'Missing streamerId or title' })

  try {
    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
      return res.status(500).json({ error: 'Mux not configured' })
    }

    const auth = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')
    const muxRes = await fetch('https://api.mux.com/video/v1/live-streams', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playback_policy: ['public'] }),
    })

    if (!muxRes.ok) {
      const error = await muxRes.text()
      console.error('Mux error:', error)
      return res.status(muxRes.status).json({ error: 'Mux API failed' })
    }

    const muxData = await muxRes.json()
    const stream = muxData.data

    // Store in Supabase
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      await supabase.from('streams').insert({
        id: stream.id,
        creator_id: streamerId,
        mux_stream_id: stream.id,
        rtmp_url: stream.rtmp_server_url,
        rtmp_key: stream.rtmp_stream_key,
        status: 'active',
      })
    }

    res.json({
      id: stream.id,
      rtmpServerUrl: stream.rtmp_server_url,
      rtmpStreamKey: stream.rtmp_stream_key,
      playbackId: stream.playback_ids?.[0]?.id,
      status: 'active',
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to create stream' })
  }
}
