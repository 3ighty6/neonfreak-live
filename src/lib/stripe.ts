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

// Token packages (prices in cents)
export const TOKEN_PACKAGES = [
  { tokens: 10, priceCents: 99, bonus: 0, popular: false, priceUSD: 0.99 },
  { tokens: 50, priceCents: 499, bonus: 5, popular: false, priceUSD: 4.99 },
  { tokens: 100, priceCents: 999, bonus: 20, popular: true, priceUSD: 9.99 },
  { tokens: 500, priceCents: 3999, bonus: 150, popular: false, priceUSD: 39.99 },
  { tokens: 1000, priceCents: 6999, bonus: 300, popular: false, priceUSD: 69.99 },
  { tokens: 5000, priceCents: 29999, bonus: 2000, popular: false, priceUSD: 299.99 },
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
 */
export async function createTokenCheckout(
  userId: string,
  packageIndex: number
): Promise<{ url: string | null }> {
  const pkg = TOKEN_PACKAGES[packageIndex]
  if (!pkg) throw new Error('Invalid package')

  const response = await fetch('/api/stripe-create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'tokens',
      userId,
      amountUsdCents: pkg.priceCents,
      tokens: pkg.tokens + pkg.bonus,
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
  return pkg ? pkg.tokens + pkg.bonus : 0
}
