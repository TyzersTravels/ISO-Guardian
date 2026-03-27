-- Drip Campaign Tables Migration
-- Run in Supabase SQL Editor
-- Creates: drip_campaigns, drip_queue, drip_unsubscribes
-- Adds: commissions.payment_reference column

-- ============================================================
-- 1. DRIP CAMPAIGNS — campaign definitions
-- ============================================================
CREATE TABLE IF NOT EXISTS drip_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL CHECK (trigger_type IN ('post_assessment', 'post_consultation', 'trial_onboarding', 'reseller_outreach')),
  is_active boolean DEFAULT true,
  emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- emails structure: [{ step: 1, delay_days: 0, subject: "...", body: "...", condition: null }]
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE drip_campaigns IS 'Email drip campaign definitions with embedded email sequence steps';
COMMENT ON COLUMN drip_campaigns.emails IS 'JSONB array of email steps: [{step, delay_days, subject, body, condition}]';

-- ============================================================
-- 2. DRIP QUEUE — scheduled individual sends
-- ============================================================
CREATE TABLE IF NOT EXISTS drip_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  recipient_name text,
  step integer NOT NULL DEFAULT 1,
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled', 'unsubscribed')),
  error_message text,
  personalization jsonb DEFAULT '{}'::jsonb,
  -- personalization: { score, standard, company_name, expiry_date, has_uploaded_docs, ... }
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE drip_queue IS 'Individual scheduled email sends for drip campaigns';
COMMENT ON COLUMN drip_queue.personalization IS 'JSONB merge fields: score, standard, company_name, expiry_date, etc.';

-- Prevent duplicate enrollment (same email + campaign + step)
CREATE UNIQUE INDEX IF NOT EXISTS idx_drip_queue_unique_enrollment
  ON drip_queue(campaign_id, recipient_email, step);

-- Fast lookup for queue processor
CREATE INDEX IF NOT EXISTS idx_drip_queue_pending
  ON drip_queue(scheduled_at, status) WHERE status = 'pending';

-- Lookup by recipient for unsubscribe
CREATE INDEX IF NOT EXISTS idx_drip_queue_recipient
  ON drip_queue(recipient_email, status);

-- ============================================================
-- 3. DRIP UNSUBSCRIBES — POPIA-required opt-out tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS drip_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_uuid()::text::bytea, 'hex'),
  is_unsubscribed boolean DEFAULT false,
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- One record per email
CREATE UNIQUE INDEX IF NOT EXISTS idx_drip_unsubscribes_email
  ON drip_unsubscribes(email);

-- Fast token lookup for unsubscribe endpoint
CREATE INDEX IF NOT EXISTS idx_drip_unsubscribes_token
  ON drip_unsubscribes(token);

COMMENT ON TABLE drip_unsubscribes IS 'POPIA-compliant unsubscribe tracking for drip campaigns';

-- ============================================================
-- 4. COMMISSIONS — add payment_reference column
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commissions' AND column_name = 'payment_reference'
  ) THEN
    ALTER TABLE commissions ADD COLUMN payment_reference text;
    COMMENT ON COLUMN commissions.payment_reference IS 'EFT payment reference when commission is marked as paid';
  END IF;
END $$;

-- ============================================================
-- 5. RLS POLICIES
-- ============================================================

-- drip_campaigns: super_admin can read/write, Edge Functions use service role
ALTER TABLE drip_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_full_access_drip_campaigns"
  ON drip_campaigns FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- drip_queue: super_admin can read/write
ALTER TABLE drip_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_full_access_drip_queue"
  ON drip_queue FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- drip_unsubscribes: super_admin can read, Edge Functions handle writes via service role
ALTER TABLE drip_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_read_drip_unsubscribes"
  ON drip_unsubscribes FOR SELECT
  USING (is_super_admin());

-- commissions: ensure super_admin has full access (may already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'commissions' AND policyname = 'super_admin_full_access_commissions'
  ) THEN
    CREATE POLICY "super_admin_full_access_commissions"
      ON commissions FOR ALL
      USING (is_super_admin())
      WITH CHECK (is_super_admin());
  END IF;
END $$;

-- ============================================================
-- 6. UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS drip_campaigns_updated_at ON drip_campaigns;
CREATE TRIGGER drip_campaigns_updated_at
  BEFORE UPDATE ON drip_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS drip_queue_updated_at ON drip_queue;
CREATE TRIGGER drip_queue_updated_at
  BEFORE UPDATE ON drip_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
