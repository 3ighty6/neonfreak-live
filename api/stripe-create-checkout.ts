/**
 * Vercel API Route: /api/stripe-create-checkout
 * Creates a Stripe Checkout Session for either a one-off tip or a token
 * purchase. Uses inline price_data instead of pre-created Price IDs, so
 * there's nothing to keep in sync on Stripe's dashboard.
 *
 * Requires STRIPE_SECRET_KEY in the environment. Nothing here will work
 * until that's set in Vercel.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const SITE_URL = process.env.SITE_URL || 'https://neonfreak-live.vercel.app'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured (STRIPE_SECRET_KEY missing)' })
  }

  const { kind, userId, creatorId, amountUsdCents, tokens, label, returnRoomId } = req.body as {
    kind: 'tip' | 'tokens'
    userId: string
    creatorId?: string
    amountUsdCents: number
    tokens?: number
    label?: string
    returnRoomId?: string
  }

  if (!kind || !userId || !amountUsdCents) {
    return res.status(400).json({ error: 'Missing kind, userId, or amountUsdCents' })
  }
  if (kind === 'tip' && !creatorId) {
    return res.status(400).json({ error: 'Missing creatorId for a tip' })
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY)

    const successUrl = returnRoomId
      ? `${SITE_URL}/?checkout=success&room=${returnRoomId}`
      : `${SITE_URL}/?checkout=success`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amountUsdCents,
            product_data: {
              name: kind === 'tip' ? (label || 'Tip') : `${tokens ?? ''} NeonLights Tokens`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind,
        userId,
        creatorId: creatorId || '',
        tokens: tokens ? String(tokens) : '',
      },
      success_url: successUrl,
      cancel_url: `${SITE_URL}/?checkout=cancelled`,
    })

    res.json({ checkoutUrl: session.url, sessionId: session.id })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create checkout' })
  }
}
