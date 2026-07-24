import type { VercelRequest, VercelResponse } from '@vercel/node'

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID || ''
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    return res.status(500).json({ error: 'Mux not configured', hasToken: !!MUX_TOKEN_ID, hasSecret: !!MUX_TOKEN_SECRET })
  }

  const { streamerId, title } = req.body
  if (!streamerId || !title) return res.status(400).json({ error: 'Missing fields' })

  try {
    const auth = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')
    const response = await fetch('https://api.mux.com/video/v1/live-streams', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playback_policy: ['public'] }),
    })

    if (!response.ok) {
      const error = await response.text()
      return res.status(response.status).json({ error })
    }

    const data = await response.json()
    const stream = data.data

    res.json({
      id: stream.id,
      rtmpServerUrl: stream.rtmp_server_url,
      rtmpStreamKey: stream.rtmp_stream_key,
      playbackId: stream.playback_ids?.[0]?.id,
      hlsUrl: stream.playback_ids?.[0]?.id ? `https://stream.mux.com/${stream.playback_ids[0].id}.m3u8` : null,
    })
  } catch (error) {
    res.status(500).json({ error: String(error) })
  }
}
