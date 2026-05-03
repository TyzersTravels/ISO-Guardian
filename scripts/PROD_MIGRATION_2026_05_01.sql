-- ============================================================================
-- ISOGuardian — Production Migration Script
-- Date: 2026-05-01
-- Apply to: PRODUCTION Supabase project (hyssdmtweecjbzcz)
--
-- This script consolidates all DB changes applied to STAGING during the
-- Demo 6 Polish sprint that have NOT yet been applied to production.
--
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard → Production project → SQL Editor
-- 2. Run each BLOCK below ONE AT A TIME (separated by ====== markers)
-- 3. After each block, check the verify query at the bottom of that block
-- 4. Only proceed to the next block if the verify looks correct
--
-- All statements are idempotent — safe to re-run if something fails mid-way.
-- ============================================================================


-- ============================================================================
-- BLOCK A: Core Schema Fixes (Operational 4)
-- Purpose: Fix the companies tier values, users role default, add
--          must_change_password column, and add all missing RLS policies
--          needed for /create-company, /users (invite), and password reset.
-- ============================================================================

-- A1. Fix companies tier CHECK constraint
--     Old: basic | professional   New: starter | growth | enterprise | reseller
ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_tier_check;

-- Migrate any old-format tier values that may exist on prod
UPDATE public.companies SET tier = 'starter'    WHERE tier = 'basic';
UPDATE public.companies SET tier = 'growth'     WHERE tier = 'professional';

ALTER TABLE public.companies
  ADD CONSTRAINT companies_tier_check
  CHECK (tier IN ('starter', 'growth', 'enterprise', 'reseller'));

-- A2. Set sensible defaults
ALTER TABLE public.companies
  ALTER COLUMN tier SET DEFAULT 'starter';

-- A3. Fix users.role default and migrate legacy 'viewer' rows
UPDATE public.users SET role = 'user' WHERE role = 'viewer';

ALTER TABLE public.users
  ALTER COLUMN role SET DEFAULT 'user';

-- A4. Add must_change_password column (forced password change on first login)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

-- A5. RLS: super_admin can insert + update companies
DROP POLICY IF EXISTS super_admin_insert_companies ON public.companies;
CREATE POLICY super_admin_insert_companies
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS super_admin_update_companies ON public.companies;
CREATE POLICY super_admin_update_companies
  ON public.companies FOR UPDATE
  TO authenticated
  USING (public.is_super_admin());

-- A6. RLS: super_admin can insert subscriptions
DROP POLICY IF EXISTS super_admin_insert_subscriptions ON public.subscriptions;
CREATE POLICY super_admin_insert_subscriptions
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

-- A7. RLS: admin can insert users into their own company; super_admin can insert any
DROP POLICY IF EXISTS admin_insert_users ON public.users;
CREATE POLICY admin_insert_users
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      company_id = public.get_my_company_id()
      AND EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role IN ('super_admin', 'admin')
      )
    )
  );

