
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID || ''
  const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET || ''

  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    return res.status(500).json({ error: 'Mux not configured' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { streamerId, title } = req.body

  if (!streamerId || !title) {
    return res.status(400).json({ error: 'Missing streamerId or title' })
  }

  try {
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
      return res.status(muxRes.status).json({ error: 'Mux API failed', details: error })
    }

    const data = await muxRes.json()
    const stream = data.data

    res.json({
      success: true,
      id: stream.id,
      rtmpServerUrl: stream.rtmp_server_url,
      rtmpStreamKey: stream.rtmp_stream_key,
      playbackId: stream.playback_ids?.[0]?.id,
    })
  } catch (error) {
    res.status(500).json({ error: String(error) })
  }
}
