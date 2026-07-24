import { DollarSign, Check } from 'lucide-react'

interface StripeConnectButtonProps {
  userId: string
}

export default function StripeConnectButton({ userId }: StripeConnectButtonProps) {
  const connected = true // Paddle auto-handles payouts

  return (
    <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="text-green-400" size={24} />
          <div>
            <h3 className="font-semibold">Payout Settings</h3>
            <p className="text-sm text-gray-400">Earnings automatically sent to you</p>
          </div>
        </div>
        {connected && (
          <div className="flex items-center gap-2 text-green-400">
            <Check size={20} />
            <span className="text-sm font-semibold">Active</span>
          </div>
        )}
      </div>

      <div className="bg-green-500/10 border border-green-500/30 rounded p-4 text-sm text-green-300">
        ✅ Payouts enabled! Paddle automatically sends your earnings to your account on file.
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Powered by Paddle. All tips go directly to your registered account securely.
      </p>
    </div>
  )
}
