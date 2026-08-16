import { useState, useEffect } from 'react'
import { X, MessageCircle, Video, Image, Star, Radio, DollarSign } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface UserSummary {
  id: string
  username: string
  email: string
}

export default function AdminUserDetail({
  user,
  onClose,
  onOpenMessages,
}: {
  user: UserSummary
  onClose: () => void
  onOpenMessages?: (userId: string) => void
}) {
  const [profile, setProfile] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [bundles, setBundles] = useState<any[]>([])
  const [perks, setPerks] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: v }, { data: b }, { data: pk }, { data: r }] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('vod_library').select('id, title, price_tokens, is_public, view_count, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('photo_bundles').select('id, title, price_tokens, is_public, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('creator_perks').select('id, title, price_tokens, is_active, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('rooms').select('id, title, is_live, viewer_count, created_at').eq('streamer_id', user.id).order('created_at', { ascending: false }).limit(10),
      ])
      setProfile(p)
      setVideos(v || [])
      setBundles(b || [])
      setPerks(pk || [])
      setRooms(r || [])
      setLoading(false)
    }
    load()
  }, [user.id])

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-cyan-500/30 rounded-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold">{user.username}</h2>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onOpenMessages?.(user.id)
                onClose()
              }}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1.5 transition"
            >
              <MessageCircle size={14} /> Message
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={22} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="p-4 space-y-6">
            {profile && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-gray-500 text-xs mb-1">Tokens</div>
                  <div className="font-bold">{profile.token_balance}</div>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><DollarSign size={12} /> Earnings</div>
                  <div className="font-bold">${Number(profile.total_earnings || 0).toFixed(2)}</div>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-gray-500 text-xs mb-1">Followers</div>
                  <div className="font-bold">{profile.followers_count}</div>
                </div>
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-gray-500 text-xs mb-1">ID Status</div>
                  <div className="font-bold capitalize">{profile.id_verification_status}</div>
                </div>
              </div>
            )}

            {rooms.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-1.5"><Radio size={14} /> Stream History</h3>
                <div className="space-y-1">
                  {rooms.map((r) => (
                    <div key={r.id} className="flex justify-between text-sm bg-gray-800 rounded px-3 py-1.5">
                      <span>{r.title}</span>
                      <span className="text-gray-500">{r.is_live ? 'Live now' : new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {videos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-1.5"><Video size={14} /> Videos ({videos.length})</h3>
                <div className="space-y-1">
                  {videos.map((v) => (
                    <div key={v.id} className="flex justify-between text-sm bg-gray-800 rounded px-3 py-1.5">
                      <span>{v.title} {!v.is_public && <span className="text-gray-500">(private)</span>}</span>
                      <span className="text-cyan-400">{v.price_tokens > 0 ? `${v.price_tokens} tok` : 'Free'} · {v.view_count} sold</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bundles.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-1.5"><Image size={14} /> Photo Bundles ({bundles.length})</h3>
                <div className="space-y-1">
                  {bundles.map((b) => (
                    <div key={b.id} className="flex justify-between text-sm bg-gray-800 rounded px-3 py-1.5">
                      <span>{b.title}</span>
                      <span className="text-cyan-400">{b.price_tokens > 0 ? `${b.price_tokens} tok` : 'Free'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {perks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-1.5"><Star size={14} /> Perks ({perks.length})</h3>
                <div className="space-y-1">
                  {perks.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm bg-gray-800 rounded px-3 py-1.5">
                      <span>{p.title}</span>
                      <span className="text-cyan-400">{p.price_tokens} tok</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {videos.length === 0 && bundles.length === 0 && perks.length === 0 && rooms.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-4">No content from this user yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
