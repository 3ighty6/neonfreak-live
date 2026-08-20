import { useState } from 'react'
import { Users, Copy, Check } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface ReferralPanelProps {
  referralCode: string | null
  referredBy: string | null
}

export default function ReferralPanel({ referralCode, referredBy }: ReferralPanelProps) {
  const [copied, setCopied] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [applying, setApplying] = useState(false)
  const [message, setMessage] = useState('')
  const [applied, setApplied] = useState(!!referredBy)

  const referralLink = referralCode ? `${window.location.origin}/?ref=${referralCode}` : ''

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const applyCode = async () => {
    if (!codeInput.trim()) return
    setApplying(true)
    setMessage('')
    const { error } = await supabase.rpc('apply_referral_code', { p_code: codeInput.trim() })
    setApplying(false)
    if (error) {
      setMessage(error.message)
    } else {
      setApplied(true)
      setMessage('Applied! Your referrer gets a bonus once you complete ID verification.')
    }
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h3 className="font-semibold flex items-center gap-2 mb-3">
        <Users size={16} className="text-pink-400" /> Refer a Friend
      </h3>

      <p className="text-sm text-gray-400 mb-3">
        Share your link. Once someone you referred completes ID verification, you get a token bonus.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          readOnly
          value={referralLink}
          className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300"
        />
        <button
          onClick={copyLink}
          className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-2 rounded text-sm font-semibold flex items-center gap-1 transition"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {!applied && (
        <div className="border-t border-gray-700 pt-3">
          <label className="text-xs text-gray-400 block mb-2">Have a referral code from a friend?</label>
          <div className="flex gap-2">
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Enter code"
              className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm uppercase"
            />
            <button
              onClick={applyCode}
              disabled={applying || !codeInput.trim()}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-3 py-2 rounded text-sm font-semibold transition"
            >
              {applying ? '...' : 'Apply'}
            </button>
          </div>
        </div>
      )}

      {message && <p className="text-xs text-cyan-300 mt-2">{message}</p>}
    </div>
  )
}
