/**
 * Vercel API Route: /api/stripe/webhook
 * Handles Stripe webhook events (payments, payouts)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { supabase } from '../src/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-06-24.dahlia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature'] as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Handle tip payment
        if (session.metadata?.type === 'tip') {
          await supabase.from('tips').insert({
            sender_id: session.metadata.userId,
            receiver_id: session.metadata.creatorId,
            amount: (session.amount_total || 0) / 100,
            message: null,
          })
        }
        
        // Handle token purchase
        if (session.metadata?.type === 'tokens') {
          const tokens = parseInt(session.metadata.tokens || '0') + parseInt(session.metadata.bonus || '0')
          await supabase.from('token_purchases').insert({
            user_id: session.metadata.userId,
            tokens,
            amount_usd: (session.amount_total || 0) / 100,
            stripe_session_id: session.id,
          })
        }
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        // Update creator's connected status
        if (account.metadata?.userId) {
          await supabase
            .from('users')
            .update({
              stripe_connect_id: account.id,
              is_verified: account.charges_enabled,
            })
            .eq('id', account.metadata.userId)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        console.log('Charge refunded:', charge.id)
        // Handle refund logic if needed
        break
      }
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}
