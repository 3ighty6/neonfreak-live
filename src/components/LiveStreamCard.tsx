import { Users, Heart } from 'lucide-react'

export default function LiveStreamCard({ stream, onClick }: { stream: any; onClick?: () => void }) {
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
        <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          LIVE
        </div>
      </div>

      {/* Info */}
      <div className="bg-black/50 p-3">
        <h3 className="font-semibold text-white line-clamp-2 mb-2">{stream.title}</h3>
        <p className="text-sm text-gray-400 mb-3">{stream.users?.username}</p>
        
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
