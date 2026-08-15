import { useState, useEffect } from 'react'
import { Tag, Send, Check, X, Loader2, Coins } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface VideoRow {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  user_id: string
}

interface Submission {
  id: string
  video_id: string
  suggested_title: string | null
  suggested_description: string | null
  status: string
  reward_tokens: number
  created_at: string
  video: { title: string } | null
  submitter: { username: string } | null
}

/**
 * Two halves: browse videos and suggest better titles/descriptions to
 * earn tokens (paid from the platform savings pool), and -- if you own
 * any videos yourself -- review submissions others made on them.
 */
export default function TagAndEarn({ userId }: { userId: string }) {
  const [videos, setVideos] = useState<VideoRow[]>([])
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([])
  const [pendingOnMine, setPendingOnMine] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [editingVideo, setEditingVideo] = useState<VideoRow | null>(null)
  const [message, setMessage] = useState('')

  const load = async () => {
    setLoading(true)
    const [{ data: videoRows }, { data: mine }, { data: pending }] = await Promise.all([
      supabase.from('vod_library').select('id, title, description, thumbnail_url, user_id').eq('is_public', true).limit(30),
      supabase
        .from('video_tag_submissions')
        .select('id, video_id, suggested_title, suggested_description, status, reward_tokens, created_at, video:video_id(title)')
        .eq('submitted_by', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('video_tag_submissions')
        .select('id, video_id, suggested_title, suggested_description, status, reward_tokens, created_at, video:video_id(title, user_id), submitter:submitted_by(username)')
        .eq('status', 'pending'),
    ])
    setVideos(videoRows || [])
    setMySubmissions((mine as any) || [])
    // Only submissions on videos this user actually owns
    setPendingOnMine(((pending as any) || []).filter((p: any) => p.video?.user_id === userId))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [userId])

  const review = async (submissionId: string, approve: boolean) => {
    setMessage('')
    const { error } = await supabase.rpc('review_tag_submission', { p_submission_id: submissionId, p_approve: approve })
    if (error) {
      setMessage(error.message)
      return
    }
    load()
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  return (
    <div>
      {message && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-sm">{message}</div>}

      {pendingOnMine.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Tag size={18} className="text-yellow-400" /> Submissions on your videos
          </h2>
          <div className="space-y-2">
            {pendingOnMine.map((s) => (
              <div key={s.id} className="bg-gray-800 border border-gray-700 rounded p-3">
                <div className="text-sm text-gray-400 mb-1">
                  On <span className="text-white font-semibold">{s.video?.title}</span> by {s.submitter?.username}
                </div>
                {s.suggested_title && <div className="text-sm mb-1">Title: {s.suggested_title}</div>}
                {s.suggested_description && <div className="text-sm text-gray-300 mb-2">{s.suggested_description}</div>}
                <div className="flex gap-2">
                  <button
                    onClick={() => review(s.id, true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Check size={12} /> Approve (pays {s.reward_tokens} tokens)
                  </button>
                  <button
                    onClick={() => review(s.id, false)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <X size={12} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2 text-sm text-yellow-300">
        <Coins size={18} />
        Suggest a better title or description for a video — earn tokens from the platform pool once the creator approves it.
      </div>

      <h2 className="text-lg font-bold mb-3">Videos you can tag</h2>
      <div className="grid md:grid-cols-2 gap-3 mb-8">
        {videos.map((v) => (
          <div key={v.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex gap-3">
            {v.thumbnail_url && <img src={v.thumbnail_url} className="w-20 h-20 object-cover rounded" alt="" />}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate mb-1">{v.title}</div>
              <button
                onClick={() => setEditingVideo(v)}
                disabled={v.user_id === userId}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white px-3 py-1 rounded text-xs font-semibold transition"
              >
                {v.user_id === userId ? 'Your video' : 'Suggest tags'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {mySubmissions.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Your submissions</h2>
          <div className="space-y-2">
            {mySubmissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2 text-sm">
                <span>{s.video?.title}</span>
                <span
                  className={
                    s.status === 'approved' ? 'text-green-400' : s.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                  }
                >
                  {s.status === 'approved' ? `+${s.reward_tokens} tokens` : s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingVideo && (
        <SubmitTagsModal video={editingVideo} userId={userId} onClose={() => setEditingVideo(null)} onSubmitted={() => { setEditingVideo(null); load() }} />
      )}
    </div>
  )
}

function SubmitTagsModal({
  video,
  userId,
  onClose,
  onSubmitted,
}: {
  video: VideoRow
  userId: string
  onClose: () => void
  onSubmitted: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    if (!title.trim() && !description.trim()) {
      setError('Suggest at least a title or description')
      return
    }
    setSaving(true)
    const { error: insertError } = await supabase.from('video_tag_submissions').insert({
      video_id: video.id,
      submitted_by: userId,
      suggested_title: title.trim() || null,
      suggested_description: description.trim() || null,
      suggested_tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    onSubmitted()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-cyan-500/30 rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Suggest tags for "{video.title}"</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        {error && <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-xs">{error}</div>}
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Better title (optional)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Tags, comma separated (optional)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="cosplay, blonde, roleplay" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" />
          </div>
          <button
            onClick={submit}
            disabled={saving}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white py-2 rounded font-semibold text-sm flex items-center justify-center gap-2 transition"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            {saving ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
