/**
 * Vercel API Route: /api/upload-media
 * Handles photo/video upload to Supabase Storage
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, type } = req.body
    
    if (!userId || !type) {
      return res.status(400).json({ error: 'Missing userId or type' })
    }

    // TODO: Implement Supabase Storage upload
    // For now, return placeholder URL
    
    const fileName = `${userId}/${Date.now()}`
    const bucket = type === 'photo' ? 'photos' : 'videos'
    
    // const { data, error } = await supabase.storage
    //   .from(bucket)
    //   .upload(fileName, file, {
    //     cacheControl: '3600',
    //     upsert: false,
    //   })

    // const { data: publicUrl } = supabase.storage
    //   .from(bucket)
    //   .getPublicUrl(fileName)

    res.json({
      url: `https://placeholder.example.com/${bucket}/${fileName}`,
      bucket,
      fileName,
      type,
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
}
