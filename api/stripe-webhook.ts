/**
 * Vercel API Route: /api/stripe-webhook
 * Handles checkout.session.completed events: credits tokens or records a
 * tip once payment actually clears. Configure this URL as a webhook
 * endpoint in the Stripe dashboard and set STRIPE_WEBHOOK_SECRET.
 *
 * Uses the Supabase service role key (not the anon key) because this runs
 * with no user session — it needs to write on the buyer's behalf. Add
 * SUPABASE_SERVICE_ROLE_KEY in Vercel (Project Settings > API in Supabase).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { buffer } from 'node:stream/consumers'

export const config = {
  api: { bodyParser: false },
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Stripe webhook not fully configured')
    return res.status(500).json({ error: 'Not configured' })
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY)
  const sig = req.headers['stripe-signature']

  let event: Stripe.Event
  try {
    const rawBody = await buffer(req)
    event = stripe.webhooks.constructEvent(rawBody, sig as string, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const { kind, userId, creatorId, tokens, tier } = session.metadata || {}
      const amountUsd = (session.amount_total || 0) / 100

      if (kind === 'tokens' && userId) {
        const tokenAmount = parseInt(tokens || '0', 10)

        const { data: user } = await supabase.from('users').select('token_balance').eq('id', userId).single()
        await supabase
          .from('users')
          .update({ token_balance: (user?.token_balance || 0) + tokenAmount })
          .eq('id', userId)

        await supabase.from('transactions').insert({
          user_id: userId,
          type: 'token_purchase',
          amount: amountUsd,
          tokens: tokenAmount,
          description: `Purchased ${tokenAmount} tokens`,
          status: 'completed',
          stripe_id: session.id,
        })
      } else if (kind === 'tip' && userId && creatorId) {
        await supabase.from('tips').insert({
          sender_id: userId,
          receiver_id: creatorId,
          amount: amountUsd,
        })

        const { data: creator } = await supabase.from('users').select('total_earnings').eq('id', creatorId).single()
        await supabase
          .from('users')
          .update({ total_earnings: Number(creator?.total_earnings || 0) + amountUsd * 0.85 })
          .eq('id', creatorId)
      } else if (kind === 'creator_subscription' && userId && tier && session.subscription && session.customer) {
        // Initial subscription record. Renewal/cancellation status is
        // kept in sync by the customer.subscription.* events below --
        // this just creates the row so those have something to update.
        await supabase.from('creator_subscriptions').insert({
          user_id: userId,
          tier,
          stripe_subscription_id: session.subscription as string,
          stripe_customer_id: session.customer as string,
          status: 'active',
        })
      } else if (kind === 'viewer_vip' && userId && session.subscription && session.customer) {
        await supabase.from('viewer_vip_subscriptions').insert({
          user_id: userId,
          stripe_subscription_id: session.subscription as string,
          stripe_customer_id: session.customer as string,
          status: 'active',
        })
      }
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      const status = event.type === 'customer.subscription.deleted'
        ? 'canceled'
        : sub.status === 'active' || sub.status === 'trialing'
          ? 'active'
          : sub.status === 'past_due'
            ? 'past_due'
            : 'canceled'

      const updatePayload = {
        status,
        current_period_end: (sub as any).current_period_end
          ? new Date((sub as any).current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      }

      // A given subscription ID only ever exists in one of these two
      // tables -- updating both is harmless (the non-matching one
      // just affects zero rows) and avoids needing to track which
      // table a subscription belongs to separately.
      await supabase.from('creator_subscriptions').update(updatePayload).eq('stripe_subscription_id', sub.id)
      await supabase.from('viewer_vip_subscriptions').update(updatePayload).eq('stripe_subscription_id', sub.id)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    // Still 200 so Stripe doesn't hammer retries for a bug on our end;
    // the event is visible/replayable from the Stripe dashboard either way.
    res.status(200).json({ received: true, processingError: String(error) })
  }
}
