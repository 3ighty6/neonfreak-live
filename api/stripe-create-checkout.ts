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
const SITE_URL = process.env.SITE_URL || 'https://neonlights-live.vercel.app'
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

// Placeholder pricing -- a business decision, not an engineering one.
// 3 tiers with a high-anchor top tier, per competitive research
// (OnlyFans-style pricing psychology: a premium top tier lifts
// perceived value and ARPU across lower tiers even when few buy it).
const CREATOR_TIER_PRICES_USD_CENTS: Record<string, number> = {
  boost: 999, // $9.99/mo
  featured: 2499, // $24.99/mo
  elite: 9999, // $99.99/mo -- high-anchor tier
}

// Viewer-side membership -- one tier for now, modeled on Chaturbate's
// Premium ($19.95/mo per the competitive research) and Flirt4Free's
// VIP (bonus value on spend, not a content unlock).
const VIEWER_VIP_PRICE_USD_CENTS = 1999 // $19.99/mo

// SOURCE OF TRUTH for token bundle pricing -- must be kept in sync with
// TOKEN_PACKAGES in src/lib/stripe.ts by hand (this file can't import
// from src/ across the Vercel function boundary). The client only ever
// sends a packageIndex now; everything money-related is looked up here,
// not trusted from the request body. (Previously the client sent
// amountUsdCents + tokens directly and nothing validated them against
// each other -- a modified request could charge $0.99 and claim
// 100,000 tokens. Fixed by removing that trust entirely.)
const TOKEN_PACKAGES_SERVER = [
  { tokens: 100, priceCents: 1099 },
  { tokens: 200, priceCents: 2099 },
  { tokens: 400, priceCents: 3999 },
  { tokens: 550, priceCents: 4999 },
  { tokens: 750, priceCents: 6299 },
  { tokens: 1000, priceCents: 7999 },
  { tokens: 1255, priceCents: 9999 },
  { tokens: 2025, priceCents: 15999 },
  { tokens: 4050, priceCents: 31998 },
  { tokens: 6350, priceCents: 49999 },
  { tokens: 12700, priceCents: 99998 },
]

async function getActivePromoBonusPercent(): Promise<number> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return 0
  try {
    const nowIso = new Date().toISOString()
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/token_promotions?active=eq.true&starts_at=lte.${nowIso}&ends_at=gte.${nowIso}&select=bonus_percent&order=bonus_percent.desc&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    )
    if (!res.ok) return 0
    const rows = await res.json()
    return rows?.[0]?.bonus_percent ? Number(rows[0].bonus_percent) : 0
  } catch {
    return 0
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured (STRIPE_SECRET_KEY missing)' })
  }

  const { kind, userId, creatorId, amountUsdCents, packageIndex, label, returnRoomId, tier } = req.body as {
    kind: 'tip' | 'tokens' | 'creator_subscription' | 'viewer_vip'
    userId: string
    creatorId?: string
    amountUsdCents?: number
    packageIndex?: number
    label?: string
    returnRoomId?: string
    tier?: 'boost' | 'featured' | 'elite'
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
  if (kind === 'tip' && !amountUsdCents) {
    return res.status(400).json({ error: 'Missing amountUsdCents' })
  }
  if (kind === 'tokens' && (packageIndex === undefined || !TOKEN_PACKAGES_SERVER[packageIndex])) {
    return res.status(400).json({ error: 'Missing or invalid packageIndex' })
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY)

    const successUrl = returnRoomId
      ? `${SITE_URL}/?checkout=success&room=${returnRoomId}`
      : `${SITE_URL}/?checkout=success`

    if (kind === 'viewer_vip') {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: VIEWER_VIP_PRICE_USD_CENTS,
              recurring: { interval: 'month' },
              product_data: { name: 'NeonLights VIP Membership' },
            },
            quantity: 1,
          },
        ],
        metadata: { kind, userId },
        success_url: `${SITE_URL}/?checkout=success`,
        cancel_url: `${SITE_URL}/?checkout=cancelled`,
      })
      return res.json({ checkoutUrl: session.url, sessionId: session.id })
    }

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
                name: tier === 'elite' ? 'NeonLights Elite Creator' : tier === 'featured' ? 'NeonLights Featured Creator' : 'NeonLights Boosted Creator',
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

    // Tip: unit_amount comes straight from the client-named amount, and
    // that's fine -- nothing separate is trusted or credited beyond what
    // Stripe actually charges. Tokens: unit_amount and the tokens
    // credited both come from TOKEN_PACKAGES_SERVER by index, plus any
    // active promo bonus looked up here -- the client's input is only
    // ever an index into a fixed, server-owned price list.
    let finalAmountCents = amountUsdCents
    let finalTokens = 0
    let promoLabel = ''
    if (kind === 'tokens') {
      const pkg = TOKEN_PACKAGES_SERVER[packageIndex!]
      finalAmountCents = pkg.priceCents
      const bonusPercent = await getActivePromoBonusPercent()
      finalTokens = bonusPercent > 0 ? Math.round(pkg.tokens * (1 + bonusPercent / 100)) : pkg.tokens
      if (bonusPercent > 0) promoLabel = ` (+${bonusPercent}% promo)`
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: finalAmountCents,
            product_data: {
              name: kind === 'tip' ? (label || 'Tip') : `${finalTokens} NeonLights Tokens${promoLabel}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind,
        userId,
        creatorId: creatorId || '',
        tokens: kind === 'tokens' ? String(finalTokens) : '',
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
