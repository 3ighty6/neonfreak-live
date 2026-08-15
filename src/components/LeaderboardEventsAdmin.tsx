import { useState, useEffect } from 'react'
import { Trophy, Plus, Play, DollarSign } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface EventRow {
  id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  prize_pool_tokens: number
  prize_distribution_pct: number[]
  status: string
}

export default function LeaderboardEventsAdmin() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [message, setMessage] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [pool, setPool] = useState(1000)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('leaderboard_events').select('*').order('starts_at', { ascending: false })
    setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const createEvent = async () => {
    setMessage('')
    if (!title.trim() || !startsAt || !endsAt || pool <= 0) {
      setMessage('Fill in all fields')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('leaderboard_events').insert({
      title: title.trim(),
      description: description.trim() || null,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      prize_pool_tokens: pool,
    })
    setSaving(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setShowCreate(false)
    setTitle('')
    setDescription('')
    setStartsAt('')
    setEndsAt('')
    setPool(1000)
    load()
  }

  const finalizeEvent = async (event: EventRow) => {
    if (!confirm(`Pay out "${event.title}" now? This is permanent and can't be undone.`)) return
    setMessage('')
    const { data, error } = await supabase.rpc('finalize_leaderboard_event', { p_event_id: event.id })
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage(`Paid out ${data.totalPaid} tokens across ${data.winnersCount} winners.`)
    load()
  }

  const eventPhase = (event: EventRow) => {
    const now = Date.now()
    const start = new Date(event.starts_at).getTime()
    const end = new Date(event.ends_at).getTime()
    if (event.status === 'ended') return 'ended'
    if (now < start) return 'upcoming'
    if (now > end) return 'awaiting-payout'
    return 'active'
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Trophy size={18} className="text-yellow-400" /> Leaderboard Events
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-1 transition"
        >
          <Plus size={16} /> New Event
        </button>
      </div>

      {message && <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-300 text-sm">{message}</div>}

      {showCreate && (
        <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-4 mb-4 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title (e.g. Summer Tip Wars)" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2" />
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
          <div>
            <label className="text-xs text-gray-400 block mb-1">Prize pool (tokens, split 40/25/15/10/10 across top 5)</label>
            <input type="number" min={1} value={pool} onChange={(e) => setPool(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded font-semibold transition">
              Cancel
            </button>
            <button onClick={createEvent} disabled={saving} className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 py-2 rounded font-semibold transition">
              {saving ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No events yet.</div>
        ) : (
          events.map((event) => {
            const phase = eventPhase(event)
            return (
              <div key={event.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-1">
                  <span className="font-semibold">{event.title}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      phase === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : phase === 'upcoming'
                          ? 'bg-blue-500/20 text-blue-400'
                          : phase === 'awaiting-payout'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {phase}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {new Date(event.starts_at).toLocaleString()} → {new Date(event.ends_at).toLocaleString()}
                </div>
                <div className="text-sm text-yellow-400 font-semibold mb-2 flex items-center gap-1">
                  <DollarSign size={14} /> {event.prize_pool_tokens} token pool
                </div>
                {phase === 'awaiting-payout' && (
                  <button
                    onClick={() => finalizeEvent(event)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1 transition"
                  >
                    <Play size={14} /> Finalize & Pay Out
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
