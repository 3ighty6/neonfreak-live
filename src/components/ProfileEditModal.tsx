import { useState } from 'react'
import { X, Upload } from 'lucide-react'

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onProfileUpdate?: () => void
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  userId,
  onProfileUpdate,
}: ProfileEditModalProps) {
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [email, setEmail] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('userId', userId)
      formData.append('username', username)
      formData.append('bio', bio)
      formData.append('email', email)
      if (avatarFile) formData.append('avatar', avatarFile)

      const response = await fetch('/api/update-profile', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      onProfileUpdate?.()
      onClose()
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-cyan-500/30 rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-cyan-400">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your audience about yourself..."
              maxLength={150}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition resize-none"
              rows={3}
            />
            <div className="text-xs text-gray-500 mt-1">{bio.length}/150</div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition"
            />
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Avatar</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="flex items-center justify-center gap-2 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 cursor-pointer hover:border-cyan-500 transition"
              >
                <Upload size={18} className="text-cyan-400" />
                <span className="text-gray-300">
                  {avatarFile ? avatarFile.name : 'Choose image'}
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white py-2 rounded font-semibold transition"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
