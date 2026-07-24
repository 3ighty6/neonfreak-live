/**
 * Vercel API Route: /api/paddle-webhook
 * Handles Paddle webhook events for payments
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify webhook signature
    const signature = req.headers['paddle-signature'] as string
    if (!verifySignature(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const event = JSON.parse(req.body.event)
    const eventType = event.type

    console.log(`Webhook received: ${eventType}`)

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

  // TODO: Update creator token balance in Supabase
  // TODO: Send notification to creator
  // TODO: Log transaction in analytics

  const tipAmount = items?.[0]?.total_amount || 0
  console.log(`Tip processed: $${tipAmount / 100} to creator`)
}
