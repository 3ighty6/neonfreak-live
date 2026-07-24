/**
 * Vercel API Route: /api/update-profile
 * Updates user profile info (username, bio, email, avatar)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, username, bio, email } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }

  try {
    // TODO: Update Supabase user profile
    // const { error } = await supabase
    //   .from('user_profiles')
    //   .update({ username, bio, email, updated_at: new Date() })
    //   .eq('user_id', userId)

    // TODO: Handle avatar upload to Supabase storage if provided
    // if (avatarFile) {
    //   const { data, error } = await supabase.storage
    //     .from('avatars')
    //     .upload(`${userId}/avatar`, avatarFile)
    // }

    res.json({
      success: true,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}
