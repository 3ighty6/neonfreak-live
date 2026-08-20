import { useState } from 'react'
import { Zap } from 'lucide-react'
import { supabase } from '../supabaseClient'
import NeonChip from './NeonChip'

const CHIP_VALUES = [5, 10, 25, 50, 100]

const PINK_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

type Pocket = { key: string; label: string; color: 'pink' | 'blue' | 'house' }

// Cosmetic wheel ordering only -- the actual result comes from the server.
// Interleaves pink/blue numbers, then splices in 0 / 00 / the house pocket
// at spaced points so the wheel reads as one continuous ring of 39.
function buildWheelOrder(): Pocket[] {
  const pink = [...PINK_NUMBERS]
  const blue = Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => !PINK_NUMBERS.has(n))
  const order: Pocket[] = []
  for (let i = 0; i < 18; i++) {
    order.push({ key: String(pink[i]), label: String(pink[i]), color: 'pink' })
    order.push({ key: String(blue[i]), label: String(blue[i]), color: 'blue' })
  }
  order.splice(9, 0, { key: 'zero', label: '0', color: 'house' })
  order.splice(23, 0, { key: 'double_zero', label: '00', color: 'house' })
  order.splice(33, 0, { key: 'house', label: '★', color: 'house' })
  return order
}
const WHEEL_ORDER = buildWheelOrder()

function pocketToWheelIndex(pocket: number): number {
  if (pocket >= 1 && pocket <= 36) return WHEEL_ORDER.findIndex((p) => p.key === String(pocket))
  if (pocket === 37) return WHEEL_ORDER.findIndex((p) => p.key === 'zero')
  if (pocket === 38) return WHEEL_ORDER.findIndex((p) => p.key === 'double_zero')
  return WHEEL_ORDER.findIndex((p) => p.key === 'house')
}

const wheelGradient = WHEEL_ORDER.map((p, i) => {
  const start = (i / WHEEL_ORDER.length) * 360
  const end = ((i + 1) / WHEEL_ORDER.length) * 360
  const color = p.color === 'pink' ? '#ff2d95' : p.color === 'blue' ? '#00d4ff' : '#0a0612'
  return `${color} ${start}deg ${end}deg`
}).join(', ')

interface BetOption {
  id: string
  label: string
  multiplier: string
  small?: boolean
}

const BET_OPTIONS: BetOption[] = [
  { id: 'pink', label: 'Pink', multiplier: '1.8x' },
  { id: 'blue', label: 'Blue', multiplier: '1.8x' },
  { id: 'high', label: 'High 19-36', multiplier: '1.8x' },
  { id: 'low', label: 'Low 1-18', multiplier: '1.8x' },
  { id: 'odd', label: 'Odd', multiplier: '1.8x' },
  { id: 'even', label: 'Even', multiplier: '1.8x' },
  { id: 'first12', label: '1st 12', multiplier: '2.8x' },
  { id: 'third12', label: '3rd 12', multiplier: '2.8x' },
  { id: 'zero', label: '0', multiplier: '27x', small: true },
  { id: 'double_zero', label: '00', multiplier: '27x', small: true },
  { id: 'lucky7', label: 'Lucky 7', multiplier: '27x', small: true },
]

export default function RouletteGame({ userId, balance, onBalanceChange }: { userId: string; balance: number; onBalanceChange: (b: number) => void }) {
  const [selectedBet, setSelectedBet] = useState<string | null>(null)
  const [amount, setAmount] = useState(10)
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<{ win: boolean; payout: number; pocket: number; label: string } | null>(null)
  const [error, setError] = useState('')

  const spin = async () => {
    if (!selectedBet || spinning || amount < 1 || amount > balance) return
    setError('')
    setResult(null)
    setSpinning(true)

    const { data, error: rpcError } = await supabase.rpc('play_roulette', { p_bet_type: selectedBet, p_amount: amount })

    if (rpcError) {
      setError(rpcError.message)
      setSpinning(false)
      return
    }

    const idx = pocketToWheelIndex(data.pocket)
    const segmentDeg = 360 / WHEEL_ORDER.length
    const targetDeg = idx * segmentDeg + segmentDeg / 2
    // Spin several full turns, land the target segment under the top pointer
    const fullTurns = 5 * 360
    setRotation((prev) => prev - (prev % 360) + fullTurns + (360 - targetDeg))

    setTimeout(() => {
      const pocketLabel = WHEEL_ORDER[idx].label
      setResult({ win: data.win, payout: data.payout, pocket: data.pocket, label: pocketLabel })
      onBalanceChange(data.newBalance)
      setSpinning(false)
    }, 3200)
  }

  return (
    <div className="glass-panel-glow p-6 rounded-2xl">
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-56 h-56 mb-4">
          <div
            className="absolute inset-0 rounded-full border-4 border-white/10 shadow-[0_0_40px_-5px_rgba(255,45,149,0.4)] transition-transform"
            style={{
              background: `conic-gradient(${wheelGradient})`,
              transform: `rotate(${rotation}deg)`,
              transitionDuration: spinning ? '3.2s' : '0s',
              transitionTimingFunction: 'cubic-bezier(0.15, 0.85, 0.25, 1)',
            }}
          />
          <div className="absolute inset-6 rounded-full bg-[#0d0a1a] border border-white/10 flex items-center justify-center">
            {result ? (
              <div className="text-center">
                <div className={`text-2xl font-black ${result.win ? 'text-green-400' : 'text-gray-400'}`}>{result.label}</div>
                <div className="text-xs text-gray-500">{result.win ? `+${result.payout}` : 'no win'}</div>
              </div>
            ) : (
              <Zap className="text-pink-500/50" size={28} />
            )}
          </div>
          {/* Pointer */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-yellow-400 z-10" />
        </div>

        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
      </div>

      {/* Betting board */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {BET_OPTIONS.map((bet) => (
          <button
            key={bet.id}
            onClick={() => setSelectedBet(bet.id)}
            disabled={spinning}
            className={`rounded-lg border transition text-center disabled:opacity-50 ${
              bet.small ? 'py-2 px-1 col-span-1' : 'py-3 px-2 col-span-2 sm:col-span-1'
            } ${
              selectedBet === bet.id
                ? 'bg-pink-500/20 border-pink-500 ring-2 ring-pink-500/40'
                : 'bg-white/5 border-white/10 hover:border-cyan-400/40'
            }`}
          >
            <div className={bet.small ? 'text-xs font-bold' : 'text-sm font-bold'}>{bet.label}</div>
            <div className="text-[10px] text-gray-400">{bet.multiplier}</div>
          </button>
        ))}
      </div>

      {/* Bet amount + spin */}
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
        <span className="text-xs text-gray-500">chips (max 2000/spin)</span>
        <div className="flex-1" />
        <button
          onClick={spin}
          disabled={!selectedBet || spinning || amount > balance}
          className="bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 disabled:opacity-40 text-white px-6 py-2 rounded-full font-bold transition"
        >
          {spinning ? 'Spinning…' : 'Spin'}
        </button>
      </div>
    </div>
  )
}
