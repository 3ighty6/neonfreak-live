/**
 * Vercel API Route: /api/verify-age-selfie
 * Verifies age using selfie photo (age detection via AI)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { dob } = req.body
    
    if (!dob) {
      return res.status(400).json({ error: 'Missing date of birth' })
    }

    // TODO: Implement age detection via AI
    // - Use CV model to estimate age from selfie
    // - Compare with provided DOB
    // - Use service like:
    //   - AWS Rekognition
    //   - Google Cloud Vision
    //   - Microsoft Face API
    //   - Custom ML model

    // For now, assume verified if DOB is valid
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    if (age < 18) {
      return res.status(400).json({ error: 'Age verification failed' })
    }

    // TODO: Store in Supabase
    // await supabase.from('age_verifications').insert({
    //   user_id: userId,
    //   selfie_verified: true,
    //   verified_at: new Date(),
    // })

    res.json({ verified: true, age })
  } catch (error) {
    console.error('Selfie verification error:', error)
    res.status(500).json({ error: 'Verification failed' })
  }
}
