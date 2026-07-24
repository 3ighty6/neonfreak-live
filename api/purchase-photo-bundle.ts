/**
 * Vercel API Route: /api/purchase-photo-bundle
 * Creates Paddle checkout for photo bundle purchase
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const PADDLE_API_KEY = process.env.PADDLE_API_KEY || ''
const PADDLE_VENDOR_ID = process.env.PADDLE_VENDOR_ID || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { creatorId, bundleId, amount } = req.body

  if (!creatorId || !bundleId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const response = await fetch('https://api.paddle.com/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PADDLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            price_id: `photo_bundle_${bundleId}`,
            quantity: 1,
          },
        ],
        custom_data: {
          creatorId,
          bundleId,
          type: 'photo_bundle',
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Paddle error:', error)
      return res.status(response.status).json({ error: 'Failed to create checkout' })
    }

    const data = await response.json()

    res.json({
      checkoutUrl: `https://checkout.paddle.com/${data.id}`,
      transactionId: data.id,
      amount,
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to create checkout' })
  }
}
