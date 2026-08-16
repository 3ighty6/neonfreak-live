import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import { LogOut, Home, Radio, BarChart3, Film, User, Heart, ShieldCheck, MessageCircle } from 'lucide-react'
import HomePage from './HomePage'
import GoLiveWizard from './GoLiveWizard'
import TipPage from './TipPage'
import AnalyticsDashboard from './AnalyticsDashboard'
import VODLibrary from './VODLibrary'
import ProfilePage from './ProfilePage'
import LiveRoomPage from './LiveRoomPage'
import AdminDashboard from './AdminDashboard'
import CreatorProfilePage from './CreatorProfilePage'
import AIProfilePage from './AIProfilePage'
import MessagesPage from './MessagesPage'
import Footer from '../components/Footer'
import logoWordmark from '../assets/logo-wordmark.png'
import BecomeCreatorGate from '../components/BecomeCreatorGate'

type Page = 'home' | 'setup' | 'tips' | 'analytics' | 'vods' | 'profile' | 'live' | 'admin' | 'creator' | 'messages' | 'aiProfile'

interface MainAppProps {
  session: Session
}

export default function MainApp({ session }: MainAppProps) {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('room') ? 'live' : 'home'
  })
  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('room')
  })
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeCreatorId, setActiveCreatorId] = useState<string | null>(null)
  const [activeAIProfileId, setActiveAIProfileId] = useState<string | null>(null)
  const [messagesTargetUserId, setMessagesTargetUserId] = useState<string | null>(null)

  useEffect(() => {
    // Clean the checkout/room params out of the visible URL once read
    if (window.location.search.includes('room=') || window.location.search.includes('checkout=')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])
  const user = session.user

  useEffect(() => {
    const handler = () => setCurrentPage('profile')
    window.addEventListener('navigate-to-profile', handler)
    return () => window.removeEventListener('navigate-to-profile', handler)
  }, [])

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
      setIsAdmin(!!data?.is_admin)
    }
    checkAdmin()
  }, [user.id])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const openRoom = (roomId: string) => {
    setActiveRoomId(roomId)
    setCurrentPage('live')
  }

  const openCreator = (creatorId: string) => {
    setActiveCreatorId(creatorId)
    setCurrentPage('creator')
  }

  const openAIProfile = (profileId: string) => {
    setActiveAIProfileId(profileId)
    setCurrentPage('aiProfile')
  }

  const openMessages = (otherUserId?: string) => {
    setMessagesTargetUserId(otherUserId || null)
    setCurrentPage('messages')
  }

  const navItems: { id: Page; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'setup', label: 'Go Live', icon: Radio },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'tips', label: 'Tips', icon: Heart },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'vods', label: 'Videos', icon: Film },
    { id: 'profile', label: 'Profile', icon: User },
    ...(isAdmin ? [{ id: 'admin' as Page, label: 'Admin', icon: ShieldCheck }] : []),
  ]

  if (currentPage === 'live' && activeRoomId) {
    return (
      <LiveRoomPage
        session={session}
        roomId={activeRoomId}
        onBack={() => {
          setCurrentPage('home')
          setActiveRoomId(null)
        }}
        onOpenCreator={openCreator}
      />
    )
  }

  if (currentPage === 'creator' && activeCreatorId) {
    return (
      <CreatorProfilePage
        session={session}
        creatorId={activeCreatorId}
        onBack={() => {
          setCurrentPage('home')
          setActiveCreatorId(null)
        }}
        onOpenSetup={() => setCurrentPage('setup')}
        onOpenMessages={openMessages}
      />
    )
  }

  if (currentPage === 'aiProfile' && activeAIProfileId) {
    return (
      <AIProfilePage
        profileId={activeAIProfileId}
        onBack={() => {
          setCurrentPage('home')
          setActiveAIProfileId(null)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-pink-500/30 md:hidden z-40">
        <div className="flex justify-around overflow-x-auto">
          {navItems.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentPage(id)}
              className={`flex-1 py-3 flex justify-center transition min-w-max ${
                currentPage === id ? 'text-pink-400 border-t-2 border-pink-500' : 'text-gray-400 hover:text-cyan-300'
              }`}
            >
              <Icon size={24} className={`neon-icon-glow ${currentPage === id ? 'active' : ''}`} />
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex-1 py-3 flex justify-center transition min-w-max text-gray-400 hover:text-pink-400"
          >
            <LogOut size={24} className="neon-icon-glow" />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:left-0 md:top-0 md:w-64 md:h-screen md:bg-gradient-to-b md:from-[#0d0a1a] md:to-black md:border-r md:border-white/5 md:flex md:flex-col md:z-50">
        <div className="p-6 border-b border-pink-500/30">
          <img src={logoWordmark} alt="NeonLights" className="h-8 w-auto drop-shadow-[0_0_12px_rgba(255,45,149,0.4)]" />
          <p className="text-xs text-cyan-400 mt-1">Watch. Tip. Or Become a Creator.</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentPage(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                currentPage === id
                  ? 'bg-white/5 text-cyan-300 font-semibold border border-cyan-400/30 shadow-[0_0_16px_-4px_rgba(0,240,255,0.4)]'
                  : 'text-gray-400 hover:text-cyan-300 hover:bg-white/5'
              }`}
            >
              <Icon size={20} className={`neon-icon-glow ${currentPage === id ? 'active' : ''}`} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-pink-500/30">
          <div className="text-sm text-gray-300 mb-3 truncate">{user.email}</div>
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-pink-500/30"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 pb-20 md:pb-0">
        {currentPage === 'home' && <HomePage session={session} onSelectStream={openRoom} onSelectCreator={openCreator} onSelectAIProfile={openAIProfile} />}
        {currentPage === 'setup' && (
          <BecomeCreatorGate userId={user.id}>
            <GoLiveWizard session={session} />
          </BecomeCreatorGate>
        )}
        {currentPage === 'tips' && <TipPage />}
        {currentPage === 'analytics' && (
          <BecomeCreatorGate userId={user.id}>
            <AnalyticsDashboard userId={user.id} />
          </BecomeCreatorGate>
        )}
        {currentPage === 'vods' && <VODLibrary session={session} userId={user.id} />}
        {currentPage === 'profile' && <ProfilePage onViewPublicProfile={() => openCreator(user.id)} onOpenAIProfile={openAIProfile} />}
        {currentPage === 'messages' && <MessagesPage session={session} initialOtherUserId={messagesTargetUserId} />}
        {currentPage === 'admin' && isAdmin && <AdminDashboard onOpenMessages={openMessages} />}
        <Footer />
      </div>
    </div>
  )
}
