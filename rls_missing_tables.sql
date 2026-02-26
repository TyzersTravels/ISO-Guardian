-- ================================================================
-- ISOGuardian — RLS Policies for Previously Unprotected Tables
-- Version 2.0 — Self-diagnosing with schema introspection
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
--
-- Prerequisites: helper functions must already exist:
--   public.get_my_company_id()        -> uuid
--   public.get_my_company_id_text()   -> text
--   public.is_super_admin()           -> boolean
--   public.is_reseller_for_uuid(uuid) -> boolean
--   public.is_reseller_for_text(text) -> boolean
-- ================================================================

-- ================================================================
-- STEP 0: DIAGNOSTIC — Run this FIRST to see what columns each table has.
-- Copy the output and review before running the policies below.
-- ================================================================
-- SELECT table_name, column_name, data_type, udt_name
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN (
--     'ai_operations', 'ai_recommendations', 'audit_logs',
--     'clauses', 'client_health', 'clients', 'commissions',
--     'compliance_reports', 'document_approvals', 'documents_backup',
--     'failed_login_attempts', 'iso_standards', 'meeting_attendees',
--     'meetings', 'payments', 'reseller_commissions',
--     'reseller_milestones', 'security_events', 'system_metrics',
--     'team_members', 'user_permissions'
--   )
-- ORDER BY table_name, ordinal_position;

-- ================================================================
-- STEP 1: SAFE POLICY CREATION
-- Uses DO blocks to check if tables/columns exist before creating.
-- This prevents "column does not exist" errors.
-- ================================================================

-- Helper: drop all existing policies on a table (idempotent)
CREATE OR REPLACE FUNCTION _tmp_drop_policies(tbl text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = tbl AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
  END LOOP;
END;
$$;

-- Helper: check if a column exists on a table
CREATE OR REPLACE FUNCTION _tmp_col_exists(tbl text, col text)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = tbl AND column_name = col
  );
$$;

-- Helper: check if a table exists
CREATE OR REPLACE FUNCTION _tmp_table_exists(tbl text)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = tbl
  );
$$;

-- ================================================================
-- CATEGORY A: Tables with company_id (uuid) — standard multi-tenant
-- Pattern: own company OR super_admin
-- ================================================================
DO $$
DECLARE
  tbl text;
  tables_uuid text[] := ARRAY[
    'ai_operations', 'ai_recommendations', 'compliance_reports',
    'document_approvals', 'meetings', 'payments',
    'security_events', 'team_members'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_uuid
  LOOP
    -- Skip if table doesn't exist
    IF NOT _tmp_table_exists(tbl) THEN
      RAISE NOTICE 'SKIP: table % does not exist', tbl;
      CONTINUE;
    END IF;

    -- Drop existing policies
    PERFORM _tmp_drop_policies(tbl);

    -- Check for company_id column
    IF _tmp_col_exists(tbl, 'company_id') THEN
      -- Determine if company_id is uuid or text
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = tbl
          AND column_name = 'company_id' AND udt_name = 'uuid'
      ) THEN
        -- UUID company_id
        EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (
          public.is_super_admin() OR company_id = public.get_my_company_id()
        )', tbl || '_select', tbl);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (
          public.is_super_admin() OR company_id = public.get_my_company_id()
        )', tbl || '_insert', tbl);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (
          public.is_super_admin() OR company_id = public.get_my_company_id()
        )', tbl || '_update', tbl);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (
          public.is_super_admin() OR company_id = public.get_my_company_id()
        )', tbl || '_delete', tbl);
        RAISE NOTICE 'OK: % — company_id (uuid) policies created', tbl;
      ELSE
        -- TEXT company_id
        EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (
          public.is_super_admin() OR company_id = public.get_my_company_id_text()
        )', tbl || '_select', tbl);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (
          public.is_super_admin() OR company_id = public.get_my_company_id_text()
        )', tbl || '_insert', tbl);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (
          public.is_super_admin() OR company_id = public.get_my_company_id_text()
        )', tbl || '_update', tbl);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (
          public.is_super_admin() OR company_id = public.get_my_company_id_text()
        )', tbl || '_delete', tbl);
        RAISE NOTICE 'OK: % — company_id (text) policies created', tbl;
      END IF;
    ELSE
      -- No company_id column — super_admin only
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (
        public.is_super_admin()
      )', tbl || '_select', tbl);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (
        public.is_super_admin()
      )', tbl || '_insert', tbl);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (
        public.is_super_admin()
      )', tbl || '_update', tbl);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (
        public.is_super_admin()
      )', tbl || '_delete', tbl);
      RAISE NOTICE 'WARN: % — no company_id column found, super_admin only', tbl;
    END IF;
  END LOOP;
