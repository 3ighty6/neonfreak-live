import { useState, useEffect } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface Review {
  id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  users: { username: string } | null
}

export default function ContentReviews({
  contentType,
  contentId,
  userId,
  canReview,
}: {
  contentType: 'video' | 'bundle'
  contentId: string
  userId: string
  canReview: boolean
}) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const { data } = await supabase
      .from('content_reviews')
      .select('id, user_id, rating, comment, created_at, users:user_id(username)')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .order('created_at', { ascending: false })
    setReviews((data as any) || [])
    const mine = (data || []).find((r: any) => r.user_id === userId)
    if (mine) {
      setMyRating(mine.rating)
      setMyComment(mine.comment || '')
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [contentType, contentId])

  const submit = async () => {
    setError('')
    if (myRating < 1) {
      setError('Pick a star rating')
      return
    }
    setSubmitting(true)
    const { error: rpcError } = await supabase.rpc('submit_content_review', {
      p_content_type: contentType,
      p_content_id: contentId,
      p_rating: myRating,
      p_comment: myComment,
    })
    setSubmitting(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    load()
  }

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={16} className="text-cyan-400" />
        <h3 className="font-semibold text-sm">Reviews {reviews.length > 0 && `(${reviews.length})`}</h3>
        {reviews.length > 0 && (
          <span className="flex items-center gap-1 text-yellow-400 text-sm">
            <Star size={14} fill="currentColor" /> {avgRating.toFixed(1)}
          </span>
        )}
      </div>

      {canReview && (
        <div className="bg-gray-800 rounded-lg p-3 mb-3">
          {error && <div className="text-red-400 text-xs mb-2">{error}</div>}
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setMyRating(n)}>
                <Star size={20} className={n <= myRating ? 'text-yellow-400' : 'text-gray-600'} fill={n <= myRating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <textarea
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            placeholder="Leave a comment (optional)"
            rows={2}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm mb-2"
          />
          <button
            onClick={submit}
            disabled={submitting}
            className="bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm font-semibold transition"
          >
            {submitting ? 'Saving...' : 'Submit Review'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-gray-500">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-gray-500">No reviews yet.</p>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="bg-gray-800/50 rounded p-3 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{r.users?.username || 'User'}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={12} className={n <= r.rating ? 'text-yellow-400' : 'text-gray-700'} fill={n <= r.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-gray-300">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
