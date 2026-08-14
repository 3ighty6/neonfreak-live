/**
 * Vercel API Route: /api/admin/stats
 * Gets dashboard statistics — admin-only.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' })
  }

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  try {
    // Client scoped to the caller's own session/JWT so RLS applies to them,
    // not the anon role — this is how we confirm they're really an admin.
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: authUser, error: authError } = await supabase.auth.getUser(token)
    if (authError || !authUser?.user) {
      return res.status(401).json({ error: 'Invalid session' })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', authUser.user.id)
      .single()

    if (!profile?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const [{ count: totalUsers }, { count: activeStreams }, { data: tipTotals }, { count: pendingReports }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('is_live', true),
      supabase.from('tips').select('amount'),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    const totalRevenue = (tipTotals || []).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)

    res.json({
      totalUsers: totalUsers ?? 0,
      activeStreams: activeStreams ?? 0,
      totalRevenue,
      pendingReports: pendingReports ?? 0,
    })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
}
