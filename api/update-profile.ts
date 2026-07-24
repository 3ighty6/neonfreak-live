import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, username, bio, email } = req.body
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.json({ success: false, error: 'Supabase not configured' })
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username || undefined,
          bio: bio || undefined,
          email: email || undefined,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Profile update failed:', response.status, error)
      return res.json({ success: false, error: `Supabase ${response.status}: ${error}` })
    }

    res.json({ success: true, message: 'Profile updated' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ success: false, error: String(error) })
  }
}
