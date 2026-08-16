import { useState } from 'react'
import { Users, Heart } from 'lucide-react'

// Extracts the Mux playback ID from an HLS URL (https://stream.mux.com/{id}.m3u8)
// so we can hit Mux's Image API directly -- works on active live
// streams too via ?latest=true, refreshed within 10s of the live edge.
function getMuxPlaybackId(hlsUrl: string | null | undefined): string | null {
  if (!hlsUrl) return null
  const match = hlsUrl.match(/stream\.mux\.com\/([^.]+)\.m3u8/)
  return match ? match[1] : null
}

export default function LiveStreamCard({
  stream,
  onClick,
  onCreatorClick,
  viewerIsVip,
}: {
  stream: any
  onClick?: () => void
  onCreatorClick?: (creatorId: string) => void
  viewerIsVip?: boolean
}) {
  const [hovering, setHovering] = useState(false)
  const playbackId = getMuxPlaybackId(stream.hls_url)
  const showAnimatedPreview = hovering && viewerIsVip

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="neon-card group cursor-pointer overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative bg-gradient-to-b from-purple-600/30 to-black h-40 overflow-hidden">
        {playbackId ? (
          <>
            <img
              src={`https://image.mux.com/${playbackId}/thumbnail.jpg?width=400&latest=true`}
              alt={stream.title}
              className={`w-full h-full object-cover transition-opacity duration-200 ${showAnimatedPreview ? 'opacity-0' : 'opacity-100'}`}
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            {/* Animated preview on hover -- VIP only. Mux's Image API
                also serves GIFs from live streams, not just VOD */}
            <img
              src={`https://image.mux.com/${playbackId}/animated.gif?width=400&latest=true`}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${showAnimatedPreview ? 'opacity-100' : 'opacity-0'}`}
            />
            {hovering && !viewerIsVip && (
              <div className="absolute bottom-2 left-2 bg-black/80 text-amber-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                👑 VIP sees a live preview here
              </div>
            )}
          </>
        ) : stream.thumbnail_url ? (
          <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500">Stream Preview</div>
          </div>
        )}
        {/* Soft vignette so the frame reads as a "neon window" rather than a flat crop */}
        <div className="absolute inset-0 shadow-[inset_0_0_40px_10px_rgba(0,0,0,0.6)] pointer-events-none" />
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
        <div className="absolute top-3 right-3 bg-gradient-to-r from-pink-600 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 live-badge-pulse">
          <span className="w-2 h-2 bg-white rounded-full"></span>
          LIVE
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-white line-clamp-2 mb-2">{stream.title}</h3>
        {stream.tags && stream.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {stream.tags.slice(0, 3).map((tag: string) => (
              <span key={tag} className="text-[10px] bg-white/5 border border-white/10 text-cyan-300 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
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
