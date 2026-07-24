import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { creatorId } = req.query

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.json({
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
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Get creator balance
    const { data: balance } = await supabase
      .from('user_token_balance')
      .select('balance')
      .eq('user_id', creatorId)
      .single()

    // Get transaction history
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })

    const totalEarnings = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    const thisMonthEarnings =
      transactions
        ?.filter(t => new Date(t.created_at) >= thisMonthStart)
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0

    res.json({
      stats: {
        totalEarnings,
        pendingPayout: balance?.balance || 0,
        totalStreams: 0,
        totalViewers: 0,
        avgViewersPerStream: 0,
        thisMonthEarnings,
        lastPayoutDate: 'Never',
      },
      chart: (transactions || []).slice(-7).map(t => ({
        date: new Date(t.created_at).toLocaleDateString(),
        amount: t.amount || 0,
      })),
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
}
