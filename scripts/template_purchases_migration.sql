-- Template Purchases & Download Tokens
-- Run this in Supabase SQL Editor

-- Template purchases (tracks one-time purchases by non-subscribers)
CREATE TABLE IF NOT EXISTS template_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  template_id text NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'ZAR',
  payfast_payment_id text,
  download_token uuid DEFAULT gen_random_uuid() UNIQUE,
  download_token_expires_at timestamptz DEFAULT (now() + interval '48 hours'),
  downloaded boolean DEFAULT false,
  downloaded_at timestamptz,
  buyer_name text,
  company_id uuid REFERENCES companies(id),
  created_at timestamptz DEFAULT now()
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_template_purchases_download_token
  ON template_purchases(download_token);

-- Index for email lookups (lead tracking)
CREATE INDEX IF NOT EXISTS idx_template_purchases_email
  ON template_purchases(email);

-- RLS
ALTER TABLE template_purchases ENABLE ROW LEVEL SECURITY;

-- Super admin can see all purchases
CREATE POLICY "super_admin_all_template_purchases" ON template_purchases
  FOR ALL USING (public.is_super_admin());

-- Users can see their own purchases (by email match)
CREATE POLICY "users_own_template_purchases" ON template_purchases
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
