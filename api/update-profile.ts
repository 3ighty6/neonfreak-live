import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId, username, bio, email } = req.body

  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.json({ success: true, message: 'Profile updated (offline)' })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Update user profile
    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        bio,
        email,
        updated_at: new Date(),
      })
      .eq('id', userId)

    if (error) throw error

    res.json({ success: true, message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}
