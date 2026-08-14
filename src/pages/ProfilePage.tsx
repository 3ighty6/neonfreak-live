import { useState, useEffect, useRef } from 'react'
import { Camera, Mail, Loader2, Check, Lock } from 'lucide-react'
import { supabase } from '../supabaseClient'
import type { User } from '../types'

export default function ProfilePage({ onViewPublicProfile }: { onViewPublicProfile?: () => void }) {
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [error, setError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      setLoading(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (fetchError) {
      setError(fetchError.message)
    } else if (data) {
      setProfile(data)
      setUsername(data.username || '')
      setBio(data.bio || '')
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('users')
      .update({
        username: username.trim(),
        bio: bio.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setProfile({ ...profile, username: username.trim(), bio: bio.trim() })
    setIsEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCancel = () => {
    if (profile) {
      setUsername(profile.username || '')
      setBio(profile.bio || '')
    }
    setIsEditing(false)
    setError('')
  }

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    setAvatarUploading(true)
    setError('')

    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setAvatarUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)

    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', profile.id)

    setAvatarUploading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setProfile({ ...profile, avatar_url: urlData.publicUrl })
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordMessage('')

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setChangingPassword(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPassword(false)

    if (updateError) {
      setPasswordError(updateError.message)
      return
    }

    setPasswordMessage('✅ Password updated')
    setNewPassword('')
    setConfirmNewPassword('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading profile...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">
        Couldn't load your profile. Try refreshing.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
            Profile
          </h1>
          {onViewPublicProfile && (
            <button
              onClick={onViewPublicProfile}
              className="text-sm text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 rounded px-3 py-1.5 transition"
            >
              View Public Profile
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Avatar */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-32 h-32 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mb-4 text-5xl overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              '👤'
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            onClick={handleAvatarClick}
            disabled={avatarUploading}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-4 py-2 rounded transition"
          >
            {avatarUploading ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
            {avatarUploading ? 'Uploading...' : 'Change Avatar'}
          </button>
        </div>

        {/* Profile Info */}
        <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-6">
          <div className="space-y-4">
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

            <div>
              <label className="text-sm text-gray-400 block mb-2">Email</label>
              <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-300">
                <Mail size={18} />
                <span>{profile.email}</span>
              </div>
            </div>
          </div>

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
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded font-semibold transition flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : saved ? <Check size={18} /> : null}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock size={18} className="text-cyan-400" />
            Change Password
          </h2>

          {passwordError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-sm">
              {passwordError}
            </div>
          )}
          {passwordMessage && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded text-green-300 text-sm">
              {passwordMessage}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded font-semibold transition flex items-center gap-2"
            >
              {changingPassword ? <Loader2 className="animate-spin" size={18} /> : null}
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Followers</div>
            <div className="text-3xl font-bold">{profile.followers_count ?? 0}</div>
          </div>
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Total Earnings</div>
            <div className="text-3xl font-bold">${Number(profile.total_earnings ?? 0).toFixed(2)}</div>
          </div>
          <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Token Balance</div>
            <div className="text-3xl font-bold">{profile.token_balance ?? 0}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
