/**
 * Vercel API Route: /api/stripe-connect-status
 * Checks whether a creator's Stripe Connect account can actually receive
 * payouts yet, and syncs users.stripe_connect_onboarded accordingly.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Stripe Connect not configured' })
  }

  const { userId } = req.query
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing userId' })
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: user } = await supabase
      .from('users')
      .select('stripe_connect_id, stripe_connect_onboarded')
      .eq('id', userId)
      .single()

    if (!user?.stripe_connect_id) {
      return res.json({ connected: false, onboarded: false })
    }

    const account = await stripe.accounts.retrieve(user.stripe_connect_id)
    const onboarded = !!account.charges_enabled && !!account.payouts_enabled

    if (onboarded !== user.stripe_connect_onboarded) {
      await supabase.from('users').update({ stripe_connect_onboarded: onboarded }).eq('id', userId)
    }

    res.json({ connected: true, onboarded })
  } catch (error) {
    console.error('Stripe Connect status error:', error)
    res.status(500).json({ error: 'Failed to check status' })
  }
}
