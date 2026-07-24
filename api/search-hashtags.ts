import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { tag } = req.query

  if (!tag) return res.status(400).json({ error: 'Missing tag' })

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.json({ results: [] })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const tagStr = tag as string
    
    // Search for streams with this hashtag
    const { data, error } = await supabase
      .from('streams')
      .select('id, title, status')
      .ilike('title', `%${tagStr}%`)
      .eq('status', 'active')
      .limit(10)

    if (error) throw error

    res.json({
      results: (data || []).map(stream => ({
        tag: tagStr,
        count: 1,
        stream,
      })),
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
}