-- A8. RLS: users can update their own row (needed for ResetPassword to clear must_change_password)
DROP POLICY IF EXISTS users_update_self ON public.users;
CREATE POLICY users_update_self
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- VERIFY BLOCK A
SELECT
  (SELECT COUNT(*) FROM pg_constraint WHERE conname = 'companies_tier_check')        AS tier_constraint_exists,
  (SELECT column_default FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') AS role_default,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'must_change_password') AS must_change_password_col,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'companies' AND policyname LIKE 'super_admin_%') AS company_superadmin_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'super_admin_insert_subscriptions') AS sub_insert_policy,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'users' AND policyname IN ('admin_insert_users', 'users_update_self')) AS user_policies;

-- Expected: tier_constraint_exists=1, role_default='user', must_change_password_col=1,
--           company_superadmin_policies=2, sub_insert_policy=1, user_policies=2


-- ============================================================================
-- BLOCK B: Document Retention System (Feature 2)
-- Purpose: Adds 3 columns to documents (retention_policy, retention_until,
--          archived_at), a trigger that auto-calculates retention_until when
--          a document is archived, and backfills sensible defaults based on
--          document type. Required for ISO §7.5.3 compliance.
-- ============================================================================

-- B1. Add retention columns
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS retention_policy TEXT DEFAULT 'standard_3y',
  ADD COLUMN IF NOT EXISTS retention_until  DATE,
  ADD COLUMN IF NOT EXISTS archived_at      TIMESTAMPTZ;

-- B2. Add enum constraint on retention_policy
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_retention_policy_check;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_retention_policy_check
  CHECK (retention_policy IN (
    'standard_3y', 'standard_5y', 'standard_7y',
    'ohs_incident', 'employment_plus_5y', 'medical_40y',
    'indefinite', 'no_retention'
  ));

-- B3. Backfill existing documents with sensible policy based on type + clause
UPDATE public.documents SET retention_policy = CASE
  WHEN type = 'Manual'                                              THEN 'standard_5y'
  WHEN type = 'Policy'                                              THEN 'standard_5y'
  WHEN type = 'Procedure'                                           THEN 'standard_3y'
  WHEN type = 'Work Instruction'                                    THEN 'standard_3y'
  WHEN type = 'Form'                                                THEN 'no_retention'
  WHEN type = 'Certificate'                                         THEN 'indefinite'
  WHEN type = 'Record' AND clause = 7  AND standard LIKE '%9001%'  THEN 'employment_plus_5y'
  WHEN type = 'Record' AND clause = 9                              THEN 'standard_5y'
  WHEN type = 'Record' AND clause = 10                             THEN 'standard_3y'
  WHEN type = 'Record' AND clause = 6  AND standard LIKE '%45001%' THEN 'ohs_incident'
  WHEN type = 'Register' AND clause = 6 AND standard LIKE '%14001%' THEN 'standard_5y'
  ELSE 'standard_3y'
END
WHERE retention_policy IS NULL OR retention_policy = 'standard_3y';

-- B4. Create trigger function: auto-sets retention_until when archived
CREATE OR REPLACE FUNCTION public.set_retention_until()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.archived = true AND (OLD.archived IS DISTINCT FROM true) THEN
    NEW.archived_at := COALESCE(NEW.archived_at, now());
    NEW.retention_until := CASE NEW.retention_policy
      WHEN 'standard_3y'        THEN (NEW.archived_at::date + interval '3 years')::date
      WHEN 'standard_5y'        THEN (NEW.archived_at::date + interval '5 years')::date
      WHEN 'standard_7y'        THEN (NEW.archived_at::date + interval '7 years')::date
      WHEN 'ohs_incident'       THEN (NEW.archived_at::date + interval '7 years')::date
      WHEN 'employment_plus_5y' THEN NULL  -- admin must set manually
      WHEN 'medical_40y'        THEN (NEW.archived_at::date + interval '40 years')::date
      WHEN 'indefinite'         THEN NULL  -- never expires
      WHEN 'no_retention'       THEN NEW.archived_at::date
      ELSE (NEW.archived_at::date + interval '3 years')::date
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documents_retention ON public.documents;
CREATE TRIGGER trg_documents_retention
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_retention_until();

-- B5. Indexes for retention queries
CREATE INDEX IF NOT EXISTS idx_documents_retention_until
  ON public.documents (retention_until)
  WHERE retention_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_archived_company
  ON public.documents (company_id, archived);

-- VERIFY BLOCK B
SELECT retention_policy, COUNT(*) AS doc_count
FROM public.documents
GROUP BY retention_policy
ORDER BY retention_policy;

-- Expected: rows showing retention_policy distribution across your prod documents
-- (standard_3y should be the majority). If table is empty that's fine too.


-- ============================================================================
-- BLOCK C: Document Type Constraint Expansion (Feature 2)
-- Purpose: The original documents.type CHECK only allowed: Policy, Procedure,
--          Form, Manual, Record. The UI now also allows Work Instruction,
--          Register, and Certificate. Without this, uploads of those types
--          fail with a Postgres constraint violation.
-- ============================================================================

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_type_check;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_type_check
  CHECK (type IN (
    'Policy',
    'Procedure',
    'Work Instruction',
    'Form',
    'Manual',
    'Record',
    'Register',
    'Certificate'
  ));

-- VERIFY BLOCK C
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conname = 'documents_type_check';

-- Expected: 1 row with all 8 types listed in the definition


-- ============================================================================
-- BLOCK D: Storage RLS Policies (Security)
-- Purpose: Enforces company-scoped access on the documents storage bucket.
--          Without these, any authenticated user can read/write any file.
--          First checks how many policies already exist — skip if already 4.
-- ============================================================================

-- Check first (run this SELECT, count the result before running the rest)
SELECT COUNT(*) AS existing_storage_policies
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'documents_%';

-- If the result above is already 4, skip this block — policies are already in place.
-- If it is 0 or fewer than 4, run everything below:

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "documents_select_own_company" ON storage.objects;
DROP POLICY IF EXISTS "documents_insert_own_company" ON storage.objects;
DROP POLICY IF EXISTS "documents_update_own_company" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete_own_company" ON storage.objects;
DROP POLICY IF EXISTS "documents_super_admin_all"    ON storage.objects;

CREATE POLICY "documents_select_own_company"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = public.get_my_company_id_text()
    OR (
      (storage.foldername(name))[1] = 'logos'
      AND (storage.foldername(name))[2] = public.get_my_company_id_text()
    )
    OR public.is_super_admin()
  )
);

