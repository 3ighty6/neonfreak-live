import { useEffect, useRef, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import {
  Search,
  Radio,
  MessageCircle,
  Zap,
  Plus,
  ChevronDown,
  Bookmark,
  Settings,
  MessageSquareWarning,
  LogOut,
  Gift,
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import ThemeToggle from './ThemeToggle'
import TokenPurchaseModal from './TokenPurchaseModal'

interface TopBarProps {
  session: Session
  searchQuery: string
  onSearchQueryChange: (q: string) => void
  onNavigate: (page: 'setup' | 'messages' | 'vods' | 'profile') => void
  onLogout: () => void
}

export default function TopBar({ session, searchQuery, onSearchQueryChange, onNavigate, onLogout }: TopBarProps) {
  const user = session.user
  const [profile, setProfile] = useState<{
    username: string
    avatar_url: string | null
    token_balance: number
    is_verified: boolean
    last_checkin_date: string | null
    checkin_streak: number
  } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const [checkinToast, setCheckinToast] = useState<string | null>(null)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const todayStr = new Date().toISOString().slice(0, 10)
  const alreadyCheckedInToday = profile?.last_checkin_date === todayStr

  const loadProfile = async () => {
    const { data } = await supabase
      .from('users')
      .select('username, avatar_url, token_balance, is_verified, last_checkin_date, checkin_streak')
      .eq('id', user.id)
      .single()
    if (data) setProfile(data)
  }

  useEffect(() => {
    loadProfile()
  }, [user.id])

  const handleCheckin = async () => {
    if (alreadyCheckedInToday || checkinLoading) return
    setCheckinLoading(true)
    const { data, error } = await supabase.rpc('claim_daily_checkin')
    setCheckinLoading(false)
    if (error) {
      setCheckinToast(error.message.includes('Already claimed') ? "You've already checked in today" : 'Something went wrong')
    } else {
      setCheckinToast(`+${data.tokensAwarded} tokens! Day ${data.streakDay} streak`)
      loadProfile()
    }
    setTimeout(() => setCheckinToast(null), 4000)
  }

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <>
      <div className="sticky top-0 z-30 bg-[#0d0a1a]/95 backdrop-blur border-b border-white/5 px-4 md:px-6 py-3 flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search creators, titles, or tags..."
            className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50"
          />
        </div>

        <div className="flex-1" />

        {/* Quick action icons */}
        <button
          onClick={() => onNavigate('setup')}
          title="Go Live"
          className="hidden sm:flex text-gray-400 hover:text-pink-400 transition"
        >
          <Radio size={20} className="neon-icon-glow" />
        </button>
        <button
          onClick={() => onNavigate('messages')}
          title="Messages"
          className="hidden sm:flex text-gray-400 hover:text-cyan-300 transition"
        >
          <MessageCircle size={20} className="neon-icon-glow" />
        </button>

        {/* Daily check-in */}
        <div className="relative hidden sm:flex">
          <button
            onClick={handleCheckin}
            disabled={alreadyCheckedInToday || checkinLoading}
            title={alreadyCheckedInToday ? 'Come back tomorrow for your next freebie' : 'Claim your daily free tokens'}
            className={`transition ${alreadyCheckedInToday ? 'text-gray-600' : 'text-gray-400 hover:text-yellow-300'}`}
          >
            <Gift size={20} className={alreadyCheckedInToday ? '' : 'neon-icon-glow'} />
          </button>
          {checkinToast && (
            <div className="absolute top-full right-0 mt-2 bg-[#151022] border border-yellow-500/30 rounded-lg px-3 py-2 text-xs text-yellow-300 whitespace-nowrap shadow-lg z-40">
              {checkinToast}
            </div>
          )}
        </div>

        {/* Token balance + buy */}
        <button
          onClick={() => setTokenModalOpen(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 pl-3 pr-2 py-1.5 rounded-full transition"
          title="Buy tokens"
        >
          <Zap size={16} className="text-yellow-200" />
          <span className="font-bold text-white text-sm">{profile?.token_balance ?? 0}</span>
          <span className="bg-white/20 rounded-full p-0.5">
            <Plus size={14} className="text-white" />
          </span>
        </button>

        {/* Avatar dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-full hover:bg-white/5 pl-1 pr-2 py-1 transition"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-pink-500/40" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
                {(profile?.username || user.email || '?')[0].toUpperCase()}
              </div>
            )}
            <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#151022] border border-white/10 rounded-xl shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="truncate">
                  <div className="font-semibold text-white truncate">{profile?.username || user.email}</div>
                  <div className="text-xs text-gray-400">{profile?.is_verified ? 'Verified Member' : 'Member'}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  setMenuOpen(false)
                  onNavigate('vods')
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition"
              >
                <Bookmark size={16} /> My Collection
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false)
                  onNavigate('profile')
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition"
              >
                <Settings size={16} /> Settings &amp; Privacy
              </button>

              <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-200 border-t border-white/10">
                <span>Dark Mode</span>
                <ThemeToggle />
              </div>

              <a
                href="mailto:support@neonlights.cam?subject=NeonLights%20Feedback"
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/5 transition border-t border-white/10"
              >
                <MessageSquareWarning size={16} /> Send Feedback
              </a>

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-pink-400 hover:bg-white/5 transition border-t border-white/10"
              >
                <LogOut size={16} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      <TokenPurchaseModal userId={user.id} isOpen={tokenModalOpen} onClose={() => setTokenModalOpen(false)} />
    </>
  )
}
