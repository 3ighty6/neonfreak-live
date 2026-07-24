/**
 * Vercel API Route: /api/search-creators
 * Search for creators by username, hashtag, or category
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { q, type = 'all' } = req.query
  const query = String(q || '').trim()

  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' })
  }

  try {
    let dbQuery = supabase
      .from('profiles')
      .select('id, username, bio, avatar_url, is_verified, category')
      .limit(20)

    if (type === 'hashtag') {
      // Search in bio for hashtags
      dbQuery = dbQuery.ilike('bio', `%#${query}%`)
    } else if (type === 'category') {
      // Search by category
      dbQuery = dbQuery.eq('category', query)
    } else {
      // Search by username
      dbQuery = dbQuery.ilike('username', `%${query}%`)
    }

    const { data: creators, error } = await dbQuery

    if (error) throw error

    res.json({
      results: creators || [],
      count: creators?.length || 0,
      query,
      type,
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
}
