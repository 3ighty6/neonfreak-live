import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { Disc3, ArrowRightLeft, ShieldAlert } from 'lucide-react'
import { supabase } from '../supabaseClient'
import RouletteGame from '../components/RouletteGame'
import SlotMachineGame from '../components/SlotMachineGame'
import NeonChip from '../components/NeonChip'

export default function CasinoPage({ session }: { session: Session }) {
  const [tab, setTab] = useState<'roulette' | 'slots'>('roulette')
  const [chipBalance, setChipBalance] = useState<number | null>(null)
  const [tokenBalance, setTokenBalance] = useState<number | null>(null)
  const [showConvert, setShowConvert] = useState(false)
  const [convertAmount, setConvertAmount] = useState(50)
  const [converting, setConverting] = useState(false)
  const [convertError, setConvertError] = useState('')

  const load = async () => {
    const { data } = await supabase.from('users').select('casino_chip_balance, token_balance').eq('id', session.user.id).single()
    setChipBalance(data?.casino_chip_balance ?? 0)
    setTokenBalance(data?.token_balance ?? 0)
  }

  useEffect(() => {
    load()
  }, [session.user.id])

  const doConvert = async () => {
    if (converting || convertAmount < 1 || (tokenBalance !== null && convertAmount > tokenBalance)) return
    setConverting(true)
    setConvertError('')
    const { error } = await supabase.rpc('convert_tokens_to_chips', { p_amount: convertAmount })
    setConverting(false)
    if (error) {
      setConvertError(error.message)
      return
    }
    setShowConvert(false)
    load()
  }

  if (chipBalance === null) return <div className="p-8 text-center text-gray-400">Loading...</div>

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-3xl font-black text-white">
          NeonLights <span className="neon-text">Casino</span>
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-700 pl-2 pr-3 py-1 rounded-full">
            <NeonChip size={28} />
            <span className="font-bold text-white text-sm">{chipBalance}</span>
          </div>
          <button
            onClick={() => setShowConvert(true)}
            title="Convert tokens to chips"
            className="text-gray-400 hover:text-cyan-300 transition"
          >
            <ArrowRightLeft size={18} />
          </button>
        </div>
      </div>

      <div className="glass-panel-glow rounded-xl p-3 mb-6 flex items-start gap-2">
        <ShieldAlert size={16} className="text-yellow-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-snug text-gray-400">
          Casino chips are a <strong className="text-gray-300">separate balance</strong> from your NeonLights tokens.
          Chips have no cash value, can't be redeemed, transferred, or converted back to tokens, and exist purely
          for in-app play, fun, and bragging rights on the leaderboard. Converting tokens to chips is final. Casino
          play is 18+ only and offered for entertainment purposes — please play responsibly.
        </p>
      </div>

      {showConvert && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowConvert(false)}>
          <div className="bg-gray-900 border border-cyan-500/30 rounded-lg w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1">Convert Tokens → Chips</h2>
            <p className="text-xs text-gray-500 mb-4">1 token = 1 chip. This can't be undone — chips don't convert back.</p>
            <div className="text-xs text-gray-400 mb-3">Token balance: {tokenBalance}</div>
            <input
              type="number"
              min={1}
              max={tokenBalance ?? 0}
              value={convertAmount}
              onChange={(e) => setConvertAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 mb-3"
            />
            {convertError && <div className="text-red-400 text-xs mb-3">{convertError}</div>}
            <div className="flex gap-2">
              <button onClick={() => setShowConvert(false)} className="flex-1 bg-white/10 hover:bg-white/15 border border-white/10 py-2 rounded font-semibold transition">
                Cancel
              </button>
              <button
                onClick={doConvert}
                disabled={converting || !tokenBalance || convertAmount > tokenBalance}
                className="flex-1 bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 disabled:opacity-50 py-2 rounded font-semibold transition"
              >
                {converting ? 'Converting...' : 'Convert'}
              </button>
            </div>
          </div>
        </div>
      )}

      {chipBalance === 0 && (
        <button
          onClick={() => setShowConvert(true)}
          className="w-full mb-6 bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 text-white py-3 rounded-full font-bold transition"
        >
          Get Chips to Play
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
        <RouletteGame userId={session.user.id} balance={chipBalance} onBalanceChange={setChipBalance} />
      ) : (
        <SlotMachineGame userId={session.user.id} balance={chipBalance} onBalanceChange={setChipBalance} />
      )}
    </div>
  )
}
