import { useState, useEffect } from 'react'
import { Video, Image, Bot } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface AIProfile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  ai_disclosure: string
}

interface ContentRow {
  id: string
  title: string
  price_tokens: number
  thumbnail_url?: string | null
  cover_path?: string | null
}

export default function AIProfilePage({ profileId, onBack }: { profileId: string; onBack?: () => void }) {
  const [profile, setProfile] = useState<AIProfile | null>(null)
  const [videos, setVideos] = useState<ContentRow[]>([])
  const [bundles, setBundles] = useState<ContentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: v }, { data: b }] = await Promise.all([
        supabase.from('creator_ai_profiles').select('id, username, avatar_url, bio, ai_disclosure').eq('id', profileId).single(),
        supabase.from('vod_library').select('id, title, price_tokens, thumbnail_url').eq('posted_as_ai_profile_id', profileId).eq('is_public', true),
        supabase.from('photo_bundles').select('id, title, price_tokens, cover_path').eq('posted_as_ai_profile_id', profileId).eq('is_public', true),
      ])
      setProfile(p)
      setVideos(v || [])
      setBundles(b || [])
      setLoading(false)
    }
    load()
  }, [profileId])

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">Loading...</div>
  if (!profile) return <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">Profile not found.</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {onBack && (
        <button onClick={onBack} className="fixed top-4 left-4 z-10 bg-black/70 hover:bg-black/90 px-3 py-2 rounded-lg text-sm">
          ← Back
        </button>
      )}

      <div className="h-32 bg-gradient-to-r from-purple-600/30 to-cyan-600/30" />

      <div className="max-w-5xl mx-auto px-4 pb-8">
        <div className="relative -mt-16 mb-8 flex items-start gap-6">
          <div className="w-32 h-32 rounded-full border-4 border-purple-500 overflow-hidden bg-gray-800 flex items-center justify-center text-5xl flex-shrink-0">
            {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" /> : '👤'}
          </div>
          <div className="pt-16">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{profile.username}</h1>
              <div className="bg-purple-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <Bot size={14} /> AI Creator
              </div>
            </div>
            <p className="text-gray-400 mb-1">{profile.bio}</p>
            <p className="text-xs text-purple-300">{profile.ai_disclosure}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <Video size={18} className="text-cyan-400" /> Videos
        </h2>
        {videos.length === 0 ? (
          <p className="text-gray-500 text-sm mb-8">No videos yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {videos.map((v) => (
              <div key={v.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-800 flex items-center justify-center text-3xl opacity-50">📹</div>
                <div className="p-2">
                  <p className="text-xs font-semibold truncate">{v.title}</p>
                  <p className="text-xs text-cyan-400">{v.price_tokens} tokens</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <Image size={18} className="text-purple-400" /> Photo Bundles
        </h2>
        {bundles.length === 0 ? (
          <p className="text-gray-500 text-sm">No bundles yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {bundles.map((b) => (
              <div key={b.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <div className="aspect-square bg-gray-800 flex items-center justify-center text-3xl opacity-50">🔒</div>
                <div className="p-2">
                  <p className="text-xs font-semibold truncate">{b.title}</p>
                  <p className="text-xs text-purple-400">{b.price_tokens} tokens</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
