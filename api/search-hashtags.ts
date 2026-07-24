import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { tag } = req.query
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

  if (!tag) {
    return res.status(400).json({ error: 'Missing tag' })
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.json({ results: [], error: 'Supabase not configured' })
    }

    const tagStr = String(tag)
    // Search in streams table
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/streams?select=id,title,status&limit=10`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error('Supabase error:', response.status)
      return res.json({ results: [] })
    }

    const data = await response.json()

    res.json({
      results: (data || []).map((stream: any) => ({
        tag: tagStr,
        stream,
      })),
    })
  } catch (error) {
    console.error('Error:', error)
    res.json({ results: [], error: String(error) })
  }
}
