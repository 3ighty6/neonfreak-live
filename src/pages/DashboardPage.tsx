import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { LogOut, Radio, Home, Grid3x3, User } from 'lucide-react'
import BrowseStreams from '../components/BrowseStreams'
import GoLive from '../components/GoLive'
import ProfilePage from '../components/ProfilePage'

type Page = 'home' | 'browse' | 'golive' | 'profile'

export default function DashboardPage({ user }: { user: any }) {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    // Fetch user profile
    supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setUserProfile(data))
  }, [user.id])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'browse', label: 'Browse', icon: Grid3x3 },
    { id: 'golive', label: 'Go Live', icon: Radio },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            🔥 NeonFreak
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as Page)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  currentPage === item.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 transition"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {currentPage === 'home' && (
          <div className="p-8">
            <h2 className="text-3xl font-bold mb-8">Welcome, {userProfile?.username}!</h2>
            <BrowseStreams />
          </div>
        )}
        {currentPage === 'browse' && <BrowseStreams />}
        {currentPage === 'golive' && <GoLive userId={user.id} />}
        {currentPage === 'profile' && <ProfilePage userId={user.id} />}
      </div>
    </div>
  )
}