CREATE POLICY "documents_insert_own_company"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = public.get_my_company_id_text()
    OR (
      (storage.foldername(name))[1] = 'logos'
      AND (storage.foldername(name))[2] = public.get_my_company_id_text()
    )
    OR public.is_super_admin()
  )
);

CREATE POLICY "documents_update_own_company"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = public.get_my_company_id_text()
    OR (
      (storage.foldername(name))[1] = 'logos'
      AND (storage.foldername(name))[2] = public.get_my_company_id_text()
    )
    OR public.is_super_admin()
  )
)
WITH CHECK (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = public.get_my_company_id_text()
    OR (
      (storage.foldername(name))[1] = 'logos'
      AND (storage.foldername(name))[2] = public.get_my_company_id_text()
    )
    OR public.is_super_admin()
  )
);

CREATE POLICY "documents_delete_own_company"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = public.get_my_company_id_text()
    OR (
      (storage.foldername(name))[1] = 'logos'
      AND (storage.foldername(name))[2] = public.get_my_company_id_text()
    )
    OR public.is_super_admin()
  )
);

-- VERIFY BLOCK D
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname LIKE 'documents_%'
ORDER BY policyname;

-- Expected: 4 rows — select, insert, update, delete


-- ============================================================================
-- BLOCK E: Cancellation Requests Table (POPIA / SLA compliance)
-- Purpose: Stores client-initiated cancellation requests submitted via the
--          in-app CompanySettings → Subscription → Cancel flow. Required for
--          the SLA §4.1 in-app cancellation path and /admin/cancellations page.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cancellation_requests (
  id                      uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id              uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requested_by            uuid        NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  subscription_id         uuid        REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  subscription_status     text,
  tier                    text,
  account_age_days        integer,
  cooling_off_applies     boolean     NOT NULL DEFAULT false,
  within_initial_term     boolean     NOT NULL DEFAULT false,
  months_remaining        integer,
  termination_fee_zar     numeric(10, 2),
  reason                  text,
  acknowledgement_signed  boolean     NOT NULL DEFAULT false,
  status                  text        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn', 'completed')),
  processed_by            uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  processed_at            timestamptz,
  processor_notes         text,
  effective_date          date,
  requested_at            timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cancellation_requests_company
  ON public.cancellation_requests (company_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_cancellation_requests_status
  ON public.cancellation_requests (status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_cancellation_requests_requester
  ON public.cancellation_requests (requested_by);

CREATE OR REPLACE FUNCTION public.touch_cancellation_requests_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cancellation_requests_updated_at ON public.cancellation_requests;
CREATE TRIGGER trg_cancellation_requests_updated_at
  BEFORE UPDATE ON public.cancellation_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_cancellation_requests_updated_at();

ALTER TABLE public.cancellation_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cancellation_requests_select_company ON public.cancellation_requests;
CREATE POLICY cancellation_requests_select_company
  ON public.cancellation_requests FOR SELECT
  USING (company_id = public.get_my_company_id() OR public.is_super_admin());

DROP POLICY IF EXISTS cancellation_requests_insert_admin ON public.cancellation_requests;
CREATE POLICY cancellation_requests_insert_admin
  ON public.cancellation_requests FOR INSERT
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS cancellation_requests_update_superadmin ON public.cancellation_requests;
CREATE POLICY cancellation_requests_update_superadmin
  ON public.cancellation_requests FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS cancellation_requests_withdraw_own ON public.cancellation_requests;
CREATE POLICY cancellation_requests_withdraw_own
  ON public.cancellation_requests FOR UPDATE
  USING (requested_by = auth.uid() AND status = 'pending')
  WITH CHECK (requested_by = auth.uid() AND status IN ('pending', 'withdrawn'));

-- VERIFY BLOCK E
SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'cancellation_requests') AS table_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'cancellation_requests') AS rls_policies;

-- Expected: table_exists=1, rls_policies=4


-- ============================================================================
-- BLOCK F: Erasure Requests Table (POPIA s24 compliance)
-- Purpose: Stores personal data deletion requests submitted via the
--          UserProfile → Request Data Deletion flow. Required by POPIA s24
--          and the Client Subscription & SLA v1.1 §7.5.1. The 30-day SLA
--          countdown is tracked via sla_deadline_at. Managed at
--          /admin/erasure-requests.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.erasure_requests (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id            uuid        REFERENCES public.companies(id) ON DELETE SET NULL,
  user_email            text        NOT NULL,
  user_full_name        text,
  reason                text,
  acknowledgement_signed boolean    NOT NULL DEFAULT false,
  status                text        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'withdrawn')),
  processed_by          uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  processed_at          timestamptz,
  processor_notes       text,
  retention_exceptions  text,
  requested_at          timestamptz NOT NULL DEFAULT now(),
  sla_deadline_at       timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_erasure_requests_user
  ON public.erasure_requests (user_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_erasure_requests_status
  ON public.erasure_requests (status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_erasure_requests_sla
  ON public.erasure_requests (sla_deadline_at)
  WHERE status IN ('pending', 'processing');

CREATE OR REPLACE FUNCTION public.touch_erasure_requests_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_erasure_requests_updated_at ON public.erasure_requests;
CREATE TRIGGER trg_erasure_requests_updated_at
  BEFORE UPDATE ON public.erasure_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_erasure_requests_updated_at();

ALTER TABLE public.erasure_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS erasure_requests_select_own ON public.erasure_requests;
CREATE POLICY erasure_requests_select_own
  ON public.erasure_requests FOR SELECT
  USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS erasure_requests_insert_own ON public.erasure_requests;
CREATE POLICY erasure_requests_insert_own
  ON public.erasure_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS erasure_requests_update_superadmin ON public.erasure_requests;
CREATE POLICY erasure_requests_update_superadmin
  ON public.erasure_requests FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS erasure_requests_withdraw_own ON public.erasure_requests;
CREATE POLICY erasure_requests_withdraw_own
  ON public.erasure_requests FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status IN ('pending', 'withdrawn'));

-- VERIFY BLOCK F
SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'erasure_requests') AS table_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'erasure_requests') AS rls_policies;

-- Expected: table_exists=1, rls_policies=4


-- ============================================================================
-- FINAL CHECK — Run this after all blocks are done
-- ============================================================================
SELECT
  -- Block A
  (SELECT COUNT(*) FROM pg_constraint WHERE conname = 'companies_tier_check')              AS "A: tier_constraint",
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'must_change_password') AS "A: must_change_password",
  -- Block B
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'retention_policy') AS "B: retention_policy_col",
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'trg_documents_retention')               AS "B: retention_trigger",
  -- Block C
  (SELECT COUNT(*) FROM pg_constraint WHERE conname = 'documents_type_check')              AS "C: type_constraint",
  -- Block D
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname='storage' AND policyname LIKE 'documents_%') AS "D: storage_rls_policies",
  -- Block E
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'cancellation_requests') AS "E: cancellation_table",
  -- Block F
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'erasure_requests')   AS "F: erasure_table";

-- ALL EXPECTED VALUES: 1 | 1 | 1 | 1 | 1 | 4 | 1 | 1
