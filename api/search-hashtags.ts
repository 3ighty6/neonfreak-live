import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { tag } = req.query

  if (!tag || typeof tag !== 'string') {
    return res.status(400).json({ error: 'Missing tag' })
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.json({ results: [], error: 'Supabase not configured' })
  }

  try {
    const cleanTag = tag.replace(/^#/, '').trim().toLowerCase()

    // rooms is the canonical live/discovery table. Match against either the
    // tags array or the title, so a hashtag search also catches plain-text
    // mentions in stream titles.
    const filter = `or=(title.ilike.*${encodeURIComponent(cleanTag)}*,tags.cs.{${encodeURIComponent(cleanTag)}})`
    const url = `${SUPABASE_URL}/rest/v1/rooms?select=id,title,thumbnail_url,is_live,viewer_count,tags&${filter}&limit=20`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Supabase error:', response.status, await response.text())
      return res.json({ results: [] })
    }

    const data = await response.json()

    res.json({
      results: (data || []).map((room: any) => ({
        tag: cleanTag,
        room,
      })),
    })
  } catch (error) {
    console.error('Error:', error)
    res.json({ results: [], error: String(error) })
  }
}
