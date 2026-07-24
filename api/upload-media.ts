import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId, type } = req.body
  if (!userId || !type) return res.status(400).json({ error: 'Missing userId or type' })

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: 'Storage not configured' })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const fileName = `${userId}/${Date.now()}`
    const bucket = type === 'photo' ? 'photos' : 'videos'

    // In a real implementation, parse the file from req.body
    // For now, return the expected URL structure
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)

    res.json({
      url: data.publicUrl,
      bucket,
      fileName,
      type,
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
}
