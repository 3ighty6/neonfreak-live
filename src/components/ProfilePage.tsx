import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Heart, Radio } from 'lucide-react'

export default function ProfilePage({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [isStreamer, setIsStreamer] = useState(false)
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (data) {
        setProfile(data)
        setUsername(data.username)
        setBio(data.bio || '')
        setIsStreamer(data.is_streamer || false)
      }

      // Get follower count
      const { count: followerCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('streamer_id', userId)

      const { count: followingCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)

      setFollowers(followerCount || 0)
      setFollowing(followingCount || 0)
    }

    fetchProfile()
  }, [userId])

  const handleUpdateProfile = async () => {
    try {
      await supabase
        .from('users')
        .update({
          username,
          bio,
          is_streamer: isStreamer,
        })
        .eq('id', userId)

      setIsEditing(false)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-32"></div>

        {/* Profile Info */}
        <div className="px-8 pb-8">
          <div className="flex items-end gap-6 -mt-16 mb-6">
            <div className="w-32 h-32 rounded-full bg-gray-800 border-4 border-gray-900"></div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{profile?.username}</h2>
              {isStreamer && (
                <div className="flex items-center gap-2 text-red-500 font-semibold">
                  <Radio size={18} />
                  Streamer
                </div>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-24"
                />
              </div>
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={isStreamer}
                  onChange={(e) => setIsStreamer(e.target.checked)}
                  className="w-4 h-4"
                />
                I want to be a streamer
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateProfile}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-400 mb-6">{bio || 'No bio yet'}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
              >
                Edit Profile
              </button>
            </>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{followers}</p>
              <p className="text-sm text-gray-400">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{following}</p>
              <p className="text-sm text-gray-400">Following</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-sm text-gray-400">Streams</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
