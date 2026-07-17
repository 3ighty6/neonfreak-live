import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Heart, Radio, Zap } from 'lucide-react'

export default function ProfilePage({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')

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
      }
    }

    fetchProfile()
  }, [userId])

  const handleSave = async () => {
    await supabase
      .from('users')
      .update({ username, bio })
      .eq('id', userId)

    setProfile({ ...profile, username, bio })
    setIsEditing(false)
  }

  if (!profile) return <div className="p-6">Loading...</div>

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/30 rounded-lg p-6 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="text-2xl font-bold bg-gray-900 border border-cyan-500 rounded px-3 py-2 text-white mb-4 w-full"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm h-20"
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-black text-white mb-2">{username}</h1>
                <p className="text-gray-400">{bio || 'No bio yet'}</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-2 flex items-center gap-1">
            <Heart size={16} /> Followers
          </div>
          <p className="text-2xl font-bold text-cyan-400">0</p>
        </div>
        <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-2 flex items-center gap-1">
            <Radio size={16} /> Streams
          </div>
          <p className="text-2xl font-bold text-cyan-400">0</p>
        </div>
        <div className="bg-black/50 border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-2 flex items-center gap-1">
            <Zap size={16} /> Earnings
          </div>
          <p className="text-2xl font-bold text-cyan-400">$0</p>
        </div>
      </div>
    </div>
  )
}
