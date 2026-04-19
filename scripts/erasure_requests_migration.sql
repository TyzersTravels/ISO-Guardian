-- ISOGuardian: POPIA s24 right-to-erasure requests
-- User-initiated personal-data-deletion flow via UserProfile page.
-- Per ToS v1.2 §14 and Client Subscription & SLA v1.1 §7.5.1 — processed within 30 days,
-- subject to lawful retention (POPIA s14, tax, audit trail, regulatory).
-- Run this in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS erasure_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,

  -- Snapshot of what the user saw when they made the request
  user_email text NOT NULL,
  user_full_name text,

  reason text,                                 -- optional free-text
  acknowledgement_signed boolean NOT NULL DEFAULT false,

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'withdrawn')),
  processed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  processed_at timestamptz,
  processor_notes text,
  retention_exceptions text,                    -- which categories retained under POPIA s14 / tax / regulatory

  requested_at timestamptz NOT NULL DEFAULT now(),
  sla_deadline_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_erasure_requests_user
  ON erasure_requests (user_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_erasure_requests_status
  ON erasure_requests (status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_erasure_requests_sla
  ON erasure_requests (sla_deadline_at)
  WHERE status IN ('pending', 'processing');

-- updated_at trigger
CREATE OR REPLACE FUNCTION touch_erasure_requests_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_erasure_requests_updated_at ON erasure_requests;
CREATE TRIGGER trg_erasure_requests_updated_at
  BEFORE UPDATE ON erasure_requests
  FOR EACH ROW EXECUTE FUNCTION touch_erasure_requests_updated_at();

-- RLS
ALTER TABLE erasure_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own request + super_admin can read all
DROP POLICY IF EXISTS erasure_requests_select_own ON erasure_requests;
CREATE POLICY erasure_requests_select_own
  ON erasure_requests FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_super_admin()
  );

-- Users can insert their own request
DROP POLICY IF EXISTS erasure_requests_insert_own ON erasure_requests;
CREATE POLICY erasure_requests_insert_own
  ON erasure_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Only super_admin can transition status
DROP POLICY IF EXISTS erasure_requests_update_superadmin ON erasure_requests;
CREATE POLICY erasure_requests_update_superadmin
  ON erasure_requests FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Users can withdraw their own pending request
DROP POLICY IF EXISTS erasure_requests_withdraw_own ON erasure_requests;
CREATE POLICY erasure_requests_withdraw_own
  ON erasure_requests FOR UPDATE
  USING (
    user_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    user_id = auth.uid()
    AND status IN ('pending', 'withdrawn')
  );
