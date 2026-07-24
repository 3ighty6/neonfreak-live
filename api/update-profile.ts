/**
 * Vercel API Route: /api/update-profile
 * Update user profile (username, bio, avatar URL)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, username, bio, email, avatarUrl } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' })
  }

  try {
    // Update profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        username: username || undefined,
        bio: bio || undefined,
        avatar_url: avatarUrl || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (profileError) throw profileError

    // Update email if provided (via auth.users table)
    if (email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email,
      })
      if (emailError) throw emailError
    }

    res.json({
      success: true,
      profile,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}
