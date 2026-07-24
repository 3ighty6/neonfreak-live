/**
 * Vercel API Route: /api/verify-age-dob
 * Verifies user age via date of birth
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { dob } = req.body

  if (!dob) {
    return res.status(400).json({ error: 'Missing date of birth' })
  }

  try {
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    if (age < 18) {
      return res.status(400).json({ error: 'Must be 18 or older' })
    }

    // TODO: Store verification in Supabase
    // await supabase.from('age_verifications').insert({
    //   user_id: userId,
    //   dob_verified: true,
    //   verified_at: new Date(),
    // })

    res.json({ verified: true, age })
  } catch (error) {
    console.error('Age verification error:', error)
    res.status(500).json({ error: 'Verification failed' })
  }
}
