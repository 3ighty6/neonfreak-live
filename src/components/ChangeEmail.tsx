import { useState } from 'react'
import { Mail, Loader2, Check } from 'lucide-react'
import { supabase } from '../supabaseClient'

// Auth-level change, not a row on public.users -- supabase.auth.updateUser
// sends a confirmation link to the new address (and, if "Secure email
// change" is on in Supabase Auth settings, also to the old one) before
// the address actually changes. profile.email in the users table is
// synced separately by the existing auto_create_profile trigger /
// whatever keeps it current on auth callback -- this component only
// kicks off the auth-side change and reports the pending state.
export default function ChangeEmail({ currentEmail }: { currentEmail: string }) {
  const [editing, setEditing] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmed = newEmail.trim()
    if (!trimmed || trimmed === currentEmail) {
      setError('Enter a different email address')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ email: trimmed })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSent(true)
    setEditing(false)
  }

  if (sent) {
    return (
      <div>
        <label className="text-sm text-gray-400 block mb-2">Email</label>
        <div className="flex items-center gap-2 bg-gray-800 border border-green-700/50 rounded px-4 py-2 text-green-400 text-sm">
          <Check size={18} />
          <span>Confirm the link sent to your new address to finish the change. Your login email stays {currentEmail} until then.</span>
        </div>
      </div>
    )
  }

  if (!editing) {
    return (
      <div>
        <label className="text-sm text-gray-400 block mb-2">Email</label>
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-300">
          <Mail size={18} className="shrink-0" />
          <span className="flex-1">{currentEmail}</span>
          <button
            type="button"
            onClick={() => {
              setEditing(true)
              setNewEmail('')
              setError('')
            }}
            className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold shrink-0"
          >
            Change
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="text-sm text-gray-400 block mb-2">New email</label>
      <div className="flex gap-2">
        <input
          type="email"
          autoFocus
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 disabled:opacity-50 text-white px-4 py-2 rounded font-semibold flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : 'Send confirmation'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-gray-400 hover:text-gray-300 px-3"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </form>
  )
}