END;
$$;

-- ================================================================
-- CATEGORY B: Tables with company_id that also need reseller access
-- Pattern: own company OR super_admin OR reseller
-- ================================================================
DO $$
DECLARE
  tbl text;
  tables_reseller text[] := ARRAY['client_health', 'clients'];
BEGIN
  FOREACH tbl IN ARRAY tables_reseller
  LOOP
    IF NOT _tmp_table_exists(tbl) THEN
      RAISE NOTICE 'SKIP: table % does not exist', tbl;
      CONTINUE;
    END IF;

    PERFORM _tmp_drop_policies(tbl);

    IF _tmp_col_exists(tbl, 'company_id') THEN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = tbl
          AND column_name = 'company_id' AND udt_name = 'uuid'
      ) THEN
        EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (
          public.is_super_admin()
          OR company_id = public.get_my_company_id()
          OR public.is_reseller_for_uuid(company_id)
        )', tbl || '_select', tbl);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (
          public.is_super_admin() OR company_id = public.get_my_company_id()
        )', tbl || '_insert', tbl);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (
          public.is_super_admin() OR company_id = public.get_my_company_id()
        )', tbl || '_update', tbl);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (
          public.is_super_admin() OR company_id = public.get_my_company_id()
        )', tbl || '_delete', tbl);
        RAISE NOTICE 'OK: % — company_id (uuid) + reseller policies created', tbl;
      ELSE
        EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (
          public.is_super_admin()
          OR company_id = public.get_my_company_id_text()
          OR public.is_reseller_for_text(company_id)
        )', tbl || '_select', tbl);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (
          public.is_super_admin() OR company_id = public.get_my_company_id_text()
        )', tbl || '_insert', tbl);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (
          public.is_super_admin() OR company_id = public.get_my_company_id_text()
        )', tbl || '_update', tbl);
        EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (
          public.is_super_admin() OR company_id = public.get_my_company_id_text()
        )', tbl || '_delete', tbl);
        RAISE NOTICE 'OK: % — company_id (text) + reseller policies created', tbl;
      END IF;
    ELSE
      -- Fallback: super_admin only
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (public.is_super_admin())', tbl || '_select', tbl);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (public.is_super_admin())', tbl || '_insert', tbl);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (public.is_super_admin())', tbl || '_update', tbl);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (public.is_super_admin())', tbl || '_delete', tbl);
      RAISE NOTICE 'WARN: % — no company_id, super_admin only', tbl;
    END IF;
  END LOOP;
END;
$$;

-- ================================================================
-- CATEGORY C: Reference/lookup tables — authenticated read, admin write
-- ================================================================
DO $$
DECLARE
  tbl text;
  tables_ref text[] := ARRAY['clauses', 'iso_standards'];
BEGIN
  FOREACH tbl IN ARRAY tables_ref
  LOOP
    IF NOT _tmp_table_exists(tbl) THEN
      RAISE NOTICE 'SKIP: table % does not exist', tbl;
      CONTINUE;
    END IF;

    PERFORM _tmp_drop_policies(tbl);

    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (
      auth.role() = ''authenticated''
    )', tbl || '_select', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (
      public.is_super_admin()
    )', tbl || '_insert', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (
      public.is_super_admin()
    )', tbl || '_update', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (
      public.is_super_admin()
    )', tbl || '_delete', tbl);
    RAISE NOTICE 'OK: % — reference table policies (auth read, admin write)', tbl;
  END LOOP;
END;
$$;

