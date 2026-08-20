import { useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import NeonChip from './NeonChip'

import lips from '../assets/slot-symbols/lips.png'
import webcam from '../assets/slot-symbols/webcam.png'
import bunny from '../assets/slot-symbols/bunny.png'
import handcuffs from '../assets/slot-symbols/handcuffs.png'
import heels from '../assets/slot-symbols/heels.png'
import thong from '../assets/slot-symbols/thong.png'
import cocktails from '../assets/slot-symbols/cocktails.png'
import dice from '../assets/slot-symbols/dice.png'
import phone from '../assets/slot-symbols/phone.png'
import heartbed from '../assets/slot-symbols/heartbed.png'
import catcam from '../assets/slot-symbols/catcam.png'
import live from '../assets/slot-symbols/live.png'

const CHIP_VALUES = [5, 10, 25, 50, 100]

const SYMBOL_IMG: Record<string, string> = {
  lips, webcam, bunny, handcuffs, heels, thong, cocktails, dice, phone, heartbed, catcam, live,
}
const ALL_SYMBOL_IDS = Object.keys(SYMBOL_IMG)

// The server decides the outcome tier first (play_slots RPC) -- these
// reel combos are purely what gets displayed for each real tier, not
// what determines a win. jackpot/big/medium land a solid 3-of-a-kind;
// small lands a 2-match (visually reads as the smaller win it is);
// loss always lands 3 distinct, non-matching symbols.
const OUTCOME_COMBOS: Record<string, string[]> = {
  jackpot: ['live', 'live', 'live'],
  big: ['catcam', 'catcam', 'catcam'],
  medium: ['cocktails', 'cocktails', 'cocktails'],
  small: ['heels', 'heels', 'dice'],
}

function randomSymbol() {
  return ALL_SYMBOL_IDS[Math.floor(Math.random() * ALL_SYMBOL_IDS.length)]
}

function randomLossCombo(): string[] {
  const shuffled = [...ALL_SYMBOL_IDS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

function playTone(ctx: AudioContext, freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.15) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(gain, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}

export default function SlotMachineGame({ balance, onBalanceChange }: { userId: string; balance: number; onBalanceChange: (b: number) => void }) {
  const [amount, setAmount] = useState(10)
  const [spinning, setSpinning] = useState(false)
  const [reels, setReels] = useState(['lips', 'webcam', 'heels'])
  const [result, setResult] = useState<{ outcome: string; payout: number; multiplier: number } | null>(null)
  const [error, setError] = useState('')
  const audioCtxRef = useRef<AudioContext | null>(null)

  const getAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
    return audioCtxRef.current
  }

  const spin = async () => {
    if (spinning || amount < 1 || amount > balance) return
    setError('')
    setResult(null)
    setSpinning(true)
    const ctx = getAudio()

    const { data, error: rpcError } = await supabase.rpc('play_slots', { p_amount: amount })
    if (rpcError) {
      setError(rpcError.message)
      setSpinning(false)
      return
    }

    let ticks = 0
    const interval = setInterval(() => {
      setReels([randomSymbol(), randomSymbol(), randomSymbol()])
      playTone(ctx, 180 + Math.random() * 40, 0.08, 'square', 0.08)
      ticks++
      if (ticks > 14) {
        clearInterval(interval)
        const finalCombo = OUTCOME_COMBOS[data.outcome] || randomLossCombo()
        setReels(finalCombo)
        setResult({ outcome: data.outcome, payout: data.payout, multiplier: data.multiplier })
        onBalanceChange(data.newBalance)
        setSpinning(false)
        if (data.payout > 0) {
          ;[523, 659, 784, 1046].forEach((n, i) => setTimeout(() => playTone(ctx, n, 0.25, 'sine', 0.2), i * 90))
        } else {
          playTone(ctx, 320, 0.12, 'triangle', 0.18)
        }
      }
    }, 110)
  }

  const outcomeLabel: Record<string, string> = {
    jackpot: '👑 JACKPOT!',
    big: 'Big Win!',
    medium: 'Nice Win!',
    small: 'Small Win',
    loss: 'No win',
  }

  return (
    <div className="glass-panel-glow p-6 rounded-2xl">
      <div className="bg-[#0d0a1a] border-2 border-pink-500/40 rounded-xl p-6 mb-6 shadow-[0_0_30px_-8px_rgba(255,45,149,0.4)]">
        <div className="flex items-center justify-center gap-3 mb-4">
          {reels.map((symId, i) => (
            <div
              key={i}
              className="w-20 h-20 bg-white/5 border border-cyan-500/30 rounded-lg flex items-center justify-center overflow-hidden p-1"
            >
              <img src={SYMBOL_IMG[symId]} alt={symId} className="w-full h-full object-contain" draggable={false} />
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
        <span className="text-xs text-gray-500">lotto tokens (max 2000/spin)</span>
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
