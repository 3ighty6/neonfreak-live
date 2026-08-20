import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { Disc3, Gift, ShieldAlert } from 'lucide-react'
import { supabase } from '../supabaseClient'
import RouletteGame from '../components/RouletteGame'
import SlotMachineGame from '../components/SlotMachineGame'
import NeonChip from '../components/NeonChip'

export default function CasinoPage({ session }: { session: Session }) {
  const [tab, setTab] = useState<'roulette' | 'slots'>('roulette')
  const [balance, setBalance] = useState<number | null>(null)
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [claimMsg, setClaimMsg] = useState('')

  const todayStr = new Date().toISOString().slice(0, 10)
  const alreadyClaimedToday = lastClaimDate === todayStr

  const load = async () => {
    const { data } = await supabase.from('users').select('lotto_token_balance, last_lotto_claim_date').eq('id', session.user.id).single()
    setBalance(data?.lotto_token_balance ?? 0)
    setLastClaimDate(data?.last_lotto_claim_date ?? null)
  }

  useEffect(() => {
    load()
  }, [session.user.id])

  const claimDaily = async () => {
    if (claiming || alreadyClaimedToday) return
    setClaiming(true)
    setClaimMsg('')
    const { data, error } = await supabase.rpc('claim_daily_lotto_tokens')
    setClaiming(false)
    if (error) {
      setClaimMsg(error.message.includes('Already claimed') ? "Already claimed today — come back tomorrow" : 'Something went wrong')
    } else {
      setClaimMsg(`+${data.tokensAwarded} free lotto tokens!`)
      load()
    }
  }

  if (balance === null) return <div className="p-8 text-center text-gray-400">Loading...</div>

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-3xl font-black text-white">
          NeonLights <span className="neon-text">Casino</span>
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-700 pl-2 pr-3 py-1 rounded-full">
            <NeonChip size={28} />
            <span className="font-bold text-white text-sm">{balance}</span>
          </div>
          <button
            onClick={claimDaily}
            disabled={claiming || alreadyClaimedToday}
            title={alreadyClaimedToday ? 'Already claimed today' : 'Claim your free daily lotto tokens'}
            className={`transition ${alreadyClaimedToday ? 'text-gray-600' : 'text-gray-400 hover:text-yellow-300'}`}
          >
            <Gift size={20} className={alreadyClaimedToday ? '' : 'neon-icon-glow'} />
          </button>
        </div>
      </div>

      {claimMsg && <div className="text-xs text-yellow-300 mb-3 text-right">{claimMsg}</div>}

      <div className="glass-panel-glow rounded-xl p-3 mb-6 flex items-start gap-2">
        <ShieldAlert size={16} className="text-yellow-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-snug text-gray-400">
          Lotto Tokens are a <strong className="text-gray-300">completely separate, free currency</strong> — not
          real tokens, no purchase necessary, no cash value, and never redeemable or exchangeable for tokens or
          money in either direction. Claim a free daily allowance below. Play is 18+ only, for entertainment,
          fun, and bragging rights on the leaderboard — please play responsibly.
        </p>
      </div>

      {balance === 0 && !alreadyClaimedToday && (
        <button
          onClick={claimDaily}
          disabled={claiming}
          className="w-full mb-6 bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 disabled:opacity-50 text-white py-3 rounded-full font-bold transition"
        >
          {claiming ? 'Claiming...' : 'Claim Free Lotto Tokens'}
        </button>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('roulette')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold transition ${
            tab === 'roulette' ? 'bg-gradient-to-r from-pink-600 to-cyan-600 text-white' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
          }`}
        >
          <Disc3 size={16} /> Roulette
        </button>
        <button
          onClick={() => setTab('slots')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold transition ${
            tab === 'slots' ? 'bg-gradient-to-r from-pink-600 to-cyan-600 text-white' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
          }`}
        >
          🍒 Slots
        </button>
      </div>

      {tab === 'roulette' ? (
        <RouletteGame userId={session.user.id} balance={balance} onBalanceChange={setBalance} />
      ) : (
        <SlotMachineGame userId={session.user.id} balance={balance} onBalanceChange={setBalance} />
      )}
    </div>
  )
}
