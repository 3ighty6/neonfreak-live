import { useState, useEffect } from 'react'
import { Percent, Plus, Power } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface PromoRow {
  id: string
  title: string
  bonus_percent: number
  starts_at: string
  ends_at: string
  active: boolean
}

export default function PromotionsAdmin() {
  const [promos, setPromos] = useState<PromoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [message, setMessage] = useState('')

  const [title, setTitle] = useState('')
  const [bonusPercent, setBonusPercent] = useState(20)
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('token_promotions').select('*').order('starts_at', { ascending: false })
    setPromos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const createPromo = async () => {
    setMessage('')
    if (!title.trim() || !startsAt || !endsAt || bonusPercent <= 0) {
      setMessage('Fill in all fields')
      return
    }
    setSaving(true)
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('token_promotions').insert({
      title: title.trim(),
      bonus_percent: bonusPercent,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      created_by: userData?.user?.id,
    })
    setSaving(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setShowCreate(false)
    setTitle('')
    setBonusPercent(20)
    setStartsAt('')
    setEndsAt('')
    load()
  }

  const toggleActive = async (promo: PromoRow) => {
    await supabase.from('token_promotions').update({ active: !promo.active }).eq('id', promo.id)
    load()
  }

  const phase = (p: PromoRow) => {
    const now = Date.now()
    if (!p.active) return 'disabled'
    if (now < new Date(p.starts_at).getTime()) return 'scheduled'
    if (now > new Date(p.ends_at).getTime()) return 'expired'
    return 'live'
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Percent size={18} className="text-green-400" /> Token Promotions
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-1 transition"
        >
          <Plus size={16} /> New Promo
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Only the highest-bonus promo that's currently live applies. Bonus tokens are computed server-side at
        checkout, on top of every package's normal price.
      </p>

      {message && <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-300 text-sm">{message}</div>}

      {showCreate && (
        <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-4 mb-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Promo title (e.g. Friday Night Bonus)"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
          />
          <div>
            <label className="text-xs text-gray-400 block mb-1">Extra bonus % on top of package price</label>
            <input
              type="number"
              min={1}
              value={bonusPercent}
              onChange={(e) => setBonusPercent(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Starts</label>
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Ends</label>
              <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 bg-white/10 hover:bg-white/15 border border-white/10 py-2 rounded font-semibold transition">
              Cancel
            </button>
            <button onClick={createPromo} disabled={saving} className="flex-1 bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 disabled:opacity-50 py-2 rounded font-semibold transition">
              {saving ? 'Creating...' : 'Create Promo'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {promos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No promotions yet.</div>
        ) : (
          promos.map((p) => {
            const st = phase(p)
            return (
              <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-1">
                  <span className="font-semibold">{p.title}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      st === 'live'
                        ? 'bg-green-500/20 text-green-400'
                        : st === 'scheduled'
                          ? 'bg-blue-500/20 text-blue-400'
                          : st === 'expired'
                            ? 'bg-gray-700 text-gray-400'
                            : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {st}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {new Date(p.starts_at).toLocaleString()} → {new Date(p.ends_at).toLocaleString()}
                </div>
                <div className="text-sm text-green-400 font-semibold mb-2">+{p.bonus_percent}% bonus tokens</div>
                <button
                  onClick={() => toggleActive(p)}
                  className="bg-white/10 hover:bg-white/15 border border-white/10 text-white px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1 transition"
                >
                  <Power size={14} /> {p.active ? 'Disable' : 'Enable'}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
