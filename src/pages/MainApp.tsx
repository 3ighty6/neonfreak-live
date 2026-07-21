import { useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import { LogOut, Home, Radio, BarChart3, Film, User, Heart } from 'lucide-react'
import HomePage from './HomePage'
import StreamSetupPage from './StreamSetupPage'
import TipPage from './TipPage'
import AnalyticsDashboard from './AnalyticsDashboard'
import VODLibrary from './VODLibrary'
import ProfilePage from './ProfilePage'

type Page = 'home' | 'setup' | 'tips' | 'analytics' | 'vods' | 'profile'

interface MainAppProps {
  session: Session
}

export default function MainApp({ session }: MainAppProps) {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const user = session.user

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'setup', label: 'Go Live', icon: Radio },
    { id: 'tips', label: 'Tips', icon: Heart },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'vods', label: 'Videos', icon: Film },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-cyan-500/20 md:hidden z-40">
        <div className="flex justify-around overflow-x-auto">
          {navItems.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentPage(id as Page)}
              className={`flex-1 py-3 flex justify-center transition min-w-max ${
                currentPage === id ? 'text-cyan-400 border-t-2 border-cyan-400' : 'text-gray-400'
              }`}
            >
              <Icon size={24} />
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:left-0 md:top-0 md:w-64 md:h-screen md:bg-black/95 md:border-r md:border-cyan-500/20 md:flex md:flex-col md:z-50">
        <div className="p-6 border-b border-cyan-500/20">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
            Neon Chat
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentPage(id as Page)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                currentPage === id
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400 mb-3 truncate">{user.email}</div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold flex items-center justify-center gap-2 transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 pb-20 md:pb-0">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'setup' && <StreamSetupPage />}
        {currentPage === 'tips' && <TipPage />}
        {currentPage === 'analytics' && <AnalyticsDashboard userId={user.id} />}
        {currentPage === 'vods' && <VODLibrary userId={user.id} />}
        {currentPage === 'profile' && <ProfilePage />}
      </div>
    </div>
  )
}
