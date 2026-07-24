import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { userId } = req.query

  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing Supabase credentials')
      return res.status(500).json({ balance: 0, error: 'Config missing' })
    }

    // Use Supabase REST API instead of client library
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/user_token_balance?user_id=eq.${userId}&select=balance`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error('Supabase error:', response.status, await response.text())
      // Return default balance if table doesn't exist yet
      return res.json({ balance: 0, userId })
    }

    const data = await response.json()
    const balance = data[0]?.balance || 0

    res.json({ balance, userId })
  } catch (error) {
    console.error('Error:', error)
    res.json({ balance: 0, userId, error: 'Exception' })
  }
}
