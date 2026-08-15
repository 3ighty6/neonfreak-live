import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Public, unauthenticated overlay page for OBS Browser Source.
 * Transparent background, shows animated tip/follow alerts as they
 * happen. Keyed by a private overlay_token (not the room id), read
 * from the URL: /overlay/:token
 *
 * Nothing on this page requires a logged-in session -- OBS Browser
 * Sources can't log in, so RLS on overlay_settings intentionally
 * allows public read by design (the token itself is what keeps a
 * random visitor from finding it, not auth).
 */
interface Alert {
  id: string
  type: 'tip' | 'follow'
  username: string
  amount?: number
}

export default function OverlayPage({ token }: { token: string }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [settings, setSettings] = useState<{ show_tip_alerts: boolean; show_follow_alerts: boolean; alert_duration_seconds: number } | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('overlay_settings')
        .select('user_id, show_tip_alerts, show_follow_alerts, alert_duration_seconds')
        .eq('overlay_token', token)
        .single()
      if (data) {
        setUserId(data.user_id)
        setSettings(data)
      }
    }
    load()
  }, [token])

  const pushAlert = (alert: Alert, durationMs: number) => {
    setAlerts((prev) => [...prev, alert])
    timeoutsRef.current[alert.id] = setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== alert.id))
      delete timeoutsRef.current[alert.id]
    }, durationMs)
  }

  useEffect(() => {
    if (!userId || !settings) return
    const durationMs = (settings.alert_duration_seconds || 6) * 1000

    const channel = supabase
      .channel(`overlay:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tips', filter: `receiver_id=eq.${userId}` },
        async (payload) => {
          if (!settings.show_tip_alerts) return
          const row = payload.new as any
          const { data: sender } = await supabase.from('users').select('username').eq('id', row.sender_id).single()
          pushAlert({ id: `tip-${row.id}`, type: 'tip', username: sender?.username || 'Someone', amount: row.amount }, durationMs)
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'followers', filter: `streamer_id=eq.${userId}` },
        async (payload) => {
          if (!settings.show_follow_alerts) return
          const row = payload.new as any
          const { data: follower } = await supabase.from('users').select('username').eq('id', row.follower_id).single()
          pushAlert({ id: `follow-${row.id}`, type: 'follow', username: follower?.username || 'Someone' }, durationMs)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId, settings])

  // Transparent background -- this page is meant to be captured as an
  // OBS Browser Source layered on top of the camera, not viewed directly.
  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-end p-8 gap-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`animate-[slideUp_0.3s_ease-out] px-8 py-4 rounded-2xl shadow-2xl backdrop-blur-sm text-white font-bold text-2xl flex items-center gap-3 ${
            alert.type === 'tip'
              ? 'bg-gradient-to-r from-purple-600/95 to-pink-600/95 border-2 border-purple-300'
              : 'bg-gradient-to-r from-pink-500/95 to-cyan-500/95 border-2 border-pink-300'
          }`}
        >
          {alert.type === 'tip' ? (
            <>
              <span className="text-3xl">🎉</span>
              <span>{alert.username} tipped {alert.amount} tokens!</span>
            </>
          ) : (
            <>
              <span className="text-3xl">💜</span>
              <span>{alert.username} started following!</span>
            </>
          )}
        </div>
      ))}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
