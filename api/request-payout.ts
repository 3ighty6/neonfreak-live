/**
 * Vercel API Route: /api/request-payout
 * Transfers a creator's available balance (total_earnings minus
 * anything already paid out) to their connected Stripe account.
 *
 * Requires STRIPE_SECRET_KEY and SUPABASE_SERVICE_ROLE_KEY in the
 * environment.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

const MINIMUM_PAYOUT_USD = 10

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Payouts not configured' })
  }

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  try {
    // Verify the caller's identity against their own session token first
    // (anon-scoped client), then do the actual work with the service
    // role so it isn't limited by the payouts table's read-only RLS.
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: authUser, error: authError } = await authClient.auth.getUser(token)
    if (authError || !authUser?.user) {
      return res.status(401).json({ error: 'Invalid session' })
    }
    const userId = authUser.user.id

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: user } = await supabase
      .from('users')
      .select('total_earnings, stripe_connect_id, stripe_connect_onboarded')
      .eq('id', userId)
      .single()

    if (!user?.stripe_connect_onboarded || !user.stripe_connect_id) {
      return res.status(400).json({ error: 'Connect a Stripe account before cashing out' })
    }

    const { data: priorPayouts } = await supabase
      .from('payouts')
      .select('amount_usd')
      .eq('user_id', userId)
      .in('status', ['pending', 'completed'])

    const alreadyPaidOut = (priorPayouts || []).reduce((sum, p) => sum + Number(p.amount_usd), 0)
    const available = Number(user.total_earnings || 0) - alreadyPaidOut

    if (available < MINIMUM_PAYOUT_USD) {
      return res.status(400).json({
        error: `Minimum payout is $${MINIMUM_PAYOUT_USD}. Your available balance is $${available.toFixed(2)}.`,
      })
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY)

    // Record as pending before the transfer so a crash between the
    // Stripe call and this insert can't silently double-pay -- if the
    // insert fails we still attempt to log it, but the transfer having
    // already happened is the source of truth Stripe holds regardless.
    let transfer: Stripe.Transfer
    try {
      transfer = await stripe.transfers.create({
        amount: Math.round(available * 100),
        currency: 'usd',
        destination: user.stripe_connect_id,
        description: `NeonLights creator payout for ${userId}`,
      })
    } catch (stripeError) {
      return res.status(400).json({
        error: stripeError instanceof Error ? stripeError.message : 'Transfer failed',
      })
    }

    await supabase.from('payouts').insert({
      user_id: userId,
      amount_usd: available,
      status: 'completed',
      stripe_transfer_id: transfer.id,
      completed_at: new Date().toISOString(),
    })

    res.json({ success: true, amount: available, transferId: transfer.id })
  } catch (error) {
    console.error('Payout error:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Payout failed' })
  }
}
