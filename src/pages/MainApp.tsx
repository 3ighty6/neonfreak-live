import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { LogOut, Home, Radio, Zap, User, Search } from 'lucide-react'
import HomePage from './HomePage'
import GoLivePage from './GoLivePage'
import TokenShopPage from './TokenShopPage'
import ProfilePage from './ProfilePage'

type Page = 'home' | 'golive' | 'tokens' | 'profile'

export default function MainApp({ user }: { user: any }) {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [searchOpen, setSearchOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Mobile Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-cyan-500/20 md:hidden z-40">
        <div className="flex justify-around">
          <button onClick={() => setCurrentPage('home')} className={`flex-1 py-3 flex justify-center ${currentPage === 'home' ? 'text-cyan-400' : 'text-gray-400'}`}>
            <Home size={24} />
          </button>
          <button onClick={() => setCurrentPage('golive')} className={`flex-1 py-3 flex justify-center ${currentPage === 'golive' ? 'text-cyan-400' : 'text-gray-400'}`}>
            <Radio size={24} />
          </button>
          <button onClick={() => setCurrentPage('tokens')} className={`flex-1 py-3 flex justify-center ${currentPage === 'tokens' ? 'text-cyan-400' : 'text-gray-400'}`}>
            <Zap size={24} />
          </button>
          <button onClick={() => setCurrentPage('profile')} className={`flex-1 py-3 flex justify-center ${currentPage === 'profile' ? 'text-cyan-400' : 'text-gray-400'}`}>
            <User size={24} />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:left-0 md:top-0 md:w-64 md:h-screen md:bg-black/50 md:border-r md:border-cyan-500/20 md:p-6 md:flex md:flex-col">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 mb-8">
          💬 Neon Chat
        </h1>

        <nav className="flex-1 space-y-2">
          <button onClick={() => setCurrentPage('home')} className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${currentPage === 'home' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <Home size={20} /> Home
          </button>
          <button onClick={() => setCurrentPage('golive')} className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${currentPage === 'golive' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <Radio size={20} /> Go Live
          </button>
          <button onClick={() => setCurrentPage('tokens')} className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${currentPage === 'tokens' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <Zap size={20} /> Buy Tokens
          </button>
          <button onClick={() => setCurrentPage('profile')} className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${currentPage === 'profile' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <User size={20} /> Profile
          </button>
        </nav>

        <button onClick={handleLogout} className="w-full px-4 py-3 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition flex items-center gap-3">
          <LogOut size={20} /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 pb-20 md:pb-0">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'golive' && <GoLivePage userId={user.id} />}
        {currentPage === 'tokens' && <TokenShopPage userId={user.id} />}
        {currentPage === 'profile' && <ProfilePage userId={user.id} />}
      </div>
    </div>
  )
}
