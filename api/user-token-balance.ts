/**
 * Vercel API Route: /api/user-token-balance
 * Get user's current token balance
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

  const { userId } = req.query

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' })
  }

  try {
    // Get or create token record
    let { data: tokenData, error } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      // Record doesn't exist, create it
      const { data: newToken, error: createError } = await supabase
        .from('user_tokens')
        .insert([
          {
            user_id: userId,
            balance: 0,
            lifetime_earned: 0,
            lifetime_spent: 0,
          },
        ])
        .select()
        .single()

      if (createError) throw createError
      tokenData = newToken
    } else if (error) {
      throw error
    }

    res.json({
      userId,
      balance: tokenData?.balance || 0,
      lifetimeEarned: tokenData?.lifetime_earned || 0,
      lifetimeSpent: tokenData?.lifetime_spent || 0,
      updatedAt: tokenData?.updated_at,
    })
  } catch (error) {
    console.error('Token balance error:', error)
    res.status(500).json({ error: 'Failed to fetch token balance' })
  }
}
