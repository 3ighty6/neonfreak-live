import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || ''
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

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

    if (creatorId && amount > 0 && SUPABASE_URL && SUPABASE_ANON_KEY) {
      const creatorShare = Math.floor(amount * 0.7)

      const balRes = await fetch(`${SUPABASE_URL}/rest/v1/user_token_balance?user_id=eq.${creatorId}&select=balance`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      })
      const balRows = await balRes.json()
      const currentBalance = balRows?.[0]?.balance || 0

      await fetch(`${SUPABASE_URL}/rest/v1/user_token_balance?user_id=eq.${creatorId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ balance: currentBalance + creatorShare }),
      })

      await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: data.id,
          creator_id: creatorId,
          amount: amount,
          type: 'tip',
          status: 'completed',
        }),
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
