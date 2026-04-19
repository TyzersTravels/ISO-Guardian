-- ISOGuardian: Cancellation requests table
-- Client-initiated cancellation flow via CompanySettings → Subscription tab.
-- Per Client Subscription & SLA v1.1 §4.1 — in-app cancellation is a valid
-- written notice. super_admin processes the actual termination at /admin/cancellations.
-- Run this in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS cancellation_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Commercial context captured at request time (read-only audit record)
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  subscription_status text,                   -- snapshot: active / past_due / etc
  tier text,                                  -- snapshot: starter / growth / enterprise
  account_age_days integer,                   -- for CPA s16 5-business-day cooling-off eligibility
  cooling_off_applies boolean NOT NULL DEFAULT false,
  within_initial_term boolean NOT NULL DEFAULT false,
  months_remaining integer,                   -- of the 12-month Initial Term
  termination_fee_zar numeric(10, 2),         -- calculated per SLA §4.1 sliding scale (50%/25%)

  reason text,                                -- optional free-text "why"
  acknowledgement_signed boolean NOT NULL DEFAULT false,

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn', 'completed')),
  processed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  processed_at timestamptz,
  processor_notes text,
  effective_date date,                        -- when access actually ends

  requested_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cancellation_requests_company
  ON cancellation_requests (company_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_cancellation_requests_status
  ON cancellation_requests (status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_cancellation_requests_requester
  ON cancellation_requests (requested_by);

-- updated_at trigger
CREATE OR REPLACE FUNCTION touch_cancellation_requests_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cancellation_requests_updated_at ON cancellation_requests;
CREATE TRIGGER trg_cancellation_requests_updated_at
  BEFORE UPDATE ON cancellation_requests
  FOR EACH ROW EXECUTE FUNCTION touch_cancellation_requests_updated_at();

-- RLS
ALTER TABLE cancellation_requests ENABLE ROW LEVEL SECURITY;

-- Company admins can read + insert their own company's cancellation requests
DROP POLICY IF EXISTS cancellation_requests_select_company ON cancellation_requests;
CREATE POLICY cancellation_requests_select_company
  ON cancellation_requests FOR SELECT
  USING (
    company_id = public.get_my_company_id()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS cancellation_requests_insert_admin ON cancellation_requests;
CREATE POLICY cancellation_requests_insert_admin
  ON cancellation_requests FOR INSERT
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin')
    )
  );

-- Only super_admin can transition status / approve / reject
DROP POLICY IF EXISTS cancellation_requests_update_superadmin ON cancellation_requests;
CREATE POLICY cancellation_requests_update_superadmin
  ON cancellation_requests FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Users can withdraw their own pending request
DROP POLICY IF EXISTS cancellation_requests_withdraw_own ON cancellation_requests;
CREATE POLICY cancellation_requests_withdraw_own
  ON cancellation_requests FOR UPDATE
  USING (
    requested_by = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    requested_by = auth.uid()
    AND status IN ('pending', 'withdrawn')
  );