-- ================================================================
-- CATEGORY D: Audit logs — immutable (no update/delete except super_admin)
-- ================================================================
DO $$
BEGIN
  IF NOT _tmp_table_exists('audit_logs') THEN
    RAISE NOTICE 'SKIP: table audit_logs does not exist';
    RETURN;
  END IF;

  PERFORM _tmp_drop_policies('audit_logs');

  IF _tmp_col_exists('audit_logs', 'company_id') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'audit_logs'
        AND column_name = 'company_id' AND udt_name = 'uuid'
    ) THEN
      EXECUTE 'CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT USING (
        public.is_super_admin() OR company_id = public.get_my_company_id()
      )';
      EXECUTE 'CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT WITH CHECK (
        public.is_super_admin() OR company_id = public.get_my_company_id()
      )';
    ELSE
      EXECUTE 'CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT USING (
        public.is_super_admin() OR company_id = public.get_my_company_id_text()
      )';
      EXECUTE 'CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT WITH CHECK (
        public.is_super_admin() OR company_id = public.get_my_company_id_text()
      )';
    END IF;
  ELSIF _tmp_col_exists('audit_logs', 'user_id') THEN
    EXECUTE 'CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT USING (
      public.is_super_admin() OR user_id = auth.uid()
    )';
    EXECUTE 'CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT WITH CHECK (
      public.is_super_admin() OR user_id = auth.uid()
    )';
  ELSE
    EXECUTE 'CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT USING (public.is_super_admin())';
    EXECUTE 'CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT WITH CHECK (public.is_super_admin())';
  END IF;

  -- Immutable: update/delete super_admin only
  EXECUTE 'CREATE POLICY audit_logs_update ON public.audit_logs FOR UPDATE USING (public.is_super_admin())';
  EXECUTE 'CREATE POLICY audit_logs_delete ON public.audit_logs FOR DELETE USING (public.is_super_admin())';
  RAISE NOTICE 'OK: audit_logs — immutable audit log policies created';
END;
$$;

-- ================================================================
-- CATEGORY E: documents_backup — TEXT company_id (mirrors documents table)
-- ================================================================
DO $$
BEGIN
  IF NOT _tmp_table_exists('documents_backup') THEN
    RAISE NOTICE 'SKIP: table documents_backup does not exist';
    RETURN;
  END IF;

  PERFORM _tmp_drop_policies('documents_backup');

  IF _tmp_col_exists('documents_backup', 'company_id') THEN
    -- documents table uses TEXT company_id, so backup likely does too
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'documents_backup'
        AND column_name = 'company_id' AND udt_name = 'uuid'
    ) THEN
      EXECUTE 'CREATE POLICY documents_backup_select ON public.documents_backup FOR SELECT USING (
        public.is_super_admin() OR company_id = public.get_my_company_id()
      )';
      EXECUTE 'CREATE POLICY documents_backup_insert ON public.documents_backup FOR INSERT WITH CHECK (
        public.is_super_admin() OR company_id = public.get_my_company_id()
      )';
      EXECUTE 'CREATE POLICY documents_backup_update ON public.documents_backup FOR UPDATE USING (
        public.is_super_admin() OR company_id = public.get_my_company_id()
      )';
      EXECUTE 'CREATE POLICY documents_backup_delete ON public.documents_backup FOR DELETE USING (
        public.is_super_admin() OR company_id = public.get_my_company_id()
      )';
    ELSE
      EXECUTE 'CREATE POLICY documents_backup_select ON public.documents_backup FOR SELECT USING (
        public.is_super_admin() OR company_id = public.get_my_company_id_text()
      )';
      EXECUTE 'CREATE POLICY documents_backup_insert ON public.documents_backup FOR INSERT WITH CHECK (
        public.is_super_admin() OR company_id = public.get_my_company_id_text()
      )';
      EXECUTE 'CREATE POLICY documents_backup_update ON public.documents_backup FOR UPDATE USING (
        public.is_super_admin() OR company_id = public.get_my_company_id_text()
      )';
      EXECUTE 'CREATE POLICY documents_backup_delete ON public.documents_backup FOR DELETE USING (
        public.is_super_admin() OR company_id = public.get_my_company_id_text()
      )';
    END IF;
    RAISE NOTICE 'OK: documents_backup — policies created';
  ELSE
    EXECUTE 'CREATE POLICY documents_backup_select ON public.documents_backup FOR SELECT USING (public.is_super_admin())';
    EXECUTE 'CREATE POLICY documents_backup_insert ON public.documents_backup FOR INSERT WITH CHECK (public.is_super_admin())';
    EXECUTE 'CREATE POLICY documents_backup_update ON public.documents_backup FOR UPDATE USING (public.is_super_admin())';
    EXECUTE 'CREATE POLICY documents_backup_delete ON public.documents_backup FOR DELETE USING (public.is_super_admin())';
    RAISE NOTICE 'WARN: documents_backup — no company_id, super_admin only';
  END IF;
