import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { Heart, HeartOff, Share2, Edit, Camera, Play, Lock } from 'lucide-react'
import { supabase } from '../supabaseClient'
import ProfileEditModal from '../components/ProfileEditModal'
import TokenBalance from '../components/TokenBalance'

interface Profile {
  id: string
  username: string
  bio: string | null
  avatar_url: string | null
  followers_count: number
  following_count: number
  total_earnings: number
  is_verified: boolean
  is_streamer: boolean
}

interface VideoRow {
  id: string
  title: string
  thumbnail_url: string | null
  price_tokens: number
  view_count: number
}

export default function CreatorProfilePage({
  session,
  creatorId,
  onBack,
  onOpenSetup,
}: {
  session: Session
  creatorId: string
  onBack?: () => void
  onOpenSetup?: () => void
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [videos, setVideos] = useState<VideoRow[]>([])
  const [isLive, setIsLive] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const isOwnProfile = session.user.id === creatorId

  const load = async () => {
    setLoading(true)
    const [{ data: profileData }, { data: videoData }, { data: roomData }] = await Promise.all([
      supabase
        .from('users')
        .select('id, username, bio, avatar_url, followers_count, following_count, total_earnings, is_verified, is_streamer')
        .eq('id', creatorId)
        .single(),
      supabase
        .from('vod_library')
        .select('id, title, thumbnail_url, price_tokens, view_count')
        .eq('user_id', creatorId)
        .eq('is_public', true)
        .order('created_at', { ascending: false }),
      supabase.from('rooms').select('id').eq('streamer_id', creatorId).eq('is_live', true).maybeSingle(),
    ])

    setProfile(profileData)
    setVideos(videoData || [])
    setIsLive(!!roomData)

    if (!isOwnProfile) {
      const { data: followRow } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', session.user.id)
        .eq('streamer_id', creatorId)
        .maybeSingle()
      setIsFollowing(!!followRow)
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [creatorId])

  const toggleFollow = async () => {
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('followers').delete().eq('follower_id', session.user.id).eq('streamer_id', creatorId)
      setIsFollowing(false)
    } else {
      await supabase.from('followers').insert({ follower_id: session.user.id, streamer_id: creatorId })
      setIsFollowing(true)
    }
    setFollowLoading(false)
    load()
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">Loading...</div>
  }

  if (!profile) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">Creator not found.</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {onBack && (
        <button onClick={onBack} className="fixed top-4 left-4 z-10 bg-black/70 hover:bg-black/90 px-3 py-2 rounded-lg text-sm">
          ← Back
        </button>
      )}

      <div className="h-32 bg-gradient-to-r from-cyan-600/30 to-purple-600/30 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,255,0.1),transparent)]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-cyan-500 overflow-hidden bg-gray-800 flex items-center justify-center text-5xl">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  '👤'
                )}
              </div>
              {isLive && <div className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{profile.username}</h1>
                {profile.is_verified && (
                  <div className="bg-cyan-600 px-3 py-1 rounded-full text-xs font-semibold">✓ Verified</div>
                )}
              </div>

              <p className="text-gray-400 mb-4">{profile.bio || 'No bio yet.'}</p>

              <div className="flex gap-8 mb-6">
                <div>
                  <div className="text-2xl font-bold text-cyan-400">{profile.followers_count}</div>
                  <div className="text-sm text-gray-400">Followers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyan-400">{profile.following_count}</div>
                  <div className="text-sm text-gray-400">Following</div>
                </div>
                {isOwnProfile && (
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">${Number(profile.total_earnings).toFixed(2)}</div>
                    <div className="text-sm text-gray-400">Total Earnings</div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 flex-wrap">
                {isOwnProfile ? (
                  <>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                      <Edit size={18} />
                      Edit Profile
                    </button>
                    <button
                      onClick={onOpenSetup}
                      className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                      <Camera size={18} />
                      Go Live
                    </button>
                  </>
                ) : (
                  <button
                    onClick={toggleFollow}
                    disabled={followLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
                      isFollowing ? 'bg-gray-700 hover:bg-gray-600' : 'bg-cyan-600 hover:bg-cyan-700'
                    }`}
                  >
                    {isFollowing ? <HeartOff size={18} /> : <Heart size={18} />}
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  <Share2 size={18} />
                  Share
                </button>
              </div>
            </div>

            {isOwnProfile && (
              <div className="md:text-right">
                <TokenBalance userId={profile.id} />
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 border-b border-gray-700">
          <div className="flex gap-8">
            <div className="py-4 px-2 font-semibold text-cyan-400 border-b-2 border-cyan-400">Videos</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {videos.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">No videos yet</div>
          ) : (
            videos.map((video) => (
              <div key={video.id} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                <div className="relative aspect-video bg-gray-800 flex items-center justify-center">
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="text-3xl opacity-50">📹</div>
                  )}
                  {video.price_tokens > 0 ? (
                    <Lock size={28} className="absolute inset-0 m-auto text-white/90" />
                  ) : (
                    <Play size={32} className="absolute inset-0 m-auto text-white/0 hover:text-white/90 transition" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold truncate">{video.title}</p>
                  <p className="text-xs text-gray-500">
                    {video.price_tokens > 0 ? `${video.price_tokens} tokens` : 'Free'} · {video.view_count} views
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <p className="text-xs text-gray-600 mt-4">
          Open the Videos tab in the main nav to watch or unlock — full playback lives there.
        </p>
      </div>

      <ProfileEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        userId={profile.id}
        onProfileUpdate={load}
      />
    </div>
  )
}
