/**
 * Vercel API Route: /api/stripe/create-token-checkout
 * Creates Stripe Checkout session for token purchases
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, tokens, bonus, amount } = req.body

  if (!userId || !tokens || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${tokens + bonus} Tokens`,
              description: `${tokens} tokens + ${bonus} bonus tokens`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.VERCEL_URL || 'https://neonfreak-live.vercel.app'}/success?type=tokens&tokens=${tokens + bonus}`,
      cancel_url: `${process.env.VERCEL_URL || 'https://neonfreak-live.vercel.app'}/tokens`,
      metadata: {
        userId,
        tokens: tokens.toString(),
        bonus: bonus.toString(),
        type: 'tokens',
      },
    })

    res.json({ url: session.url })
  } catch (error) {
    console.error('Error creating token checkout:', error)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
}
