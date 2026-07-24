import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || ''
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const signature = req.headers['paddle-signature'] as string
    if (!signature || !verifySignature(req.body, signature)) {
      console.error('Invalid signature')
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
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      
      // Update creator balance (70% of tip)
      const creatorShare = Math.floor(amount * 0.7)
      const { data: balance } = await supabase
        .from('user_token_balance')
        .select('balance')
        .eq('user_id', creatorId)
        .single()
      
      await supabase
        .from('user_token_balance')
        .upsert({
          user_id: creatorId,
          balance: (balance?.balance || 0) + creatorShare,
        })

      // Log transaction
      await supabase.from('transactions').insert({
        id: data.id,
        creator_id: creatorId,
        amount: amount,
        type: 'tip',
        status: 'completed',
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
