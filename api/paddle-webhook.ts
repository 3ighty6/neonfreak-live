/**
 * Vercel API Route: /api/paddle-webhook
 * Handles Paddle webhook events for payments
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
)

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Paddle webhook received:', {
      headers: Object.keys(req.headers),
      bodyType: typeof req.body,
    })

    // Verify webhook signature
    const signature = req.headers['paddle-signature'] as string
    if (!signature) {
      console.error('No paddle-signature header found')
      return res.status(401).json({ error: 'Missing signature' })
    }

    if (!verifySignature(req.body, signature)) {
      console.error('Signature verification failed')
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const event = JSON.parse(req.body.event)
    const eventType = event.type

    console.log(`Webhook received: ${eventType}`, {
      transactionId: event.data?.id,
      customerId: event.data?.customer_id,
    })

    // Handle different event types
    switch (eventType) {
      case 'transaction.completed':
        await handleTransactionCompleted(event.data)
        break
      case 'transaction.created':
        console.log('Transaction created:', event.data.id)
        break
      case 'transaction.updated':
        console.log('Transaction updated:', event.data.id)
        break
      default:
        console.log('Unknown event type:', eventType)
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}

// Verify Paddle webhook signature
function verifySignature(body: string, signature: string): boolean {
  if (!PADDLE_WEBHOOK_SECRET) {
    console.warn('PADDLE_WEBHOOK_SECRET not configured')
    return false
  }

  const hash = crypto
    .createHmac('sha256', PADDLE_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')

  return hash === signature
}

// Handle successful transaction
async function handleTransactionCompleted(data: any) {
  const {
    id: transactionId,
    customer_id: customerId,
    items,
    status,
  } = data

  console.log(`Processing transaction ${transactionId} for customer ${customerId}`)

  // Parse custom data for tip destination
  const tipAmount = items?.[0]?.total_amount || 0
  const creatorId = customerId // In real app, extract from custom_data

  if (!creatorId) {
    console.error('No creator ID found in transaction')
    return
  }

  // Calculate split: 70% to creator, 30% platform
  const creatorShare = Math.floor(tipAmount * 0.7)
  const platformShare = tipAmount - creatorShare

  try {
    // Get current balance first
    const { data: current } = await supabase
      .from('user_tokens')
      .select('balance, lifetime_earned')
      .eq('user_id', creatorId)
      .single()

    const newBalance = (current?.balance || 0) + creatorShare
    const newLifetime = (current?.lifetime_earned || 0) + creatorShare

    // Update creator's token balance
    const { error: updateError } = await supabase
      .from('user_tokens')
      .update({
        balance: newBalance,
        lifetime_earned: newLifetime,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', creatorId)

    if (updateError) throw updateError

    console.log(`✅ Tip processed: $${tipAmount / 100} (${creatorShare} tokens to creator, ${platformShare} tokens to platform)`)
  } catch (error) {
    console.error('Failed to update creator tokens:', error)
  }
}
