import { useState, useEffect } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { supabase } from '../supabaseClient'

/**
 * Every account starts as a viewer, same as every competitor -- this
 * gates anything creator-only (Go Live, Analytics, listing perks/
 * bundles/videos) behind an explicit opt-in rather than showing it to
 * everyone by default. Sets users.is_streamer, the same flag the
 * discovery feed already keys off of.
 */
export default function BecomeCreatorGate({
  userId,
  children,
}: {
  userId: string
  children: React.ReactNode
}) {
  const [isCreator, setIsCreator] = useState<boolean | null>(null)
  const [becoming, setBecoming] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const check = async () => {
    const { data } = await supabase.from('users').select('is_streamer').eq('id', userId).single()
    setIsCreator(!!data?.is_streamer)
  }

  useEffect(() => {
    check()
  }, [userId])

  const becomeCreator = async () => {
    setBecoming(true)
    await supabase.from('users').update({ is_streamer: true }).eq('id', userId)
    setBecoming(false)
    setIsCreator(true)
  }

  if (isCreator === null) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-gray-500" size={24} />
      </div>
    )
  }

  if (isCreator) {
    return <>{children}</>
  }

  return (
    <div className="max-w-md mx-auto bg-gray-900 border border-purple-500/30 rounded-lg p-6 text-center">
      <Sparkles className="mx-auto text-yellow-400 mb-3" size={32} />
      <h2 className="text-xl font-bold mb-2">Become a Creator</h2>
      <p className="text-sm text-gray-400 mb-4">
        Streaming, selling videos and photos, perks, private shows — all of it needs a Creator account first. Viewer
        accounts can watch, tip, and buy, but need to opt in to sell.
      </p>
      <label className="flex items-start gap-2 text-xs text-gray-400 mb-4 text-left">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
        I agree to the Creator terms, including identity verification before I can go live or sell content.
      </label>
      <button
        onClick={becomeCreator}
        disabled={!agreed || becoming}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 disabled:opacity-40 text-white py-2.5 rounded-lg font-bold transition"
      >
        {becoming ? 'Setting up...' : 'Become a Creator'}
      </button>
    </div>
  )
}