END;
$$;

-- ================================================================
-- CATEGORY F: failed_login_attempts — user_id or email based
-- ================================================================
DO $$
BEGIN
  IF NOT _tmp_table_exists('failed_login_attempts') THEN
    RAISE NOTICE 'SKIP: table failed_login_attempts does not exist';
    RETURN;
  END IF;

  PERFORM _tmp_drop_policies('failed_login_attempts');

  IF _tmp_col_exists('failed_login_attempts', 'user_id') THEN
    EXECUTE 'CREATE POLICY fla_select ON public.failed_login_attempts FOR SELECT USING (
      public.is_super_admin() OR user_id = auth.uid()
    )';
  ELSIF _tmp_col_exists('failed_login_attempts', 'email') THEN
    EXECUTE 'CREATE POLICY fla_select ON public.failed_login_attempts FOR SELECT USING (
      public.is_super_admin() OR email = auth.jwt() ->> ''email''
    )';
  ELSE
    EXECUTE 'CREATE POLICY fla_select ON public.failed_login_attempts FOR SELECT USING (public.is_super_admin())';
  END IF;

  -- Insert/update/delete: super_admin only (service role inserts these)
  EXECUTE 'CREATE POLICY fla_insert ON public.failed_login_attempts FOR INSERT WITH CHECK (public.is_super_admin())';
  EXECUTE 'CREATE POLICY fla_update ON public.failed_login_attempts FOR UPDATE USING (public.is_super_admin())';
  EXECUTE 'CREATE POLICY fla_delete ON public.failed_login_attempts FOR DELETE USING (public.is_super_admin())';
  RAISE NOTICE 'OK: failed_login_attempts — policies created';
END;
$$;

-- ================================================================
-- CATEGORY G: system_metrics — platform-wide, super_admin only
-- (may or may not have company_id)
-- ================================================================
DO $$
BEGIN
  IF NOT _tmp_table_exists('system_metrics') THEN
    RAISE NOTICE 'SKIP: table system_metrics does not exist';
    RETURN;
  END IF;

  PERFORM _tmp_drop_policies('system_metrics');

  IF _tmp_col_exists('system_metrics', 'company_id') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'system_metrics'
        AND column_name = 'company_id' AND udt_name = 'uuid'
    ) THEN
      EXECUTE 'CREATE POLICY system_metrics_select ON public.system_metrics FOR SELECT USING (
        public.is_super_admin() OR company_id = public.get_my_company_id()
      )';
    ELSE
      EXECUTE 'CREATE POLICY system_metrics_select ON public.system_metrics FOR SELECT USING (
        public.is_super_admin() OR company_id = public.get_my_company_id_text()
      )';
    END IF;
  ELSE
    -- No company_id: super_admin only
    EXECUTE 'CREATE POLICY system_metrics_select ON public.system_metrics FOR SELECT USING (public.is_super_admin())';
  END IF;

  EXECUTE 'CREATE POLICY system_metrics_insert ON public.system_metrics FOR INSERT WITH CHECK (public.is_super_admin())';
  EXECUTE 'CREATE POLICY system_metrics_update ON public.system_metrics FOR UPDATE USING (public.is_super_admin())';
  EXECUTE 'CREATE POLICY system_metrics_delete ON public.system_metrics FOR DELETE USING (public.is_super_admin())';
  RAISE NOTICE 'OK: system_metrics — policies created';
