/**
 * Stripe Integration for Neon Chat
 * Handles payments + Stripe Connect for creator payouts
 */

import { loadStripe } from '@stripe/stripe-js'

export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || ''

export const stripe = loadStripe(STRIPE_PUBLIC_KEY)

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
 * Create a Stripe Checkout session for tipping
 */
export async function createTipCheckout(
  creatorId: string,
  tipAmount: number,
  userId: string
): Promise<{ url: string | null }> {
  const response = await fetch('/api/stripe/create-tip-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creatorId,
      amount: tipAmount,
      userId,
    }),
  })

  if (!response.ok) throw new Error('Failed to create checkout session')
  return response.json()
}

/**
 * Create a Stripe Checkout session for token purchase
 */
export async function createTokenCheckout(
  userId: string,
  packageIndex: number
): Promise<{ url: string | null }> {
  const pkg = TOKEN_PACKAGES[packageIndex]
  if (!pkg) throw new Error('Invalid package')

  const response = await fetch('/api/stripe/create-token-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      tokens: pkg.tokens,
      bonus: pkg.bonus,
      amount: pkg.priceCents,
    }),
  })

  if (!response.ok) throw new Error('Failed to create token checkout')
  return response.json()
}

/**
 * Get Stripe Connect onboarding link for creator
 */
export async function createConnectOnboarding(userId: string): Promise<{ url: string }> {
  const response = await fetch('/api/stripe/create-connect-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  if (!response.ok) throw new Error('Failed to create onboarding link')
  return response.json()
}

/**
 * Get creator's connected account status
 */
export async function getCreatorConnectStatus(userId: string): Promise<{
  connected: boolean
  accountId: string | null
  email: string | null
}> {
  const response = await fetch(`/api/stripe/connect-status?userId=${userId}`)

  if (!response.ok) throw new Error('Failed to fetch connect status')
  return response.json()
}

/**
 * Get creator's pending balance
 */
export async function getCreatorBalance(creatorId: string): Promise<{
  pending: number
  available: number
}> {
  const response = await fetch(`/api/stripe/creator-balance?creatorId=${creatorId}`)

  if (!response.ok) return { pending: 0, available: 0 }
  return response.json()
}

/**
 * Calculate total tokens including bonus
 */
export function calculateTokens(packageIndex: number): number {
  const pkg = TOKEN_PACKAGES[packageIndex]
  return pkg ? pkg.tokens + pkg.bonus : 0
}
