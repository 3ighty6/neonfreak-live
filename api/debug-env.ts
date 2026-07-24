import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!process.env.VITE_SUPABASE_ANON_KEY,
    hasMuxToken: !!process.env.MUX_TOKEN_ID,
    hasMuxSecret: !!process.env.MUX_TOKEN_SECRET,
    hasPaddleId: !!process.env.PADDLE_VENDOR_ID,
    hasPaddleKey: !!process.env.PADDLE_API_KEY,
    supabaseUrl: process.env.VITE_SUPABASE_URL || 'NOT SET',
    muxToken: process.env.MUX_TOKEN_ID ? process.env.MUX_TOKEN_ID.substring(0, 10) + '...' : 'NOT SET',
    paddleId: process.env.PADDLE_VENDOR_ID || 'NOT SET',
  })
}