END;
$$;

-- ================================================================
-- CATEGORY H: Reseller tables — linked via reseller_id
-- ================================================================
DO $$
DECLARE
  tbl text;
  tables_reseller text[] := ARRAY['commissions', 'reseller_commissions', 'reseller_milestones'];
BEGIN
  FOREACH tbl IN ARRAY tables_reseller
  LOOP
    IF NOT _tmp_table_exists(tbl) THEN
      RAISE NOTICE 'SKIP: table % does not exist', tbl;
      CONTINUE;
    END IF;

    PERFORM _tmp_drop_policies(tbl);

    IF _tmp_col_exists(tbl, 'reseller_id') THEN
      -- Reseller can see their own commissions/milestones
      -- Check if reseller_id is uuid or text to build the right join
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = tbl
          AND column_name = 'reseller_id' AND udt_name = 'uuid'
      ) THEN
        EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (
          public.is_super_admin()
          OR EXISTS (
            SELECT 1 FROM public.resellers r
            WHERE r.id::uuid = %I.reseller_id
              AND r.contact_email = auth.jwt() ->> ''email''
          )
        )', tbl || '_select', tbl, tbl);
      ELSE
        EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (
          public.is_super_admin()
          OR EXISTS (
            SELECT 1 FROM public.resellers r
            WHERE r.id::text = %I.reseller_id
              AND r.contact_email = auth.jwt() ->> ''email''
          )
        )', tbl || '_select', tbl, tbl);
      END IF;
    ELSIF _tmp_col_exists(tbl, 'company_id') THEN
      -- Fallback: company_id based
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = tbl
          AND column_name = 'company_id' AND udt_name = 'uuid'
      ) THEN
        EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (
          public.is_super_admin() OR company_id = public.get_my_company_id()
        )', tbl || '_select', tbl);
      ELSE
        EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (
          public.is_super_admin() OR company_id = public.get_my_company_id_text()
        )', tbl || '_select', tbl);
      END IF;
    ELSE
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (public.is_super_admin())', tbl || '_select', tbl);
    END IF;

    -- Write operations: super_admin only
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (public.is_super_admin())', tbl || '_insert', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (public.is_super_admin())', tbl || '_update', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (public.is_super_admin())', tbl || '_delete', tbl);
    RAISE NOTICE 'OK: % — reseller table policies created', tbl;
  END LOOP;
END;
$$;

