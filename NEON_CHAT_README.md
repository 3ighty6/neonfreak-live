# 🔥 Neon Chat - Live Streaming Platform

**Status:** ✅ Production Ready | 🚀 Deploying to Vercel

---

## Project Overview

**Neon Chat** is a professional, mobile-first live streaming platform designed to compete with Chaturbate and Plamfy. Built with React/TypeScript, Supabase, and Vercel.

### Key Features (MVP)

#### 🎬 Streaming & Video
- RTMP ingest (OBS compatible)
- HLS playback with quality options
- Live viewer count tracking
- VOD library & recording management

#### 💰 Monetization
- Token system (users buy credits)
- Tipping system ($1/$5/$10/$50/$100+)
- Tip goals & progress tracking
- Private shows ($/min)
- Earnings dashboard for streamers
- Leaderboards

#### 👥 Social Features
- Follow/favorite system
- User profiles with verification badges
- Real-time chat with moderation
- Ignore lists & blocked users
- Tip history tracking

#### 🔍 Discovery
- Browse by category (Music, Gaming, Chatting, Creative, Sports, Education)
- Search & filters
- Trending/featured streamers
- Mobile-first responsive design

#### 🎮 Creator Tools
- Streamer dashboard with stats
- Schedule management
- Stream settings (rules, bio, pricing)
- Custom stream titles & descriptions
- Blocked users management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Tailwind CSS |
| **Backend** | Supabase (PostgreSQL + Realtime) |
| **Deployment** | Vercel (production) |
| **Payments** | Stripe (token purchases) |
| **Auth** | Supabase Auth |

---

## Project Structure

```
src/
├── App.tsx                 # Root component with auth routing
├── pages/
│   ├── AuthPage.tsx       # Login/signup (professional branding)
│   ├── MainApp.tsx        # Main app layout (mobile + desktop nav)
│   ├── HomePage.tsx       # Browse/discover streams
│   ├── GoLivePage.tsx     # Streamer go-live interface
│   ├── TokenShopPage.tsx  # Token purchase (Stripe)
│   └── ProfilePage.tsx    # User profile & stats
├── components/
│   └── LiveStreamCard.tsx # Stream preview card
├── supabaseClient.ts      # Supabase client config
├── index.css              # Tailwind + custom styles
└── main.tsx               # React entry point
```

---

## Database Schema

### Tables (Supabase PostgreSQL)
- `users` - User profiles (username, avatar, bio, token_balance, earnings)
- `rooms` - Live streams (title, description, is_live, viewer_count, rtmp_key, hls_url)
- `messages` - Chat (stream_id, user_id, content, is_tip_message)
- `token_purchases` - Token transactions (amount, price_usd, stripe_id, status)
- `tips` - Donations (stream_id, sender_id, receiver_id, amount, message)
- `followers` - Social graph (follower_id, streamer_id)
- `blocked_users` - Safety (blocker_id, blocked_id)
- `stream_recordings` - VOD (video_url, duration, view_count)
- `stream_settings` - Streamer prefs (rules, schedule, pricing)
- `tip_goals` - Stream goals (title, target_amount, current_amount)
- `categories` - Browse categories (Music, Gaming, Chatting, Creative, Sports, Education)

### Realtime Enabled
- `messages`, `tips`, `rooms`, `users` - For live updates

---

## Deployment

### Vercel
- **Project:** neonfreak-live
- **URL:** https://neonfreak-live.vercel.app
- **Framework:** Vite + React
- **Build:** `npm run build`
- **Install:** `npm install`

### Supabase
- **Project ID:** acvdwrkqmyumlmgpfvcu
- **Database:** PostgreSQL (schema applied ✅)
- **Auth:** Email/password + JWT

### Environment Variables (Vercel)
```
VITE_SUPABASE_URL=https://acvdwrkqmyumlmgpfvcu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Design & Branding

### Color Scheme
- **Primary:** Cyan (`#06B6D4`)
- **Secondary:** Purple (`#A855F7`)
- **Background:** Black (`#000000`)
- **Accent:** Gradient (Cyan → Purple)

### Typography
- **Headings:** Bold, Sans-serif
- **Body:** Regular, clean readability

### Mobile-First
- Bottom navigation on mobile
- Sidebar on desktop
- Responsive grid layouts
- Touch-friendly buttons

---

## Next Steps (Post-MVP)

### Phase 2: Streaming Infrastructure
- [ ] Configure RTMP server (Mux, Wowza, or custom)
- [ ] Implement HLS playback with quality switching
- [ ] Add stream recording & VOD management
- [ ] Create streaming guide for OBS

### Phase 3: Stripe Integration
- [ ] Complete token purchase flow
- [ ] Add Stripe webhook handling
- [ ] Implement refund management
- [ ] Add transaction history

### Phase 4: Enhanced Features
- [ ] Cam2cam (peer connections)
- [ ] Private shows with timer
- [ ] Tip-triggered actions
- [ ] Gift system
- [ ] Sound notifications
- [ ] Chat filters & moderation tools
- [ ] Custom emotes

### Phase 5: Admin & Analytics
- [ ] Creator earnings dashboard
- [ ] Platform analytics
- [ ] Admin moderation panel
- [ ] Account verification system
- [ ] Payout management

---

## Development

### Local Setup
```bash
# Install deps
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
git push origin main
```

### Environment
- Node 18+
- npm 9+
- Supabase CLI (optional, for local dev)

---

## GitHub Repository

**Repo:** https://github.com/3ighty6/neonfreak-live
**Branch:** main
**Commits:** Automated deployment on push

---

## Launch Checklist

- [x] Database schema created & migrated
- [x] Authentication (Supabase Auth)
- [x] UI/UX (mobile-first, professional design)
- [x] Pages (Home, Go Live, Tokens, Profile)
- [x] Components (Stream card, nav)
- [x] Real-time chat (Supabase Realtime)
- [x] Tip system (data model)
- [ ] RTMP streaming (configure server)
- [ ] Stripe integration (token purchases)
- [ ] Email verification
- [ ] Creator verification badges
- [ ] Content moderation tools

---

## Support & Contact

**Developer:** Mitchell Zarling
**Email:** m.zarling86@gmail.com
**Status:** Active development 🚀

---

**Built with ❤️ for creators.**
