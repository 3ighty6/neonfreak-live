import { useState, useEffect } from 'react'
import { Trophy } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface Standing {
  user_id: string
  username: string
  score: number
}

export default function Leaderboard() {
  const [event, setEvent] = useState<{ id: string; title: string; description: string | null; ends_at: string; prize_pool_tokens: number } | null>(null)
  const [standings, setStandings] = useState<Standing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const now = new Date().toISOString()
      const { data: activeEvent } = await supabase
        .from('leaderboard_events')
        .select('id, title, description, starts_at, ends_at, prize_pool_tokens')
        .neq('status', 'ended')
        .lte('starts_at', now)
        .gte('ends_at', now)
        .order('ends_at')
        .limit(1)
        .maybeSingle()

      if (!activeEvent) {
        setLoading(false)
        return
      }
      setEvent(activeEvent)

      // Live standings computed from real tip data within the event
      // window -- not stored anywhere, always current.
      const { data: tips } = await supabase
        .from('tips')
        .select('receiver_id, amount, users:receiver_id(username)')
        .gte('created_at', activeEvent.starts_at)
        .lte('created_at', activeEvent.ends_at)

      const totals = new Map<string, { username: string; score: number }>()
      for (const t of tips || []) {
        const existing = totals.get(t.receiver_id)
        const username = (t.users as any)?.username || 'Unknown'
        totals.set(t.receiver_id, { username, score: (existing?.score || 0) + Number(t.amount) })
      }

      const ranked = Array.from(totals.entries())
        .map(([user_id, v]) => ({ user_id, username: v.username, score: v.score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)

      setStandings(ranked)
      setLoading(false)
    }
    load()
  }, [])

  if (loading || !event) return null

  const medals = ['🥇', '🥈', '🥉', '4.', '5.']

  return (
    <div className="bg-gradient-to-br from-yellow-900/20 to-purple-900/20 border border-yellow-500/30 rounded-lg p-5 mb-8">
      <div className="flex items-center gap-2 mb-1">
        <Trophy size={20} className="text-yellow-400" />
        <h2 className="text-lg font-bold">{event.title}</h2>
      </div>
      {event.description && <p className="text-sm text-gray-400 mb-3">{event.description}</p>}
      <div className="text-xs text-yellow-300 mb-4">
        {event.prize_pool_tokens} token prize pool · ends {new Date(event.ends_at).toLocaleString()}
      </div>

      {standings.length === 0 ? (
        <p className="text-sm text-gray-500">No tips yet during this event — be the first!</p>
      ) : (
        <div className="space-y-2">
          {standings.map((s, i) => (
            <div key={s.user_id} className="flex items-center justify-between bg-black/20 rounded px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="w-6 text-center">{medals[i]}</span>
                <span className="font-semibold text-sm">{s.username}</span>
              </div>
              <span className="text-yellow-400 font-bold text-sm">{s.score.toLocaleString()} tokens</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
