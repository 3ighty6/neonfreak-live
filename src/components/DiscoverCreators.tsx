import { Video, Image, Star, Sparkles } from 'lucide-react'

interface Creator {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  is_verified: boolean
  is_ai_creator: boolean
  followers_count: number
  created_at: string
  has_streamed: boolean
  video_count: number
  bundle_count: number
  perk_count: number
  promotionTier?: string | null
}

function CreatorTile({ creator, onClick }: { creator: Creator; onClick: () => void }) {
  return (
    <button onClick={onClick} className="neon-card group text-left p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center text-xl overflow-hidden flex-shrink-0 ring-2 ring-white/10 group-hover:ring-cyan-400/40 transition">
          {creator.avatar_url ? (
            <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            '👤'
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold truncate group-hover:text-pink-400 transition">{creator.username}</span>
            {creator.is_verified && <span className="text-cyan-400 text-xs flex-shrink-0">✓</span>}
          </div>
          <div className="text-xs text-gray-500">{creator.followers_count} followers</div>
        </div>
        {creator.promotionTier && (
          <span
            className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
              creator.promotionTier === 'elite'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
                : creator.promotionTier === 'featured'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-purple-600 text-white'
            }`}
          >
            {creator.promotionTier}
          </span>
        )}
      </div>
      {creator.bio && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{creator.bio}</p>}
      <div className="flex gap-3 text-xs text-gray-500">
        {creator.video_count > 0 && (
          <span className="flex items-center gap-1">
            <Video size={12} /> {creator.video_count}
          </span>
        )}
        {creator.bundle_count > 0 && (
          <span className="flex items-center gap-1">
            <Image size={12} /> {creator.bundle_count}
          </span>
        )}
        {creator.perk_count > 0 && (
          <span className="flex items-center gap-1">
            <Star size={12} /> {creator.perk_count}
          </span>
        )}
        {creator.is_ai_creator && <span className="bg-purple-600 text-white px-1.5 rounded-full">AI</span>}
      </div>
    </button>
  )
}

export default function DiscoverCreators({
  creators,
  onSelectCreator,
}: {
  creators: Creator[]
  onSelectCreator?: (id: string) => void
}) {
  const sortedByFollowers = [...creators].sort((a, b) => b.followers_count - a.followers_count)
  const newest = [...creators]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  if (creators.length === 0) return null

  return (
    <div className="mt-10">
      {newest.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-yellow-400" />
            <h2 className="text-xl font-bold">New Creators</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {newest.map((c) => (
              <CreatorTile key={c.id} creator={c} onClick={() => onSelectCreator?.(c.id)} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold mb-3">Discover Creators</h2>
        <p className="text-sm text-gray-500 mb-4">Not everyone's live right now — browse creators and what they're selling.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sortedByFollowers.map((c) => (
            <CreatorTile key={c.id} creator={c} onClick={() => onSelectCreator?.(c.id)} />
          ))}
        </div>
      </div>
    </div>
  )
}
