import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { Disc3, Cherry } from 'lucide-react'
import { supabase } from '../supabaseClient'
import RouletteGame from '../components/RouletteGame'
import SlotMachineGame from '../components/SlotMachineGame'
import NeonChip from '../components/NeonChip'

export default function CasinoPage({ session }: { session: Session }) {
  const [tab, setTab] = useState<'roulette' | 'slots'>('roulette')
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('users').select('token_balance').eq('id', session.user.id).single()
      setBalance(data?.token_balance ?? 0)
    }
    load()
  }, [session.user.id])

  if (balance === null) return <div className="p-8 text-center text-gray-400">Loading...</div>

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black text-white">
          NeonLights <span className="neon-text">Casino</span>
        </h1>
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-700 pl-2 pr-3 py-1 rounded-full">
          <NeonChip size={28} />
          <span className="font-bold text-white text-sm">{balance}</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-6">
        Tokens only — winnings and losses stay in-platform, no cash-out. Play responsibly.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('roulette')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold transition ${
            tab === 'roulette' ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Disc3 size={16} /> Roulette
        </button>
        <button
          onClick={() => setTab('slots')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold transition ${
            tab === 'slots' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Cherry size={16} /> Slots
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
