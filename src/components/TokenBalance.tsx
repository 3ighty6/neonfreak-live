import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'

interface TokenBalanceProps {
  userId?: string
}

export default function TokenBalance({ userId }: TokenBalanceProps) {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    // Fetch token balance from Supabase
    const fetchBalance = async () => {
      try {
        const response = await fetch(`/api/get-token-balance?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setBalance(data.balance || 0)
        }
      } catch (error) {
        console.error('Failed to fetch token balance:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()
  }, [userId])

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-700 px-3 py-1 rounded-full">
      <Zap size={18} className="text-yellow-300" />
      <span className="font-bold text-white">{balance}</span>
      <span className="text-xs text-yellow-100">tokens</span>
    </div>
  )
}
