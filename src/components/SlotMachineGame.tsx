import { useState } from 'react'
import { supabase } from '../supabaseClient'
import NeonChip from './NeonChip'

const CHIP_VALUES = [5, 10, 25, 50, 100]

// Reel symbols. Purely cosmetic -- the RPC decides the outcome first,
// these just animate to a matching combo for that outcome.
const SYMBOLS = ['🍒', '💎', '🔥', '⚡', '🎬', '👑']
const OUTCOME_COMBOS: Record<string, string[]> = {
  jackpot: ['👑', '👑', '👑'],
  big: ['💎', '💎', '💎'],
  medium: ['🔥', '🔥', '🔥'],
  small: ['🍒', '🍒', '🍒'],
  loss: ['🍒', '🎬', '⚡'],
}

function randomReel() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
}

export default function SlotMachineGame({ userId, balance, onBalanceChange }: { userId: string; balance: number; onBalanceChange: (b: number) => void }) {
  const [amount, setAmount] = useState(10)
  const [spinning, setSpinning] = useState(false)
  const [reels, setReels] = useState(['🍒', '🎬', '⚡'])
  const [result, setResult] = useState<{ outcome: string; payout: number; multiplier: number } | null>(null)
  const [error, setError] = useState('')

  const spin = async () => {
    if (spinning || amount < 1 || amount > balance) return
    setError('')
    setResult(null)
    setSpinning(true)

    const { data, error: rpcError } = await supabase.rpc('play_slots', { p_amount: amount })
    if (rpcError) {
      setError(rpcError.message)
      setSpinning(false)
      return
    }

    // Roll the reels visually for ~1.5s, then land on the real outcome
    let ticks = 0
    const interval = setInterval(() => {
      setReels([randomReel(), randomReel(), randomReel()])
      ticks++
      if (ticks > 12) {
        clearInterval(interval)
        setReels(OUTCOME_COMBOS[data.outcome])
        setResult({ outcome: data.outcome, payout: data.payout, multiplier: data.multiplier })
        onBalanceChange(data.newBalance)
        setSpinning(false)
      }
    }, 110)
  }

  const outcomeLabel: Record<string, string> = {
    jackpot: '👑 JACKPOT!',
    big: 'Big Win!',
    medium: 'Nice Win!',
    small: 'Push — bet back',
    loss: 'No win',
  }

  return (
    <div className="glass-panel-glow p-6 rounded-2xl">
      <div className="bg-[#0d0a1a] border-2 border-pink-500/40 rounded-xl p-6 mb-6 shadow-[0_0_30px_-8px_rgba(255,45,149,0.4)]">
        <div className="flex items-center justify-center gap-3 mb-4">
          {reels.map((sym, i) => (
            <div
              key={i}
              className="w-20 h-20 bg-white/5 border border-cyan-500/30 rounded-lg flex items-center justify-center text-4xl"
            >
              {sym}
            </div>
          ))}
        </div>
        {result && (
          <div className={`text-center font-bold ${result.payout > amount ? 'text-green-400' : result.payout === amount ? 'text-cyan-300' : 'text-gray-500'}`}>
            {outcomeLabel[result.outcome]}
            {result.payout > 0 && <span className="ml-2">+{result.payout} tokens</span>}
          </div>
        )}
        {error && <div className="text-red-400 text-sm text-center mt-2">{error}</div>}
      </div>

      <div className="flex items-center gap-2 mb-3">
        {CHIP_VALUES.map((v) => (
          <NeonChip key={v} size={36} label={v} active={amount === v} disabled={spinning} onClick={() => setAmount(v)} />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          max={Math.min(2000, balance)}
          value={amount}
          onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
          disabled={spinning}
          className="w-24 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
        />
        <span className="text-xs text-gray-500">tokens (max 2000/spin)</span>
        <div className="flex-1" />
        <button
          onClick={spin}
          disabled={spinning || amount > balance}
          className="bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 disabled:opacity-40 text-white px-6 py-2 rounded-full font-bold transition"
        >
          {spinning ? 'Spinning…' : 'Pull'}
        </button>
      </div>
    </div>
  )
}
