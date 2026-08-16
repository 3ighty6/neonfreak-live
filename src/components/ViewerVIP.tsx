import { useState, useEffect } from 'react'
import { Crown, Loader2, Check } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function ViewerVIP({ userId }: { userId: string }) {
  const [isVip, setIsVip] = useState(false)
  const [periodEnd, setPeriodEnd] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('viewer_vip_subscriptions')
      .select('status, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()
      .then(({ data }) => {
        setIsVip(!!data)
        setPeriodEnd(data?.current_period_end || null)
        setLoading(false)
      })
  }, [userId])

  const subscribe = async () => {
    setError('')
    setSubscribing(true)
    try {
      const res = await fetch('/api/stripe-create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'viewer_vip', userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
      window.location.href = data.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubscribing(false)
    }
  }

  if (loading) return null

  return (
    <div className="bg-gray-900 border border-amber-500/30 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
        <Crown size={18} className="text-amber-400" />
        NeonLights VIP
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Animated stream previews on hover, a VIP badge in chat, and priority in future perks — $19.99/mo.
      </p>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-sm">{error}</div>}

      {isVip ? (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300 text-sm flex items-center gap-2">
          <Check size={16} />
          Active{periodEnd && ` — renews ${new Date(periodEnd).toLocaleDateString()}`}
        </div>
      ) : (
        <button
          onClick={subscribe}
          disabled={subscribing}
          className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:opacity-90 disabled:opacity-50 text-black px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2"
        >
          {subscribing ? <Loader2 className="animate-spin" size={16} /> : <Crown size={16} />}
          {subscribing ? 'Redirecting...' : 'Become VIP'}
        </button>
      )}
    </div>
  )
}
