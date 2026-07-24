import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { userId } = req.query

  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ balance: 0 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data, error } = await supabase
      .from('user_token_balance')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // Create entry if doesn't exist
      await supabase.from('user_token_balance').insert({
        user_id: userId as string,
        balance: 0,
      })
      return res.json({ balance: 0, userId })
    }

    res.json({ balance: data.balance, userId })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ balance: 0 })
  }
}
