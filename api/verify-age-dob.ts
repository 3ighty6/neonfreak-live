import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId, dob } = req.body

  if (!dob) return res.status(400).json({ error: 'Missing date of birth' })

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

    // Store verification (optional - DB integration)
    if (userId && SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      try {
        await supabase.from('age_verifications').insert({
          user_id: userId,
          dob_verified: true,
          verified_at: new Date(),
        })
      } catch {
        // Table may not exist yet
      }
    }

    res.json({ verified: true, age })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Verification failed' })
  }
}
