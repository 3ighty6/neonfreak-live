import { useState } from 'react'
import { Heart, Zap } from 'lucide-react'
import { TIP_PRODUCTS, TOKEN_PACKAGES, calculateTokens, createTipCheckout, createTokenCheckout } from '../lib/stripe'

export default function TipPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleTip = async (tipKey: keyof typeof TIP_PRODUCTS) => {
    const tip = TIP_PRODUCTS[tipKey]
    setLoading(tipKey)
    try {
      // In real app, would get creatorId and userId from context
      const creatorId = 'example-creator'
      const userId = 'current-user'
      
      const { url } = await createTipCheckout(creatorId, tip.amount, userId)
      if (url) window.location.href = url
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to process tip')
    } finally {
      setLoading(null)
    }
  }

  const handleTokenPurchase = async (packageIndex: number) => {
    setLoading(`token-${packageIndex}`)
    try {
      // In real app, would get userId from context
      const userId = 'current-user'
      
      const { url } = await createTokenCheckout(userId, packageIndex)
      if (url) window.location.href = url
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to process payment')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
          Support Your Favorite Creators
        </h1>
        <p className="text-gray-400 mb-8">Send tips and purchase tokens with Paddle</p>

        {/* Quick Tips */}
        <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Heart className="text-red-500" size={28} />
            Send a Tip
          </h2>
          <p className="text-gray-400 mb-6">Show your love with quick tips during streams:</p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(TIP_PRODUCTS).map(([key, tip]) => (
              <button
                key={key}
                onClick={() => handleTip(key as keyof typeof TIP_PRODUCTS)}
                disabled={loading === key}
                className="bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 rounded-lg p-4 text-center transition transform hover:scale-105"
              >
                <div className="text-3xl mb-2">{tip.emoji}</div>
                <div className="text-sm font-semibold mb-1">{tip.label}</div>
                <div className="text-lg font-bold">${tip.usd}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded text-sm text-gray-300">
            <strong>💡 Pro tip:</strong> Tips go directly to creators! 70% of your tip goes to them, 30% supports Neon Chat.
          </div>
        </div>

        {/* Token Packages */}
        <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Zap className="text-yellow-400" size={28} />
            Get Tokens
          </h2>
          <p className="text-gray-400 mb-6">Purchase tokens to unlock premium features:</p>

          <div className="grid md:grid-cols-2 gap-4">
            {TOKEN_PACKAGES.map((pkg, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-lg border transition ${
                  pkg.popular
                    ? 'bg-cyan-500/10 border-cyan-500/50 ring-2 ring-cyan-500/30'
                    : 'bg-gray-800 border-gray-700 hover:border-cyan-500/30'
                }`}
              >
                {pkg.popular && (
                  <div className="inline-block bg-cyan-600 text-white px-3 py-1 rounded-full text-xs font-semibold mb-3">
                    POPULAR
                  </div>
                )}

                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-3xl font-bold text-cyan-400">{pkg.tokens}</div>
                    <div className="text-sm text-gray-400">base tokens</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${pkg.priceUSD.toFixed(2)}</div>
                  </div>
                </div>

                {pkg.bonus > 0 && (
                  <div className="bg-green-500/20 border border-green-500/30 rounded px-3 py-2 text-sm text-green-300 mb-4">
                    + {pkg.bonus} bonus tokens! 🎁
                  </div>
                )}

                <div className="text-sm text-gray-400 mb-4">
                  <strong>Total:</strong> {calculateTokens(idx)} tokens
                </div>

                <button
                  onClick={() => handleTokenPurchase(idx)}
                  disabled={loading === `token-${idx}`}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white py-2 rounded font-semibold transition"
                >
                  {loading === `token-${idx}` ? 'Processing...' : 'Buy Now'}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded text-sm text-gray-300">
            <strong>🔒 Secure:</strong> Powered by Paddle, a secure global payment processor. All transactions are encrypted and safe.
          </div>
        </div>
      </div>
    </div>
  )
}
