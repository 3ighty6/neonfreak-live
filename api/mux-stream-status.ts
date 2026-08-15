import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Polled by the Go Live "Test Connection" step so a streamer can
 * confirm OBS/browser media is actually reaching Mux before we mark
 * them live on the homepage. Also handles fetching the VOD recording
 * Mux automatically creates once a stream ends (?action=get-recording),
 * folded into this endpoint rather than a new one -- already at
 * Vercel's 12-function cap.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID || ''
  const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET || ''

  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    return res.status(500).json({ error: 'Mux not configured' })
  }

  const action = req.query.action
  const muxStreamId = req.method === 'GET' ? req.query.muxStreamId : req.body?.muxStreamId
  if (!muxStreamId || typeof muxStreamId !== 'string') {
    return res.status(400).json({ error: 'Missing muxStreamId' })
  }

  const auth = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64')

  if (action === 'get-recording') {
    try {
      const streamRes = await fetch(`https://api.mux.com/video/v1/live-streams/${encodeURIComponent(muxStreamId)}`, {
        headers: { Authorization: `Basic ${auth}` },
      })
      if (!streamRes.ok) {
        return res.status(streamRes.status).json({ error: 'Mux API failed', details: await streamRes.text() })
      }
      const streamData = await streamRes.json()
      const recentAssetIds: string[] = streamData.data?.recent_asset_ids || []
      if (recentAssetIds.length === 0) {
        return res.json({ ready: false })
      }

      // Most recent broadcast session's recording
      const assetId = recentAssetIds[recentAssetIds.length - 1]
      const assetRes = await fetch(`https://api.mux.com/video/v1/assets/${encodeURIComponent(assetId)}`, {
        headers: { Authorization: `Basic ${auth}` },
      })
      if (!assetRes.ok) {
        return res.json({ ready: false })
      }
      const assetData = await assetRes.json()
      const asset = assetData.data
      const playbackId = asset.playback_ids?.[0]?.id

      if (asset.status !== 'ready' || !playbackId) {
        return res.json({ ready: false })
      }

      return res.json({
        ready: true,
        assetId,
        playbackId,
        durationSeconds: Math.round(asset.duration || 0),
        hlsUrl: `https://stream.mux.com/${playbackId}.m3u8`,
        thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
      })
    } catch (error) {
      return res.status(500).json({ error: String(error) })
    }
  }

  try {
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
