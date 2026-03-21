-- Template Marketplace Tables
-- Run this in Supabase SQL Editor

-- Template purchases / download audit log
-- template_id is TEXT because templates are stored in code, not in the database
CREATE TABLE IF NOT EXISTS template_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id uuid,
  template_id text NOT NULL,
  price_paid_zar int NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'subscriber',
  payment_reference text,
  downloaded_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE template_purchases ENABLE ROW LEVEL SECURITY;

-- Users can see their own purchases
CREATE POLICY "Users can view own purchases"
  ON template_purchases FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON template_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Super admin can see all purchases
CREATE POLICY "Super admins can view all purchases"
  ON template_purchases FOR SELECT USING (public.is_super_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_template_purchases_user ON template_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_template_purchases_company ON template_purchases(company_id);
CREATE INDEX IF NOT EXISTS idx_template_purchases_template ON template_purchases(template_id);
