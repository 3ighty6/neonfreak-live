/**
 * Paddle Integration for Neon Chat
 * Handles payments for tips and token purchases
 */

// Paddle configuration
export const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN || ''
export const PADDLE_VENDOR_ID = import.meta.env.VITE_PADDLE_VENDOR_ID || ''

// Tip products
export const TIP_PRODUCTS = {
  say_hi: { id: 'tip_1', amount: 100, emoji: '💬', label: 'Say Hi', usd: 1 },
  wave: { id: 'tip_5', amount: 500, emoji: '👋', label: 'Wave', usd: 5 },
  gift: { id: 'tip_10', amount: 1000, emoji: '🎁', label: 'Gift', usd: 10 },
  love: { id: 'tip_25', amount: 2500, emoji: '❤️', label: 'Love', usd: 25 },
  fire: { id: 'tip_50', amount: 5000, emoji: '🔥', label: 'Fire', usd: 50 },
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
 * Create a Paddle Checkout for tipping
 */
export async function createTipCheckout(
  creatorId: string,
  tipAmount: number,
  userId: string
): Promise<{ url: string | null }> {
  const response = await fetch('/api/paddle-create-tip-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creatorId,
      amount: tipAmount * 100, // Convert to cents
      tierName: getTierNameForAmount(tipAmount),
    }),
  })

  if (!response.ok) throw new Error('Failed to create checkout')
  const data = await response.json()
  return { url: data.checkoutUrl }
}

/**
 * Create a Paddle Checkout for token purchase
 */
export async function createTokenCheckout(
  userId: string,
  packageIndex: number
): Promise<{ url: string | null }> {
  const pkg = TOKEN_PACKAGES[packageIndex]
  if (!pkg) throw new Error('Invalid package')

  const response = await fetch('/api/paddle-create-tip-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creatorId: userId,
      amount: pkg.priceCents,
      tierName: `${pkg.tokens} Tokens`,
    }),
  })

  if (!response.ok) throw new Error('Failed to create checkout')
  const data = await response.json()
  return { url: data.checkoutUrl }
}

/**
 * Helper function to map tip amount to tier name
 */
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
