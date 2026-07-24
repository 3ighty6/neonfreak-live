import { useState } from 'react'
import { Heart, MessageCircle, Share2, Edit, Camera, MoreVertical } from 'lucide-react'
import ProfileEditModal from '../components/ProfileEditModal'
import MediaUpload from '../components/MediaUpload'
import PhotoBundleShop from '../components/PhotoBundleShop'
import TokenBalance from '../components/TokenBalance'

interface CreatorProfile {
  id: string
  username: string
  bio: string
  avatar: string
  followers: number
  following: number
  isLive: boolean
  verified: boolean
  photos: Array<{ id: string; url: string; price: number }>
  videos: Array<{ id: string; url: string; title: string }>
}

export default function CreatorProfilePage() {
  const [profile, setProfile] = useState<CreatorProfile>({
    id: 'user-123',
    username: 'your_username',
    bio: 'Creator bio goes here...',
    avatar: 'https://via.placeholder.com/200',
    followers: 1250,
    following: 342,
    isLive: false,
    verified: false,
    photos: [],
    videos: [],
  })

  const [activeTab, setActiveTab] = useState<'photos' | 'videos' | 'bundles' | 'stats'>('photos')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [showVideoUpload, setShowVideoUpload] = useState(false)
  const [isOwnProfile] = useState(true) // Would be dynamic in real app

  const handleProfileUpdate = () => {
    // Refresh profile data
    console.log('Profile updated')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Header/Banner */}
      <div className="h-32 bg-gradient-to-r from-cyan-600/30 to-purple-600/30 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,255,0.1),transparent)]" />
      </div>

      {/* Profile Section */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="relative">
              <img
                src={profile.avatar}
                alt={profile.username}
                className="w-32 h-32 rounded-full border-4 border-cyan-500 object-cover"
              />
              {profile.isLive && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{profile.username}</h1>
                {profile.verified && (
                  <div className="bg-cyan-600 px-3 py-1 rounded-full text-xs font-semibold">
                    ✓ Verified
                  </div>
                )}
              </div>

              <p className="text-gray-400 mb-4">{profile.bio}</p>

              {/* Stats */}
              <div className="flex gap-8 mb-6">
                <div>
                  <div className="text-2xl font-bold text-cyan-400">{profile.followers}</div>
                  <div className="text-sm text-gray-400">Followers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyan-400">{profile.following}</div>
                  <div className="text-sm text-gray-400">Following</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">0</div>
                  <div className="text-sm text-gray-400">Total Earnings</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                {isOwnProfile ? (
                  <>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                      <Edit size={18} />
                      Edit Profile
                    </button>
                    <button className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition">
                      <Camera size={18} />
                      Stream Now
                    </button>
                  </>
                ) : (
                  <>
                    <button className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                      <Heart size={18} />
                      Follow
                    </button>
                    <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                      Send Tip
                    </button>
                    <button className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition">
                      <MessageCircle size={18} />
                      Message
                    </button>
                  </>
                )}
                <button className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition">
                  <Share2 size={18} />
                  Share
                </button>
              </div>
            </div>

            {/* Token Balance */}
            <div className="md:text-right">
              <TokenBalance userId={profile.id} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-700">
          <div className="flex gap-8">
            {(['photos', 'videos', 'bundles', 'stats'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 font-semibold transition capitalize ${
                  activeTab === tab
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab === 'bundles' ? 'Photo Bundles' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'photos' && (
            <>
              {isOwnProfile && (
                <button
                  onClick={() => setShowPhotoUpload(!showPhotoUpload)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  {showPhotoUpload ? 'Close' : 'Upload Photo'}
                </button>
              )}
              {showPhotoUpload && (
                <MediaUpload userId={profile.id} type="photo" />
              )}
              <div className="grid md:grid-cols-3 gap-4">
                {profile.photos.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    No photos yet
                  </div>
                ) : (
                  profile.photos.map((photo) => (
                    <div key={photo.id} className="relative group rounded-lg overflow-hidden">
                      <img
                        src={photo.url}
                        alt=""
                        className="w-full aspect-square object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="text-white font-bold">${photo.price}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'videos' && (
            <>
              {isOwnProfile && (
                <button
                  onClick={() => setShowVideoUpload(!showVideoUpload)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  {showVideoUpload ? 'Close' : 'Upload Video'}
                </button>
              )}
              {showVideoUpload && (
                <MediaUpload userId={profile.id} type="video" />
              )}
              <div className="grid md:grid-cols-2 gap-4">
                {profile.videos.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    No videos yet
                  </div>
                ) : (
                  profile.videos.map((video) => (
                    <div key={video.id} className="bg-gray-800 rounded-lg overflow-hidden">
                      <video
                        src={video.url}
                        className="w-full aspect-video object-cover"
                        controls
                      />
                      <div className="p-4">
                        <p className="font-semibold">{video.title}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'bundles' && (
            <PhotoBundleShop creatorId={profile.id} creatorName={profile.username} />
          )}

          {activeTab === 'stats' && (
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Total Streams</div>
                <div className="text-3xl font-bold text-cyan-400">0</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Total Tips</div>
                <div className="text-3xl font-bold text-cyan-400">$0</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Avg Viewers</div>
                <div className="text-3xl font-bold text-cyan-400">0</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Peak Viewers</div>
                <div className="text-3xl font-bold text-cyan-400">0</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProfileEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        userId={profile.id}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  )
}