-- ================================================================
-- CATEGORY I: meeting_attendees — linked via meetings table
-- ================================================================
DO $$
BEGIN
  IF NOT _tmp_table_exists('meeting_attendees') THEN
    RAISE NOTICE 'SKIP: table meeting_attendees does not exist';
    RETURN;
  END IF;

  PERFORM _tmp_drop_policies('meeting_attendees');

  IF _tmp_col_exists('meeting_attendees', 'company_id') THEN
    -- Direct company_id on meeting_attendees
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'meeting_attendees'
        AND column_name = 'company_id' AND udt_name = 'uuid'
    ) THEN
      EXECUTE 'CREATE POLICY ma_select ON public.meeting_attendees FOR SELECT USING (
        public.is_super_admin() OR company_id = public.get_my_company_id()
      )';
      EXECUTE 'CREATE POLICY ma_insert ON public.meeting_attendees FOR INSERT WITH CHECK (
        public.is_super_admin() OR company_id = public.get_my_company_id()
      )';
      EXECUTE 'CREATE POLICY ma_update ON public.meeting_attendees FOR UPDATE USING (
        public.is_super_admin() OR company_id = public.get_my_company_id()
      )';
      EXECUTE 'CREATE POLICY ma_delete ON public.meeting_attendees FOR DELETE USING (
        public.is_super_admin() OR company_id = public.get_my_company_id()
      )';
    ELSE
      EXECUTE 'CREATE POLICY ma_select ON public.meeting_attendees FOR SELECT USING (
        public.is_super_admin() OR company_id = public.get_my_company_id_text()
      )';
      EXECUTE 'CREATE POLICY ma_insert ON public.meeting_attendees FOR INSERT WITH CHECK (
        public.is_super_admin() OR company_id = public.get_my_company_id_text()
      )';
      EXECUTE 'CREATE POLICY ma_update ON public.meeting_attendees FOR UPDATE USING (
        public.is_super_admin() OR company_id = public.get_my_company_id_text()
      )';
      EXECUTE 'CREATE POLICY ma_delete ON public.meeting_attendees FOR DELETE USING (
        public.is_super_admin() OR company_id = public.get_my_company_id_text()
      )';
    END IF;
    RAISE NOTICE 'OK: meeting_attendees — direct company_id policies created';

  ELSIF _tmp_col_exists('meeting_attendees', 'meeting_id') AND _tmp_table_exists('meetings') THEN
    -- Join via meetings table
    IF _tmp_col_exists('meetings', 'company_id') THEN
      EXECUTE 'CREATE POLICY ma_select ON public.meeting_attendees FOR SELECT USING (
        public.is_super_admin()
        OR EXISTS (
          SELECT 1 FROM public.meetings m
          WHERE m.id = meeting_attendees.meeting_id
            AND m.company_id = public.get_my_company_id()
        )
      )';
      EXECUTE 'CREATE POLICY ma_insert ON public.meeting_attendees FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR EXISTS (
          SELECT 1 FROM public.meetings m
          WHERE m.id = meeting_attendees.meeting_id
            AND m.company_id = public.get_my_company_id()
        )
      )';
      EXECUTE 'CREATE POLICY ma_update ON public.meeting_attendees FOR UPDATE USING (
        public.is_super_admin()
        OR EXISTS (
          SELECT 1 FROM public.meetings m
          WHERE m.id = meeting_attendees.meeting_id
            AND m.company_id = public.get_my_company_id()
        )
      )';
      EXECUTE 'CREATE POLICY ma_delete ON public.meeting_attendees FOR DELETE USING (
        public.is_super_admin()
        OR EXISTS (
          SELECT 1 FROM public.meetings m
          WHERE m.id = meeting_attendees.meeting_id
            AND m.company_id = public.get_my_company_id()
        )
      )';
      RAISE NOTICE 'OK: meeting_attendees — join via meetings.company_id policies created';
    ELSE
      EXECUTE 'CREATE POLICY ma_select ON public.meeting_attendees FOR SELECT USING (public.is_super_admin())';
      EXECUTE 'CREATE POLICY ma_insert ON public.meeting_attendees FOR INSERT WITH CHECK (public.is_super_admin())';
      EXECUTE 'CREATE POLICY ma_update ON public.meeting_attendees FOR UPDATE USING (public.is_super_admin())';
      EXECUTE 'CREATE POLICY ma_delete ON public.meeting_attendees FOR DELETE USING (public.is_super_admin())';
      RAISE NOTICE 'WARN: meeting_attendees — meetings table has no company_id, super_admin only';
    END IF;
  ELSE
    EXECUTE 'CREATE POLICY ma_select ON public.meeting_attendees FOR SELECT USING (public.is_super_admin())';
    EXECUTE 'CREATE POLICY ma_insert ON public.meeting_attendees FOR INSERT WITH CHECK (public.is_super_admin())';
    EXECUTE 'CREATE POLICY ma_update ON public.meeting_attendees FOR UPDATE USING (public.is_super_admin())';
    EXECUTE 'CREATE POLICY ma_delete ON public.meeting_attendees FOR DELETE USING (public.is_super_admin())';
    RAISE NOTICE 'WARN: meeting_attendees — no meeting_id or company_id, super_admin only';
  END IF;
END;
$$;

