export type User = {
  id: string
  username: string
  email: string
  avatar_url?: string
  bio?: string
  is_streamer: boolean
  created_at: string
}

export type Room = {
  id: string
  streamer_id: string
  title: string
  description?: string
  is_live: boolean
  viewer_count: number
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  room_id: string
  user_id: string
  content: string
  created_at: string
  user?: { username: string; avatar_url?: string }
}

export type Reaction = {
  id: string
  room_id: string
  user_id: string
  reaction_type: string
  created_at: string
  user?: { username: string }
}

export type Tip = {
  id: string
  room_id: string
  sender_id: string
  receiver_id: string
  amount: number
  message?: string
  created_at: string
}
