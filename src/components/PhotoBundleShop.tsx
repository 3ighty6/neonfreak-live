import { useState } from 'react'
import { ShoppingBag, Lock } from 'lucide-react'

interface PhotoBundle {
  id: string
  name: string
  price: number
  photoCount: number
  description: string
  preview?: string
}

interface PhotoBundleShopProps {
  creatorId: string
  creatorName: string
  bundles?: PhotoBundle[]
}

export default function PhotoBundleShop({
  creatorId,
  creatorName,
  bundles = [
    {
      id: '1',
      name: 'Starter Pack',
      price: 5,
      photoCount: 5,
      description: 'Introduction collection',
    },
    {
      id: '2',
      name: 'Fan Favorite',
      price: 12,
      photoCount: 15,
      description: 'Most popular selection',
    },
    {
      id: '3',
      name: 'Premium Collection',
      price: 25,
      photoCount: 50,
      description: 'Exclusive high-quality photos',
    },
    {
      id: '4',
      name: 'VIP Bundle',
      price: 50,
      photoCount: 150,
      description: 'Complete premium access',
    },
  ],
}: PhotoBundleShopProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleBundlePurchase = async (bundle: PhotoBundle) => {
    setLoading(bundle.id)
    try {
      const response = await fetch('/api/purchase-photo-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId,
          bundleId: bundle.id,
          amount: bundle.price * 100, // Convert to cents
        }),
      })

      if (!response.ok) {
        throw new Error('Purchase failed')
      }

      const data = await response.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (error) {
      alert(`Failed to purchase: ${error}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingBag className="text-cyan-400" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-cyan-400">
            {creatorName}'s Photo Collections
          </h2>
          <p className="text-gray-400 text-sm">Exclusive photos from your favorite creator</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {bundles.map((bundle) => (
          <div
            key={bundle.id}
            className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-cyan-500/50 rounded-lg p-6 transition group"
          >
            {/* Preview */}
            {bundle.preview && (
              <div className="relative mb-4 rounded overflow-hidden h-40 bg-black">
                <img
                  src={bundle.preview}
                  alt={bundle.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition" />
              </div>
            )}

            {/* Content */}
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white mb-1">{bundle.name}</h3>
              <p className="text-sm text-gray-400 mb-3">{bundle.description}</p>

              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold text-cyan-400">${bundle.price}</span>
                <span className="text-sm text-gray-400">/bundle</span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <Lock size={16} />
                <span className="text-sm">{bundle.photoCount} exclusive photos</span>
              </div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={() => handleBundlePurchase(bundle)}
              disabled={loading === bundle.id}
              className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <ShoppingBag size={18} />
              {loading === bundle.id ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded text-sm text-gray-300">
        <p className="font-semibold text-cyan-400 mb-2">💾 Instant Access</p>
        <p>
          Purchase once, download anytime. Photos are stored securely in your account.
        </p>
      </div>
    </div>
  )
}