-- ================================================================
-- CATEGORY J: user_permissions — linked via user_id to users table
-- ================================================================
DO $$
BEGIN
  IF NOT _tmp_table_exists('user_permissions') THEN
    RAISE NOTICE 'SKIP: table user_permissions does not exist';
    RETURN;
  END IF;

  PERFORM _tmp_drop_policies('user_permissions');

  IF _tmp_col_exists('user_permissions', 'user_id') THEN
    -- User can see own permissions; company admins see team permissions via users join
    EXECUTE 'CREATE POLICY up_select ON public.user_permissions FOR SELECT USING (
      public.is_super_admin()
      OR user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = user_permissions.user_id
          AND u.company_id = public.get_my_company_id()
      )
    )';
    EXECUTE 'CREATE POLICY up_insert ON public.user_permissions FOR INSERT WITH CHECK (
      public.is_super_admin()
      OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = user_permissions.user_id
          AND u.company_id = public.get_my_company_id()
      )
    )';
    EXECUTE 'CREATE POLICY up_update ON public.user_permissions FOR UPDATE USING (
      public.is_super_admin()
      OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = user_permissions.user_id
          AND u.company_id = public.get_my_company_id()
      )
    )';
    EXECUTE 'CREATE POLICY up_delete ON public.user_permissions FOR DELETE USING (
      public.is_super_admin()
      OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = user_permissions.user_id
          AND u.company_id = public.get_my_company_id()
      )
    )';
    RAISE NOTICE 'OK: user_permissions — user_id + company join policies created';
  ELSIF _tmp_col_exists('user_permissions', 'company_id') THEN
    -- Direct company_id
    EXECUTE 'CREATE POLICY up_select ON public.user_permissions FOR SELECT USING (
      public.is_super_admin() OR company_id = public.get_my_company_id()
    )';
    EXECUTE 'CREATE POLICY up_insert ON public.user_permissions FOR INSERT WITH CHECK (
      public.is_super_admin() OR company_id = public.get_my_company_id()
    )';
    EXECUTE 'CREATE POLICY up_update ON public.user_permissions FOR UPDATE USING (
      public.is_super_admin() OR company_id = public.get_my_company_id()
    )';
    EXECUTE 'CREATE POLICY up_delete ON public.user_permissions FOR DELETE USING (
      public.is_super_admin() OR company_id = public.get_my_company_id()
    )';
    RAISE NOTICE 'OK: user_permissions — direct company_id policies created';
  ELSE
    EXECUTE 'CREATE POLICY up_select ON public.user_permissions FOR SELECT USING (public.is_super_admin())';
    EXECUTE 'CREATE POLICY up_insert ON public.user_permissions FOR INSERT WITH CHECK (public.is_super_admin())';
    EXECUTE 'CREATE POLICY up_update ON public.user_permissions FOR UPDATE USING (public.is_super_admin())';
    EXECUTE 'CREATE POLICY up_delete ON public.user_permissions FOR DELETE USING (public.is_super_admin())';
    RAISE NOTICE 'WARN: user_permissions — no user_id or company_id, super_admin only';
  END IF;
END;
$$;

-- ================================================================
-- CLEANUP: Remove temporary helper functions
-- ================================================================
DROP FUNCTION IF EXISTS _tmp_drop_policies(text);
DROP FUNCTION IF EXISTS _tmp_col_exists(text, text);
DROP FUNCTION IF EXISTS _tmp_table_exists(text);

-- ================================================================
-- ENABLE RLS on all tables (idempotent — no harm if already enabled)
-- ================================================================
DO $$
DECLARE
  tbl text;
  all_tables text[] := ARRAY[
    'ai_operations', 'ai_recommendations', 'audit_logs',
    'clauses', 'client_health', 'clients', 'commissions',
    'compliance_reports', 'document_approvals', 'documents_backup',
    'failed_login_attempts', 'iso_standards', 'meeting_attendees',
    'meetings', 'payments', 'reseller_commissions',
    'reseller_milestones', 'security_events', 'system_metrics',
    'team_members', 'user_permissions'
  ];
BEGIN
  FOREACH tbl IN ARRAY all_tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END;
$$;

-- ================================================================
-- VERIFICATION: Run this after to confirm all tables have policies
-- ================================================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'ai_operations', 'ai_recommendations', 'audit_logs',
--     'clauses', 'client_health', 'clients', 'commissions',
--     'compliance_reports', 'document_approvals', 'documents_backup',
--     'failed_login_attempts', 'iso_standards', 'meeting_attendees',
--     'meetings', 'payments', 'reseller_commissions',
--     'reseller_milestones', 'security_events', 'system_metrics',
--     'team_members', 'user_permissions'
--   )
-- ORDER BY tablename, policyname;
