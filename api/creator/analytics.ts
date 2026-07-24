/**
 * Vercel API Route: /api/creator/analytics
 * Gets creator analytics and earnings data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // TODO: Query Supabase for creator analytics
    // const { data: earnings } = await supabase
    //   .from('creator_earnings')
    //   .select('*')
    //   .eq('creator_id', creatorId)
    //   .order('date', { ascending: false })

    res.json({
      stats: {
        totalEarnings: 0,
        pendingPayout: 0,
        totalStreams: 0,
        totalViewers: 0,
        avgViewersPerStream: 0,
        thisMonthEarnings: 0,
        lastPayoutDate: 'Never',
      },
      chart: [],
    })
  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
}
