const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(express.json())
app.use(cors())

// Test endpoint
app.get('/api/test-env', (req, res) => {
  res.json({
    muxTokenId: process.env.MUX_TOKEN_ID ? 'SET' : 'NOT SET',
    muxTokenSecret: process.env.MUX_TOKEN_SECRET ? 'SET' : 'NOT SET',
    supabaseUrl: process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
  })
})

// Mux stream creation
app.post('/api/mux-create-stream', async (req, res) => {
  const { streamerId, title } = req.body
  const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID
  const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET

  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    return res.status(500).json({ error: 'Mux not configured' })
  }

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
      return res.status(response.status).json({ error: 'Mux API failed' })
    }

    const data = await response.json()
    const stream = data.data
    res.json({
      id: stream.id,
      rtmpServerUrl: stream.rtmp_server_url,
      rtmpStreamKey: stream.rtmp_stream_key,
      playbackId: stream.playback_ids?.[0]?.id,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))
