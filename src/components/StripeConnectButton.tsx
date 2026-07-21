import { useState } from 'react'
import { DollarSign, Check } from 'lucide-react'
import { createConnectOnboarding } from '../lib/stripe'

interface StripeConnectButtonProps {
  userId: string
}

export default function StripeConnectButton({ userId }: StripeConnectButtonProps) {
  const [loading, setLoading] = useState(false)
  const [connected] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    try {
      const { url } = await createConnectOnboarding(userId)
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to start onboarding')
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="text-green-400" size={24} />
          <div>
            <h3 className="font-semibold">Connect Your Bank</h3>
            <p className="text-sm text-gray-400">Get paid directly to your Chime account</p>
          </div>
        </div>
        {connected && (
          <div className="flex items-center gap-2 text-green-400">
            <Check size={20} />
            <span className="text-sm font-semibold">Connected</span>
          </div>
        )}
      </div>

      {!connected ? (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-3 rounded font-semibold transition"
        >
          {loading ? 'Redirecting...' : 'Connect Stripe'}
        </button>
      ) : (
        <div className="bg-green-500/10 border border-green-500/30 rounded p-4 text-sm text-green-300">
          ✅ Your account is connected! Tips will be sent directly to your bank account.
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        We use Stripe Connect to securely send you earnings. Your banking info stays private.
      </p>
    </div>
  )
}
