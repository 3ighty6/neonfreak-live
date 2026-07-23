/**
 * Vercel API Route: /api/stripe/create-connect-link
 * Creates Stripe Connect onboarding link for creators
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-06-24.dahlia',
})

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }

  try {
    // Create or get existing connected account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: `creator-${userId}@neon-chat.local`,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        userId,
      },
    })

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      type: 'account_onboarding',
      refresh_url: `${process.env.VERCEL_URL || 'https://neonfreak-live.vercel.app'}/creator/connect-refresh`,
      return_url: `${process.env.VERCEL_URL || 'https://neonfreak-live.vercel.app'}/creator/connect-success?account=${account.id}`,
    })

    res.json({ url: accountLink.url })
  } catch (error) {
    console.error('Error creating Connect link:', error)
    res.status(500).json({ error: 'Failed to create onboarding link' })
  }
}
