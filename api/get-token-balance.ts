/**
 * Vercel API Route: /api/get-token-balance
 * Fetches user's current token balance
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.query

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }

  try {
    // TODO: Query Supabase for user's token balance
    // const { data, error } = await supabase
    //   .from('user_profiles')
    //   .select('token_balance')
    //   .eq('user_id', userId)
    //   .single()

    // For now, return placeholder
    res.json({
      balance: 0,
      userId,
    })
  } catch (error) {
    console.error('Error fetching token balance:', error)
    res.status(500).json({ error: 'Failed to fetch balance' })
  }
}
