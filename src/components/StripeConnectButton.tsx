import { useState, useEffect } from 'react'
import { DollarSign, Check, Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface StripeConnectButtonProps {
  userId: string
}

export default function StripeConnectButton({ userId }: StripeConnectButtonProps) {
  const [onboarded, setOnboarded] = useState(false)
  const [checking, setChecking] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkStatus()
  }, [userId])

  const checkStatus = async () => {
    setChecking(true)
    try {
      const res = await fetch(`/api/stripe-connect-status?userId=${userId}`)
      const data = await res.json()
      if (res.ok) setOnboarded(!!data.onboarded)
    } catch {
      // silently fall through to "not connected" state
    } finally {
      setChecking(false)
    }
  }

  const handleConnect = async () => {
    setError('')
    setConnecting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const res = await fetch('/api/stripe-connect-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: user?.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start onboarding')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start onboarding')
      setConnecting(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="text-green-400" size={24} />
          <div>
            <h3 className="font-semibold">Payout Settings</h3>
            <p className="text-sm text-gray-400">Get paid for tips and token earnings</p>
          </div>
        </div>
        {checking ? (
          <Loader2 className="animate-spin text-gray-400" size={20} />
        ) : onboarded ? (
          <div className="flex items-center gap-2 text-green-400">
            <Check size={20} />
            <span className="text-sm font-semibold">Active</span>
          </div>
        ) : null}
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {onboarded ? (
        <div className="bg-green-500/10 border border-green-500/30 rounded p-4 text-sm text-green-300">
          ✅ Payouts enabled! Stripe automatically sends your earnings to your bank account.
        </div>
      ) : (
        <>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-4 text-sm text-yellow-300 mb-4">
            Connect a Stripe account to receive payouts. Takes about 2 minutes.
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting || checking}
            className="w-full bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 disabled:opacity-50 text-white py-2 rounded font-semibold transition flex items-center justify-center gap-2"
          >
            {connecting ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Redirecting...
              </>
            ) : (
              <>
                Connect with Stripe <ArrowRight size={18} />
              </>
            )}
          </button>
        </>
      )}

      <p className="text-xs text-gray-500 mt-4">
        Powered by Stripe Connect. Your banking details are handled entirely by Stripe.
      </p>
    </div>
  )
}
