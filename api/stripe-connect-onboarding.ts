/**
 * Vercel API Route: /api/stripe-connect-onboarding
 * Creates (or reuses) a Stripe Connect Express account for a creator and
 * returns an onboarding link. Requires STRIPE_SECRET_KEY and
 * SUPABASE_SERVICE_ROLE_KEY in the environment.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SITE_URL = process.env.SITE_URL || 'https://neonfreak-live.vercel.app'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Stripe Connect not configured' })
  }

  const { userId, email } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: user } = await supabase
      .from('users')
      .select('stripe_connect_id')
      .eq('id', userId)
      .single()

    let accountId = user?.stripe_connect_id

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
      })
      accountId = account.id

      await supabase.from('users').update({ stripe_connect_id: accountId }).eq('id', userId)
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${SITE_URL}/?stripe_connect=refresh`,
      return_url: `${SITE_URL}/?stripe_connect=complete`,
      type: 'account_onboarding',
    })

    res.json({ url: accountLink.url })
  } catch (error) {
    console.error('Stripe Connect onboarding error:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to start onboarding' })
  }
}
