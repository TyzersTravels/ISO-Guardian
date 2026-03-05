-- ============================================================
-- ISOGuardian Landing Page & Notification Tables
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. ISO Readiness Assessments (lead capture)
CREATE TABLE IF NOT EXISTS iso_readiness_assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL,
  email text NOT NULL,
  phone text,
  standard text NOT NULL DEFAULT 'ISO 9001',
  answers jsonb NOT NULL DEFAULT '{}',
  score integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE iso_readiness_assessments ENABLE ROW LEVEL SECURITY;

-- Public can insert (lead capture form), super_admin can read all
CREATE POLICY "Anyone can submit assessment"
  ON iso_readiness_assessments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Super admin can view assessments"
  ON iso_readiness_assessments FOR SELECT
  TO authenticated
  USING (public.is_super_admin());


-- 2. Consultation Requests
CREATE TABLE IF NOT EXISTS consultation_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL,
  standard text NOT NULL DEFAULT 'ISO 9001',
  preferred_date date,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit consultation request"
  ON consultation_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Super admin can view consultation requests"
  ON consultation_requests FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admin can update consultation requests"
  ON consultation_requests FOR UPDATE
  TO authenticated
  USING (public.is_super_admin());


-- 3. Referrals (affiliate + partner tracking)
CREATE TABLE IF NOT EXISTS referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid REFERENCES auth.users(id),
  referrer_code text NOT NULL,
  referred_email text,
  referred_user_id uuid REFERENCES auth.users(id),
  referral_type text NOT NULL CHECK (referral_type IN ('affiliate', 'partner')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'converted', 'credited')),
  credit_applied boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  converted_at timestamptz
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can see their own referrals
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR public.is_super_admin());

-- Public insert for signup tracking
CREATE POLICY "Anyone can create referral"
  ON referrals FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Super admin can update referral status
CREATE POLICY "Super admin can update referrals"
  ON referrals FOR UPDATE
  TO authenticated
  USING (public.is_super_admin());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_code ON referrals(referrer_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);


-- 4. Add referral columns to users table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_code') THEN
    ALTER TABLE users ADD COLUMN referral_code text UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referred_by') THEN
    ALTER TABLE users ADD COLUMN referred_by text;
  END IF;
END $$;


-- 5. Notification Log (prevent duplicate emails)
CREATE TABLE IF NOT EXISTS notification_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id),
  user_email text NOT NULL,
  notification_type text NOT NULL,
  entity_type text,
  entity_id text,
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Company-scoped access
CREATE POLICY "Users can view own company notifications"
  ON notification_log FOR SELECT
  TO authenticated
  USING (
    company_id::text = public.get_my_company_id()::text
    OR public.is_super_admin()
  );

CREATE POLICY "System can insert notifications"
  ON notification_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Index for dedup checks
CREATE INDEX IF NOT EXISTS idx_notification_log_dedup
  ON notification_log(company_id, notification_type, entity_type, entity_id, sent_at);
