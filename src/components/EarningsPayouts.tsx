import { useState, useEffect } from 'react'
import { DollarSign, ArrowDownToLine, Loader2, CheckCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import StripeConnectButton from './StripeConnectButton'

interface PayoutRow {
  id: string
  amount_usd: number
  status: string
  created_at: string
}

export default function EarningsPayouts({ userId }: { userId: string }) {
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [onboarded, setOnboarded] = useState(false)
  const [checkingOnboarded, setCheckingOnboarded] = useState(true)
  const [cashingOut, setCashingOut] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    const [{ data: user }, { data: payoutRows }, statusRes] = await Promise.all([
      supabase.from('users').select('total_earnings').eq('id', userId).single(),
      supabase.from('payouts').select('id, amount_usd, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
      fetch(`/api/stripe-connect-status?userId=${userId}`).then((r) => r.json()).catch(() => ({ onboarded: false })),
    ])
    setTotalEarnings(Number(user?.total_earnings || 0))
    setPayouts(payoutRows || [])
    setOnboarded(!!statusRes.onboarded)
    setCheckingOnboarded(false)
  }

  useEffect(() => {
    load()
  }, [userId])

  const alreadyPaidOut = payouts
    .filter((p) => p.status === 'pending' || p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount_usd), 0)
  const available = Math.max(0, totalEarnings - alreadyPaidOut)

  const cashOut = async () => {
    setError('')
    setMessage('')
    setCashingOut(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/request-payout', {
        method: 'POST',
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payout failed')
      setMessage(`✅ $${data.amount.toFixed(2)} sent to your bank account.`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setCashingOut(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <DollarSign size={18} className="text-green-400" />
        Earnings & Payouts
      </h2>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-sm">{error}</div>}
      {message && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded text-green-300 text-sm">{message}</div>}

      {checkingOnboarded ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : !onboarded ? (
        <StripeConnectButton userId={userId} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-400">Available to cash out</div>
              <div className="text-2xl font-bold text-green-400">${available.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Lifetime earnings</div>
              <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            </div>
          </div>

          <button
            onClick={cashOut}
            disabled={cashingOut || available < 10}
            className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 shadow-lg shadow-green-500/20 disabled:opacity-50 text-white px-4 py-2 rounded font-semibold transition flex items-center gap-2"
          >
            {cashingOut ? <Loader2 className="animate-spin" size={18} /> : <ArrowDownToLine size={18} />}
            {cashingOut ? 'Processing...' : 'Cash Out'}
          </button>
          {available < 10 && (
            <p className="text-xs text-gray-500 mt-2">$10 minimum to cash out.</p>
          )}

          {payouts.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Payout History</h3>
              <div className="space-y-2">
                {payouts.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-sm bg-gray-800 rounded px-3 py-2">
                    <div className="flex items-center gap-2">
                      {p.status === 'completed' && <CheckCircle size={14} className="text-green-400" />}
                      <span>{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="font-semibold">${Number(p.amount_usd).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
