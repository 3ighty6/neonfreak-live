/**
 * Vercel API Route: /api/stripe-create-checkout
 * Creates a Stripe Checkout Session for a one-off tip, a token
 * purchase, or a recurring creator subscription (platform-paid tier
 * for promotion/featured placement). Uses inline price_data instead
 * of pre-created Price IDs -- works for recurring prices too, Stripe
 * supports that in subscription-mode Checkout Sessions.
 *
 * Requires STRIPE_SECRET_KEY in the environment. Nothing here will work
 * until that's set in Vercel.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const SITE_URL = process.env.SITE_URL || 'https://neonfreak-live.vercel.app'

// Placeholder pricing -- a business decision, not an engineering one.
// Adjust freely; nothing else depends on these specific numbers.
const CREATOR_TIER_PRICES_USD_CENTS: Record<string, number> = {
  boost: 999, // $9.99/mo
  featured: 2499, // $24.99/mo
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured (STRIPE_SECRET_KEY missing)' })
  }

  const { kind, userId, creatorId, amountUsdCents, tokens, label, returnRoomId, tier } = req.body as {
    kind: 'tip' | 'tokens' | 'creator_subscription'
    userId: string
    creatorId?: string
    amountUsdCents?: number
    tokens?: number
    label?: string
    returnRoomId?: string
    tier?: 'boost' | 'featured'
  }

  if (!kind || !userId) {
    return res.status(400).json({ error: 'Missing kind or userId' })
  }
  if (kind === 'tip' && !creatorId) {
    return res.status(400).json({ error: 'Missing creatorId for a tip' })
  }
  if (kind === 'creator_subscription' && (!tier || !CREATOR_TIER_PRICES_USD_CENTS[tier])) {
    return res.status(400).json({ error: 'Missing or invalid tier' })
  }
  if (kind !== 'creator_subscription' && !amountUsdCents) {
    return res.status(400).json({ error: 'Missing amountUsdCents' })
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY)

    const successUrl = returnRoomId
      ? `${SITE_URL}/?checkout=success&room=${returnRoomId}`
      : `${SITE_URL}/?checkout=success`

    if (kind === 'creator_subscription') {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: CREATOR_TIER_PRICES_USD_CENTS[tier!],
              recurring: { interval: 'month' },
              product_data: {
                name: tier === 'featured' ? 'NeonLights Featured Creator' : 'NeonLights Boosted Creator',
              },
            },
            quantity: 1,
          },
        ],
        metadata: { kind, userId, tier: tier! },
        success_url: `${SITE_URL}/?checkout=success`,
        cancel_url: `${SITE_URL}/?checkout=cancelled`,
      })
      return res.json({ checkoutUrl: session.url, sessionId: session.id })
    }

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
