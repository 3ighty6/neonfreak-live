/**
 * Vercel API Route: /api/admin/stats
 * Gets dashboard statistics
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // TODO: Query Supabase for stats
    res.json({
      totalUsers: 0,
      activeStreams: 0,
      totalRevenue: 0,
      pendingReports: 0,
    })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
}
