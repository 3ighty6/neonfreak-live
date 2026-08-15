import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Polled by the Go Live "Test Connection" step so a streamer can
 * confirm OBS/browser media is actually reaching Mux before we mark
 * them live on the homepage. Without this, rooms.is_live was flipping
 * true the instant a stream was *created*, regardless of whether any
 * video ever arrived -- viewers would land on a dead player.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID || ''
  const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET || ''

  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    return res.status(500).json({ error: 'Mux not configured' })
  }

  const muxStreamId = req.method === 'GET' ? req.query.muxStreamId : req.body?.muxStreamId
  if (!muxStreamId || typeof muxStreamId !== 'string') {
    return res.status(400).json({ error: 'Missing muxStreamId' })
  }

  try {
    const auth = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')
    const muxRes = await fetch(`https://api.mux.com/video/v1/live-streams/${encodeURIComponent(muxStreamId)}`, {
      headers: { Authorization: `Basic ${auth}` },
    })

    if (!muxRes.ok) {
      const error = await muxRes.text()
      return res.status(muxRes.status).json({ error: 'Mux API failed', details: error })
    }

    const data = await muxRes.json()
    const stream = data.data

    // Mux statuses: idle (no incoming RTMP), active (receiving + playable),
    // disconnected (was active, dropped).
    res.json({ status: stream.status, active: stream.status === 'active' })
  } catch (error) {
    res.status(500).json({ error: String(error) })
  }
}
