/**
 * Vercel API Route: /api/stripe/test
 * Test endpoint to verify Stripe configuration
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    return res.status(400).json({
      error: 'STRIPE_SECRET_KEY not configured',
      status: 'MISSING_ENV_VAR',
    })
  }

  try {
    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20' as any,
    })

    // Test the connection
    const account = await (stripe.account as any).retrieve('me')

    res.json({
      status: 'OK',
      message: 'Stripe is properly configured',
      account: {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      },
    })
  } catch (error: any) {
    console.error('Stripe test error:', error)
    res.status(500).json({
      error: error.message,
      status: 'ERROR',
    })
  }
}
