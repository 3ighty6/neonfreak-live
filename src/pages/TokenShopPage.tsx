import { Zap, Gift } from 'lucide-react'

const PACKAGES = [
  { tokens: 10, price: 0.99, bonus: 0 },
  { tokens: 50, price: 4.99, bonus: 5 },
  { tokens: 100, price: 9.99, bonus: 20 },
  { tokens: 500, price: 39.99, bonus: 150 },
  { tokens: 1000, price: 69.99, bonus: 300 },
  { tokens: 5000, price: 299.99, bonus: 2000 },
]

export default function TokenShopPage({ userId: _userId }: { userId: string }) {
  const handlePurchase = (tokens: number, price: number) => {
    // TODO: Integrate Stripe
    alert(`Purchase ${tokens} tokens for $${price} - Stripe integration coming soon`)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black mb-2">Buy Tokens</h1>
          <p className="text-gray-400">Support your favorite streamers with tips and gifts</p>
        </div>

        {/* Current Balance */}
        <div className="bg-gradient-to-r from-cyan-600/30 to-purple-600/30 border border-cyan-500/50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Your Balance</p>
              <div className="text-4xl font-black text-cyan-400 flex items-center gap-2">
                <Zap size={32} />
                1,250
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm mb-2">≈ USD Value</p>
              <p className="text-3xl font-bold text-white">$12.50</p>
            </div>
          </div>
        </div>

        {/* Token Packages */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Choose Your Package</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PACKAGES.map((pkg, i) => (
              <div key={i} className={`border rounded-lg p-6 transition hover:scale-105 ${pkg.bonus > 0 ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-purple-500/50' : 'bg-black/50 border-gray-700 hover:border-cyan-500'}`}>
                {pkg.bonus > 0 && (
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-4 w-fit">
                    +{pkg.bonus} Bonus
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">Get</p>
                  <p className="text-3xl font-black text-cyan-400">{pkg.tokens + pkg.bonus}</p>
                  <p className="text-xs text-gray-500">{pkg.tokens} + {pkg.bonus} bonus</p>
                </div>
                <button
                  onClick={() => handlePurchase(pkg.tokens, pkg.price)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg font-bold transition"
                >
                  ${pkg.price.toFixed(2)}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-black/50 border border-gray-800 rounded-lg p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Gift size={20} /> How It Works
          </h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>• Buy tokens and use them to tip streamers</li>
            <li>• Each token = $0.01 USD value</li>
            <li>• Streamers earn 50% of all tips</li>
            <li>• Bonuses are extra tokens at no charge</li>
            <li>• Tokens never expire</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
