import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId, type, fileName } = req.body

  if (!userId || !type || !fileName) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    if (!SUPABASE_URL) {
      return res.status(500).json({ error: 'Storage not configured' })
    }

    const bucket = type === 'photo' ? 'photos' : type === 'video' ? 'videos' : 'avatars'
    const path = `${userId}/${Date.now()}-${fileName}`
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`

    res.json({
      url: publicUrl,
      bucket,
      path,
      type,
      success: true,
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
}
