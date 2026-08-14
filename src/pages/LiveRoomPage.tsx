import { useState, useEffect, useRef } from 'react'
import { Session } from '@supabase/supabase-js'
import Hls from 'hls.js'
import { supabase } from '../supabaseClient'
import { TOKEN_PACKAGES, createTokenCheckout } from '../lib/stripe'
import { Send, Heart, HeartOff, Users, Share2, ArrowLeft, ShoppingCart, Flag, X } from 'lucide-react'

interface LiveRoomPageProps {
  session: Session
  roomId: string
  onBack?: () => void
  onOpenCreator?: (creatorId: string) => void
}

interface RoomInfo {
  id: string
  title: string
  streamer_id: string
  hls_url: string | null
  is_live: boolean
  viewer_count: number
  users?: { username: string }
}

interface ChatMessage {
  id: string
  user_id: string
  content: string
  username?: string
}

export default function LiveRoomPage({ session, roomId, onBack, onOpenCreator }: LiveRoomPageProps) {
  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [tips, setTips] = useState<{ amount: number }[]>([])
  const [tipError, setTipError] = useState('')
  const [tokenBalance, setTokenBalance] = useState<number | null>(null)
  const [tipping, setTipping] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [showBuyPrompt, setShowBuyPrompt] = useState(false)
  const [buyLoading, setBuyLoading] = useState<number | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const TIP_AMOUNTS = [
    { amount: 1, emoji: '💬', label: 'Say Hi' },
    { amount: 5, emoji: '👋', label: 'Wave' },
    { amount: 10, emoji: '🎁', label: 'Gift' },
    { amount: 25, emoji: '❤️', label: 'Love' },
    { amount: 50, emoji: '🔥', label: 'Fire' },
  ]

  useEffect(() => {
    const loadBalance = async () => {
      const { data } = await supabase.from('users').select('token_balance').eq('id', session.user.id).single()
      setTokenBalance(data?.token_balance ?? 0)
    }
    loadBalance()
  }, [session.user.id])

  // Load room info
  useEffect(() => {
    const loadRoom = async () => {
      const { data } = await supabase
        .from('rooms')
        .select('id, title, streamer_id, hls_url, is_live, viewer_count, users:streamer_id(username)')
        .eq('id', roomId)
        .single()
      if (data) {
        setRoom(data as unknown as RoomInfo)
        const { data: followRow } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', session.user.id)
          .eq('streamer_id', data.streamer_id)
          .maybeSingle()
        setIsFollowing(!!followRow)
      }
    }
    loadRoom()
  }, [roomId, session.user.id])

  const toggleFollow = async () => {
    if (!room) return
    setFollowLoading(true)
    if (isFollowing) {
      await supabase
        .from('followers')
        .delete()
        .eq('follower_id', session.user.id)
        .eq('streamer_id', room.streamer_id)
      setIsFollowing(false)
    } else {
      await supabase
        .from('followers')
        .insert({ follower_id: session.user.id, streamer_id: room.streamer_id })
      setIsFollowing(true)
    }
    setFollowLoading(false)
  }

  const submitReport = async () => {
    if (!room || !reportReason) return
    setReportSubmitting(true)
    const { error: reportError } = await supabase.from('reports').insert({
      reporter_id: session.user.id,
      reported_user_id: room.streamer_id,
      room_id: roomId,
      reason: reportReason,
      details: reportDetails.trim() || null,
    })
    setReportSubmitting(false)
    if (!reportError) {
      setReportSubmitted(true)
      setTimeout(() => {
        setShowReportModal(false)
        setReportSubmitted(false)
        setReportReason('')
        setReportDetails('')
      }, 1500)
    }
  }

  const handleBuyTokens = async (packageIndex: number) => {
    setBuyLoading(packageIndex)
    try {
      const { url } = await createTokenCheckout(session.user.id, packageIndex, roomId)
      if (url) window.location.href = url
    } catch (err) {
      setTipError(err instanceof Error ? err.message : 'Failed to start checkout')
      setBuyLoading(null)
    }
  }

  // Wire up HLS playback once we know the playback URL
  useEffect(() => {
    const video = videoRef.current
    if (!video || !room?.hls_url) return

    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(room.hls_url)
      hls.attachMedia(video)
      return () => hls.destroy()
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari/iOS supports HLS natively
      video.src = room.hls_url
    }
  }, [room?.hls_url])

  // Load recent chat history with usernames
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, user_id, content, users:user_id(username)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (data) {
        setMessages(
          data.map((m: any) => ({
            id: m.id,
            user_id: m.user_id,
            content: m.content,
            username: m.users?.username,
          }))
        )
      }
    }
    loadMessages()
  }, [roomId])

  // Subscribe to new messages
  useEffect(() => {
    const subscription = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const row = payload.new as any
          const { data: userRow } = await supabase
            .from('users')
            .select('username')
            .eq('id', row.user_id)
            .single()
          setMessages((prev) => [
            ...prev,
            { id: row.id, user_id: row.user_id, content: row.content, username: userRow?.username },
          ])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [roomId])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      user_id: session.user.id,
      content: newMessage.trim(),
    })
    if (!error) setNewMessage('')
  }

  const sendTip = async (amount: number) => {
    setTipError('')
    if (!room) return
    if (room.streamer_id === session.user.id) {
      setTipError("You can't tip your own stream")
      return
    }
    if (tokenBalance !== null && tokenBalance < amount) {
      setShowBuyPrompt(true)
      return
    }

    setTipping(true)
    const { data, error } = await supabase.rpc('send_room_tip', {
      p_room_id: roomId,
      p_amount: amount,
    })
    setTipping(false)

    if (error) {
      if (error.message.includes('Insufficient token balance')) {
        setShowBuyPrompt(true)
        return
      }
      setTipError(error.message)
      return
    }

    setTokenBalance(data?.newBalance ?? tokenBalance)
    setTips((prev) => [...prev, { amount }])
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Video Player */}
      <div className="flex-1 bg-gray-900 relative overflow-hidden">
        {room?.hls_url ? (
          <video ref={videoRef} controls autoPlay muted className="w-full h-full object-contain bg-black" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🎥</div>
              <div className="text-gray-400">
                {room?.is_live ? 'Waiting for stream to connect...' : 'Stream is offline'}
              </div>
            </div>
          </div>
        )}

        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 bg-black/70 hover:bg-black/90 p-2 rounded-lg text-white flex items-center gap-2 px-3"
          >
            <ArrowLeft size={18} /> Back
          </button>
        )}

        <div className="absolute top-4 right-4 flex gap-4 items-center">
          <div className="bg-black/70 px-4 py-2 rounded-lg flex gap-4">
            <div className="flex items-center gap-2 text-white">
              <Users size={16} />
              <span>{room?.viewer_count ?? 0} viewers</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-400">
              <Heart size={16} />
              <span>{tips.length} tips</span>
            </div>
          </div>
          {room && room.streamer_id !== session.user.id && (
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition flex items-center gap-2 disabled:opacity-50 ${
                isFollowing
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-pink-500 text-white hover:bg-pink-600'
              }`}
            >
              {isFollowing ? <HeartOff size={16} /> : <Heart size={16} />}
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          <button className="bg-cyan-500/20 hover:bg-cyan-500/40 p-2 rounded-lg text-cyan-400">
            <Share2 size={20} />
          </button>
          {room && room.streamer_id !== session.user.id && (
            <button
              onClick={() => setShowReportModal(true)}
              className="bg-red-500/20 hover:bg-red-500/40 p-2 rounded-lg text-red-400"
              title="Report this stream"
            >
              <Flag size={20} />
            </button>
          )}
        </div>

        {room?.title && (
          <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-2 rounded-lg text-white">
            <div className="font-semibold">{room.title}</div>
            {room.users?.username && (
              <button
                onClick={() => onOpenCreator?.(room.streamer_id)}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition"
              >
                {room.users.username}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Chat & Tips Section */}
      <div className="h-80 bg-gray-950 border-t border-cyan-500/20 flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col border-r border-cyan-500/20">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <span className="text-cyan-400 font-semibold">{msg.username || 'User'}:</span>
                <span className="text-gray-300 ml-2">{msg.content}</span>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>

          <div className="border-t border-gray-800 p-3 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Send a message..."
              className="flex-1 bg-gray-900 text-white rounded px-3 py-2 text-sm border border-gray-800 focus:border-cyan-500 outline-none"
            />
            <button
              onClick={sendMessage}
              className="bg-cyan-500 hover:bg-cyan-600 text-black px-3 py-2 rounded font-semibold flex items-center gap-1"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        <div className="w-full md:w-48 p-3 flex flex-col gap-2 border-t md:border-t-0 md:border-l border-gray-800">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Quick Tips</div>
          {tokenBalance !== null && (
            <div className="text-xs text-cyan-400 mb-2">Balance: {tokenBalance} tokens</div>
          )}
          {tipError && <div className="text-xs text-red-400 mb-1">{tipError}</div>}
          {TIP_AMOUNTS.map((tip) => (
            <button
              key={tip.amount}
              onClick={() => sendTip(tip.amount)}
              disabled={tipping}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-2 rounded text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <span>{tip.emoji}</span>
              <span>{tip.amount} tokens</span>
            </button>
          ))}
        </div>
      </div>

      {/* Buy Tokens popup — shown when a tip fails for insufficient balance */}
      {showBuyPrompt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-cyan-500/30 rounded-lg w-full max-w-sm p-6">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="text-cyan-400" size={22} />
              <h2 className="text-lg font-bold">Not enough tokens</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              You have {tokenBalance ?? 0} tokens. Grab a package to keep tipping.
            </p>

            <div className="space-y-2 mb-4">
              {TOKEN_PACKAGES.map((pkg, idx) => (
                <button
                  key={idx}
                  onClick={() => handleBuyTokens(idx)}
                  disabled={buyLoading !== null}
                  className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 rounded px-4 py-3 transition"
                >
                  <span className="text-sm">
                    <span className="font-semibold text-cyan-400">{pkg.tokens + pkg.bonus} tokens</span>
                    {pkg.popular && <span className="ml-2 text-xs text-cyan-500">POPULAR</span>}
                  </span>
                  <span className="font-semibold">
                    {buyLoading === idx ? '...' : `$${pkg.priceUSD.toFixed(2)}`}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowBuyPrompt(false)}
              disabled={buyLoading !== null}
              className="w-full text-sm text-gray-400 hover:text-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-lg w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flag className="text-red-400" size={20} />
                <h2 className="text-lg font-bold">Report this stream</h2>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="text-center py-6 text-green-400">Report submitted. Thank you.</div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {['Underage concern', 'Non-consensual content', 'Harassment', 'Spam or scam', 'Other'].map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setReportReason(reason)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                        reportReason === reason
                          ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                          : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Additional details (optional)"
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white mb-4"
                />
                <button
                  onClick={submitReport}
                  disabled={!reportReason || reportSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded font-semibold transition"
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
