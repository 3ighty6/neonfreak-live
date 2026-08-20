/**
 * Stripe Checkout helpers for tips and token purchases.
 * Calls /api/stripe-create-checkout, which builds the session with
 * dynamic price_data — no pre-created Stripe Price IDs to manage.
 */

// Tip products
export const TIP_PRODUCTS = {
  say_hi: { amount: 1, emoji: '💬', label: 'Say Hi' },
  wave: { amount: 5, emoji: '👋', label: 'Wave' },
  gift: { amount: 10, emoji: '🎁', label: 'Gift' },
  love: { amount: 25, emoji: '❤️', label: 'Love' },
  fire: { amount: 50, emoji: '🔥', label: 'Fire' },
}

// Token packages (prices in cents). tokens is the TOTAL credited amount
// (bonus already included) -- bonusPercent is display-only, mirrors how
// Chaturbate-style sites market bundles: bigger bundle = bigger % off the
// $0.1099/token base rate set by the 100-token entry tier.
export const TOKEN_PACKAGES = [
  { tokens: 100, priceCents: 1099, bonusPercent: 0, popular: false, priceUSD: 10.99 },
  { tokens: 200, priceCents: 2099, bonusPercent: 5, popular: false, priceUSD: 20.99 },
  { tokens: 400, priceCents: 3999, bonusPercent: 10, popular: false, priceUSD: 39.99 },
  { tokens: 550, priceCents: 4999, bonusPercent: 21, popular: false, priceUSD: 49.99 },
  { tokens: 750, priceCents: 6299, bonusPercent: 31, popular: false, priceUSD: 62.99 },
  { tokens: 1000, priceCents: 7999, bonusPercent: 37, popular: false, priceUSD: 79.99 },
  { tokens: 1255, priceCents: 9999, bonusPercent: 38, popular: true, priceUSD: 99.99 },
  { tokens: 2025, priceCents: 15999, bonusPercent: 39, popular: false, priceUSD: 159.99 },
  { tokens: 4050, priceCents: 31998, bonusPercent: 39, popular: false, priceUSD: 319.98 },
  { tokens: 6350, priceCents: 49999, bonusPercent: 40, popular: false, priceUSD: 499.99 },
  { tokens: 12700, priceCents: 99998, bonusPercent: 40, popular: false, priceUSD: 999.98 },
]

/**
 * Create a Stripe Checkout session for tipping a creator directly
 * (bypassing the token balance). Redirects the browser to Stripe.
 */
export async function createTipCheckout(
  creatorId: string,
  tipAmountUsd: number,
  userId: string
): Promise<{ url: string | null }> {
  const response = await fetch('/api/stripe-create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'tip',
      userId,
      creatorId,
      amountUsdCents: Math.round(tipAmountUsd * 100),
      label: getTierNameForAmount(tipAmountUsd),
    }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to create checkout')
  }
  const data = await response.json()
  return { url: data.checkoutUrl }
}

/**
 * Create a Stripe Checkout session for buying a token package.
 * The server looks up the real price + token amount by index (and
 * applies any active promo) -- nothing money-related is sent from here.
 */
export async function createTokenCheckout(
  userId: string,
  packageIndex: number,
  returnRoomId?: string
): Promise<{ url: string | null }> {
  if (!TOKEN_PACKAGES[packageIndex]) throw new Error('Invalid package')

  const response = await fetch('/api/stripe-create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'tokens',
      userId,
      packageIndex,
      returnRoomId,
    }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to create checkout')
  }
  const data = await response.json()
  return { url: data.checkoutUrl }
}

function getTierNameForAmount(amount: number): string {
  const tierMap: { [key: number]: string } = {
    1: 'Say Hi',
    5: 'Wave',
    10: 'Gift',
    25: 'Love',
    50: 'Fire',
  }
  return tierMap[amount] || 'Tip'
}

/**
 * Calculate total tokens including bonus
 */
export function calculateTokens(packageIndex: number): number {
  const pkg = TOKEN_PACKAGES[packageIndex]
  return pkg ? pkg.tokens : 0
}

/**
 * Cheapest package whose total tokens covers a given shortfall --
 * used to pre-select a bundle in low-balance upsell prompts.
 */
export function cheapestPackageCovering(neededTokens: number): number {
  const idx = TOKEN_PACKAGES.findIndex((p) => p.tokens >= neededTokens)
  return idx === -1 ? TOKEN_PACKAGES.length - 1 : idx
}
