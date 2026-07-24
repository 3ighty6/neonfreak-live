-- Create streams table
CREATE TABLE IF NOT EXISTS streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  mux_stream_id VARCHAR,
  rtmp_url VARCHAR,
  rtmp_key VARCHAR,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user token balance table
CREATE TABLE IF NOT EXISTS user_token_balance (
  user_id UUID PRIMARY KEY,
  balance INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR PRIMARY KEY,
  creator_id UUID,
  user_id UUID,
  amount INTEGER,
  type VARCHAR,
  status VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true) ON CONFLICT DO NOTHING;

-- Update profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio VARCHAR;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_streams_creator ON streams(creator_id);
CREATE INDEX IF NOT EXISTS idx_transactions_creator ON transactions(creator_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
