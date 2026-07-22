/**
 * Vercel API Route: /api/stripe/create-tip-checkout
 * Creates Stripe Checkout session for tips
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-06-24.dahlia',
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { creatorId, amount, userId } = req.body

  if (!creatorId || !amount || !userId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    // Get creator's Stripe Connect account
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Tip',
              description: `Tip for creator ${creatorId}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.VERCEL_URL || 'https://neonfreak-live.vercel.app'}/success?type=tip&creator=${creatorId}`,
      cancel_url: `${process.env.VERCEL_URL || 'https://neonfreak-live.vercel.app'}/live/${creatorId}`,
      metadata: {
        userId,
        creatorId,
        type: 'tip',
      },
    })

    res.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout:', error)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
}
