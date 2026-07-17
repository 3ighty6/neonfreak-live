import { useState } from 'react'
import { Camera, Mail } from 'lucide-react'

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('your_username')
  const [bio, setBio] = useState('Your bio goes here')

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
          Profile
        </h1>

        {/* Avatar */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-32 h-32 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mb-4 text-5xl">
            👤
          </div>
          <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded transition">
            <Camera size={18} />
            Change Avatar
          </button>
        </div>

        {/* Profile Info */}
        <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-6">
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={!isEditing}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white disabled:opacity-50"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={!isEditing}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white disabled:opacity-50"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Email</label>
              <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-300">
                <Mail size={18} />
                <span>your-email@example.com</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded font-semibold transition"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded font-semibold transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Total Followers</div>
            <div className="text-3xl font-bold">0</div>
          </div>
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Total Earnings</div>
            <div className="text-3xl font-bold">$0.00</div>
          </div>
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Streams</div>
            <div className="text-3xl font-bold">0</div>
          </div>
        </div>
      </div>
    </div>
  )
}
