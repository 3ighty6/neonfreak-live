import { useState, useEffect } from 'react'
import { Bot, Plus, Check } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface AIProfile {
  id: string
  username: string
  bio: string | null
  ai_disclosure: string
}

export default function AICreatorProfileManager({
  userId,
  isVerified,
  onOpenAIProfile,
}: {
  userId: string
  isVerified: boolean
  onOpenAIProfile?: (id: string) => void
}) {
  const [profile, setProfile] = useState<AIProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [disclosure, setDisclosure] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const { data } = await supabase
      .from('creator_ai_profiles')
      .select('id, username, bio, ai_disclosure')
      .eq('parent_user_id', userId)
      .maybeSingle()
    setProfile(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [userId])

  const create = async () => {
    setError('')
    if (!username.trim()) {
      setError('Pick a username for your AI persona')
      return
    }
    setSaving(true)
    const { data, error: rpcError } = await supabase.rpc('create_ai_profile', {
      p_username: username.trim(),
      p_bio: bio.trim(),
      p_disclosure: disclosure.trim(),
    })
    setSaving(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setShowCreate(false)
    load()
  }

  if (loading) return null

  return (
    <div className="bg-gray-900 border border-purple-500/20 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
        <Bot size={18} className="text-purple-400" />
        AI Creator Profile
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        A separate, clearly disclosed public persona for AI-generated content — distinct name, bio, and content
        library, linked to this account.
      </p>

      {profile ? (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded p-4">
          <div className="flex items-center gap-2 mb-1">
            <Check size={16} className="text-green-400" />
            <span className="font-semibold">{profile.username}</span>
          </div>
          {profile.bio && <p className="text-sm text-gray-400 mb-2">{profile.bio}</p>}
          <button
            onClick={() => onOpenAIProfile?.(profile.id)}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition"
          >
            View Profile →
          </button>
        </div>
      ) : !isVerified ? (
        <p className="text-sm text-yellow-400">Complete identity verification above before creating an AI persona.</p>
      ) : showCreate ? (
        <div className="space-y-3">
          {error && <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-xs">{error}</div>}
          <div>
            <label className="text-sm text-gray-400 block mb-1">Persona username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. RubyNoir"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Disclosure text (shown publicly on the profile)</label>
            <textarea
              value={disclosure}
              onChange={(e) => setDisclosure(e.target.value)}
              placeholder="This is a disclosed AI-generated creator profile."
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 bg-white/10 hover:bg-white/15 border border-white/10 py-2 rounded font-semibold transition">
              Cancel
            </button>
            <button onClick={create} disabled={saving} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 py-2 rounded font-semibold transition">
              {saving ? 'Creating...' : 'Create Persona'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
        >
          <Plus size={16} /> Create AI Persona
        </button>
      )}
    </div>
  )
}
