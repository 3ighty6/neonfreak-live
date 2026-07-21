-- Add admin column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Add token_balance if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_balance INTEGER DEFAULT 0;

-- Grant RLS policies for admin
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
