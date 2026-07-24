/**
 * Vercel API Route: /api/search-hashtags
 * Searches for streams by hashtag
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { tag } = req.query

  if (!tag) {
    return res.status(400).json({ error: 'Missing tag parameter' })
  }

  try {
    // TODO: Query Supabase for streams with this hashtag
    // const { data, error } = await supabase
    //   .from('streams')
    //   .select('id, title, hashtags, status')
    //   .contains('hashtags', [tag as string])
    //   .eq('status', 'live')
    //   .limit(10)

    // For now, return placeholder
    res.json({
      results: [
        { tag: tag as string, count: 0 },
      ],
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search failed' })
  }
}
