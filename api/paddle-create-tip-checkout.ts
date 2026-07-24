/**
 * Vercel API Route: /api/paddle-create-tip-checkout
 * Creates a Paddle checkout for tipping creators
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const PADDLE_VENDOR_ID = process.env.PADDLE_VENDOR_ID || ''
const PADDLE_API_KEY = process.env.PADDLE_API_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { creatorId, amount, tierName } = req.body

  if (!creatorId || !amount) {
    return res.status(400).json({ error: 'Missing creatorId or amount' })
  }

  if (!PADDLE_VENDOR_ID || !PADDLE_API_KEY) {
    return res.status(500).json({ error: 'Paddle not configured' })
  }

  try {
    // Create transaction via Paddle API
    const response = await fetch('https://api.paddle.com/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PADDLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            price_id: getPriceIdForAmount(amount),
            quantity: 1,
          },
        ],
        customer_id: creatorId,
        custom_data: {
          tier: tierName,
          type: 'tip',
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Paddle error:', error)
      return res.status(response.status).json({ error: 'Failed to create checkout' })
    }

    const data = await response.json()
    
    // Return checkout URL or transaction details
    res.json({
      checkoutUrl: `https://checkout.paddle.com/${data.id}`,
      transactionId: data.id,
      amount,
      status: 'pending',
    })
  } catch (error) {
    console.error('Error creating checkout:', error)
    res.status(500).json({ error: 'Failed to create checkout' })
  }
}

// Helper to map amounts to Paddle price IDs
function getPriceIdForAmount(amount: number): string {
  const priceMap: { [key: number]: string } = {
    10: 'pri_01ky8... ', // $10 tip
    25: 'pri_01ky8... ', // $25 tip
    50: 'pri_01ky8... ', // $50 tip
    100: 'pri_01ky8...',  // $100 tip
  }
  return priceMap[amount] || 'pri_01ky8...' // Default price ID
}
