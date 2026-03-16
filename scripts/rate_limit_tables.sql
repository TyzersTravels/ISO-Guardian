-- ISOGuardian: Server-side rate limiting for login brute force protection
-- Run this in Supabase SQL Editor

-- Failed login attempts table
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  ip_address text NOT NULL DEFAULT 'unknown',
  attempted_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by email and timestamp
CREATE INDEX IF NOT EXISTS idx_failed_login_email_time
  ON failed_login_attempts (email, attempted_at DESC);

-- Index for fast lookups by IP and timestamp
CREATE INDEX IF NOT EXISTS idx_failed_login_ip_time
  ON failed_login_attempts (ip_address, attempted_at DESC);

-- Auto-cleanup: delete attempts older than 24 hours (run via pg_cron daily)
-- SELECT cron.schedule('cleanup-login-attempts', '0 3 * * *', $$
--   DELETE FROM failed_login_attempts WHERE attempted_at < now() - interval '24 hours';
-- $$);

-- RLS: Only service role can access this table (Edge Function uses service role key)
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
-- No RLS policies = only service_role can read/write (exactly what we want)
