import { Users, Heart } from 'lucide-react'

export default function LiveStreamCard({
  stream,
  onClick,
  onCreatorClick,
}: {
  stream: any
  onClick?: () => void
  onCreatorClick?: (creatorId: string) => void
}) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-lg overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition"
    >
      {/* Thumbnail */}
      <div className="relative bg-gradient-to-b from-purple-600/30 to-black h-40 overflow-hidden">
        {stream.thumbnail_url ? (
          <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500">Stream Preview</div>
          </div>
        )}
        {stream.promotionTier && (
          <div
            className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold ${
              stream.promotionTier === 'elite'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
                : stream.promotionTier === 'featured'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-purple-600 text-white'
            }`}
          >
            {stream.promotionTier === 'elite' ? '👑 Elite' : stream.promotionTier === 'featured' ? '⭐ Featured' : '🚀 Boosted'}
          </div>
        )}
        <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          LIVE
        </div>
      </div>

      {/* Info */}
      <div className="bg-black/50 p-3">
        <h3 className="font-semibold text-white line-clamp-2 mb-2">{stream.title}</h3>
        <p
          onClick={(e) => {
            if (onCreatorClick && stream.streamer_id) {
              e.stopPropagation()
              onCreatorClick(stream.streamer_id)
            }
          }}
          className="text-sm text-gray-400 mb-3 hover:text-cyan-400 transition w-fit flex items-center gap-1.5"
        >
          {stream.users?.username}
          {stream.users?.is_ai_creator && (
            <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">AI</span>
          )}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Users size={16} />
            {stream.viewer_count} viewers
          </div>
          <button className="text-red-500 hover:text-red-400">
            <Heart size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
