import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

const PADDLE_WEBHOOK_SECRET = 'pdl_ntfset_01ky8q4kk7ets4qw8hgsgp9xhx_SX0CJLJ1P8yjOOrdOST4b0G3L2nJx148'
const SUPABASE_URL = 'https://acvdwrkqmyumlmgpfvcu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdmR3cmtxbXl1bWxtZ3BmdmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMjgzOTMsImV4cCI6MjA5OTgwNDM5M30.OMVHer-yBxyJ-EfiGsIlTNua9rNmyRtnNn1wmyv9vng'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const signature = req.headers['paddle-signature'] as string
    if (!signature || !verifySignature(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const event = JSON.parse(req.body.event)
    if (event.type !== 'transaction.completed') {
      return res.status(200).json({ success: true })
    }

    const { data } = event
    const creatorId = data.custom_data?.creatorId
    const amount = Math.floor((data.total_amount || 0) / 100)

    if (creatorId && amount > 0) {
      const creatorShare = Math.floor(amount * 0.7)
      
      // Update creator balance
      await fetch(`${SUPABASE_URL}/rest/v1/user_token_balance?user_id=eq.${creatorId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ balance: creatorShare }),
      })
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}

function verifySignature(body: string, signature: string): boolean {
  if (!PADDLE_WEBHOOK_SECRET) return false
  const hash = crypto
    .createHmac('sha256', PADDLE_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')
  return hash === signature
}
