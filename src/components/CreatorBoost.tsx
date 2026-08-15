import { useState, useEffect } from 'react'
import { Rocket, Star, Crown, Loader2, Check } from 'lucide-react'
import { supabase } from '../supabaseClient'

const TIERS = [
  { id: 'boost', label: 'Boost', price: '$9.99/mo', icon: Rocket, description: 'Higher placement in the discovery feed.' },
  { id: 'featured', label: 'Featured', price: '$24.99/mo', icon: Star, description: 'Top placement, plus rotating platform-wide special features as they come up.' },
  { id: 'elite', label: 'Elite', price: '$99.99/mo', icon: Crown, description: 'Everything in Featured, plus first eligibility for every new promotional feature as it launches.' },
]

export default function CreatorBoost({ userId }: { userId: string }) {
  const [current, setCurrent] = useState<{ tier: string; status: string; current_period_end: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    const { data } = await supabase
      .from('creator_subscriptions')
      .select('tier, status, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()
    setCurrent(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [userId])

  const subscribe = async (tier: string) => {
    setError('')
    setSubscribing(tier)
    try {
      const res = await fetch('/api/stripe-create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'creator_subscription', userId, tier }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
      window.location.href = data.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubscribing(null)
    }
  }

  if (loading) return null

  return (
    <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
        <Rocket size={18} className="text-purple-400" />
        Promote Your Profile
      </h2>
      <p className="text-sm text-gray-400 mb-4">Monthly platform promotion — separate from tips and payouts.</p>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-sm">{error}</div>}

      {current && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded text-green-300 text-sm flex items-center gap-2">
          <Check size={16} />
          Active: {current.tier === 'featured' ? 'Featured' : 'Boost'}
          {current.current_period_end && ` — renews ${new Date(current.current_period_end).toLocaleDateString()}`}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-3">
        {TIERS.map((t) => {
          const Icon = t.icon
          const isCurrent = current?.tier === t.id
          return (
            <div key={t.id} className={`border rounded-lg p-4 ${isCurrent ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700 bg-gray-800'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={18} className={t.id === 'elite' ? 'text-amber-400' : t.id === 'featured' ? 'text-yellow-400' : 'text-cyan-400'} />
                <span className="font-semibold">{t.label}</span>
                <span className="ml-auto text-sm text-gray-400">{t.price}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{t.description}</p>
              <button
                onClick={() => subscribe(t.id)}
                disabled={isCurrent || subscribing !== null}
                className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white py-1.5 rounded text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                {subscribing === t.id ? <Loader2 className="animate-spin" size={14} /> : null}
                {isCurrent ? 'Active' : subscribing === t.id ? 'Redirecting...' : 'Subscribe'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
