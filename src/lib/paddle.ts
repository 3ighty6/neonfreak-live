/**
 * Paddle Payment Integration for Neon Chat
 * Handles tip processing and token purchases
 */

export const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN || ''

// Tip amounts and their pricing (USD)
export const TIP_PRODUCTS = {
  say_hi: { id: 'tip_say_hi', amount: 1, emoji: '💬', label: 'Say Hi' },
  wave: { id: 'tip_wave', amount: 5, emoji: '👋', label: 'Wave' },
  gift: { id: 'tip_gift', amount: 10, emoji: '🎁', label: 'Gift' },
  love: { id: 'tip_love', amount: 25, emoji: '❤️', label: 'Love' },
  fire: { id: 'tip_fire', amount: 50, emoji: '🔥', label: 'Fire' },
}

// Token packages
export const TOKEN_PACKAGES = [
  { tokens: 10, priceUSD: 0.99, bonus: 0, popular: false },
  { tokens: 50, priceUSD: 4.99, bonus: 5, popular: false },
  { tokens: 100, priceUSD: 9.99, bonus: 20, popular: true },
  { tokens: 500, priceUSD: 39.99, bonus: 150, popular: false },
  { tokens: 1000, priceUSD: 69.99, bonus: 300, popular: false },
  { tokens: 5000, priceUSD: 299.99, bonus: 2000, popular: false },
]

export function initPaddle() {
  if (typeof window !== 'undefined') {
    const script = document.createElement('script')
    script.src = 'https://cdn.paddle.com/paddle/v2/checkout.js'
    script.async = true
    document.head.appendChild(script)
  }
}

export function calculateTokens(packageIndex: number): number {
  const pkg = TOKEN_PACKAGES[packageIndex]
  return pkg ? pkg.tokens + pkg.bonus : 0
}
