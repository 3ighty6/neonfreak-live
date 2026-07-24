import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    muxTokenId: process.env.MUX_TOKEN_ID ? 'SET' : 'NOT SET',
    muxTokenSecret: process.env.MUX_TOKEN_SECRET ? 'SET' : 'NOT SET',
    supabaseUrl: process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
    supabaseKey: process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    paddleVendorId: process.env.PADDLE_VENDOR_ID ? 'SET' : 'NOT SET',
    allKeys: Object.keys(process.env).filter(k => !k.includes('PATH')).sort(),
  })
}
