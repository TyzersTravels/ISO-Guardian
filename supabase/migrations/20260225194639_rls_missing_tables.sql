-- ================================================================
-- ISOGuardian — RLS Policies for tables missing policies
-- Scope: tables relevant to the live app (SLA / reseller commitments)
-- AI roadmap tables (ai_operations, ai_recommendations) excluded —
-- these will be addressed when AI features are built.
-- ================================================================

-- ----------------------------------------------------------------
-- audit_logs  (company_id — check type; immutable so no update/delete)
-- ----------------------------------------------------------------
DO $$
DECLARE has_cid_uuid boolean; has_cid_text boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='company_id' AND data_type='uuid') INTO has_cid_uuid;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='company_id' AND data_type='text') INTO has_cid_text;
  EXECUTE 'DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs';
  EXECUTE 'DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs';
  EXECUTE 'DROP POLICY IF EXISTS "audit_logs_update" ON public.audit_logs';
  EXECUTE 'DROP POLICY IF EXISTS "audit_logs_delete" ON public.audit_logs';
  IF has_cid_uuid THEN
    EXECUTE $p$CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
  ELSIF has_cid_text THEN
    EXECUTE $p$CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (public.is_super_admin() OR company_id = public.get_my_company_id_text())$p$;
    EXECUTE $p$CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (public.is_super_admin() OR company_id = public.get_my_company_id_text())$p$;
  ELSE
    EXECUTE $p$CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (public.is_super_admin())$p$;
  END IF;
  -- Audit logs are immutable — only super_admin can modify/delete
  EXECUTE $p$CREATE POLICY "audit_logs_update" ON public.audit_logs FOR UPDATE USING (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "audit_logs_delete" ON public.audit_logs FOR DELETE USING (public.is_super_admin())$p$;
END $$;

-- ----------------------------------------------------------------
-- clauses  (ISO reference data — no company_id; authenticated read only)
-- ----------------------------------------------------------------
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "clauses_select" ON public.clauses';
  EXECUTE 'DROP POLICY IF EXISTS "clauses_insert" ON public.clauses';
  EXECUTE 'DROP POLICY IF EXISTS "clauses_update" ON public.clauses';
  EXECUTE 'DROP POLICY IF EXISTS "clauses_delete" ON public.clauses';
  EXECUTE $p$CREATE POLICY "clauses_select" ON public.clauses FOR SELECT USING (auth.role() = 'authenticated')$p$;
  EXECUTE $p$CREATE POLICY "clauses_insert" ON public.clauses FOR INSERT WITH CHECK (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "clauses_update" ON public.clauses FOR UPDATE USING (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "clauses_delete" ON public.clauses FOR DELETE USING (public.is_super_admin())$p$;
END $$;

-- ----------------------------------------------------------------
-- client_health  (company_id; resellers can read their clients)
-- ----------------------------------------------------------------
DO $$
DECLARE has_cid boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='client_health' AND column_name='company_id' AND data_type='uuid') INTO has_cid;
  EXECUTE 'DROP POLICY IF EXISTS "client_health_select" ON public.client_health';
  EXECUTE 'DROP POLICY IF EXISTS "client_health_insert" ON public.client_health';
  EXECUTE 'DROP POLICY IF EXISTS "client_health_update" ON public.client_health';
  EXECUTE 'DROP POLICY IF EXISTS "client_health_delete" ON public.client_health';
  IF has_cid THEN
    EXECUTE $p$CREATE POLICY "client_health_select" ON public.client_health FOR SELECT USING (public.is_super_admin() OR company_id = public.get_my_company_id() OR public.is_reseller_for_uuid(company_id))$p$;
    EXECUTE $p$CREATE POLICY "client_health_insert" ON public.client_health FOR INSERT WITH CHECK (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "client_health_update" ON public.client_health FOR UPDATE USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "client_health_delete" ON public.client_health FOR DELETE USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
  ELSE
    EXECUTE $p$CREATE POLICY "client_health_select" ON public.client_health FOR SELECT USING (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "client_health_insert" ON public.client_health FOR INSERT WITH CHECK (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "client_health_update" ON public.client_health FOR UPDATE USING (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "client_health_delete" ON public.client_health FOR DELETE USING (public.is_super_admin())$p$;
  END IF;
END $$;

-- ----------------------------------------------------------------
-- compliance_reports  (company_id; resellers can read)
-- ----------------------------------------------------------------
DO $$
DECLARE has_cid boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='compliance_reports' AND column_name='company_id' AND data_type='uuid') INTO has_cid;
  EXECUTE 'DROP POLICY IF EXISTS "compliance_reports_select" ON public.compliance_reports';
  EXECUTE 'DROP POLICY IF EXISTS "compliance_reports_insert" ON public.compliance_reports';
  EXECUTE 'DROP POLICY IF EXISTS "compliance_reports_update" ON public.compliance_reports';
  EXECUTE 'DROP POLICY IF EXISTS "compliance_reports_delete" ON public.compliance_reports';
  IF has_cid THEN
    EXECUTE $p$CREATE POLICY "compliance_reports_select" ON public.compliance_reports FOR SELECT USING (public.is_super_admin() OR company_id = public.get_my_company_id() OR public.is_reseller_for_uuid(company_id))$p$;
    EXECUTE $p$CREATE POLICY "compliance_reports_insert" ON public.compliance_reports FOR INSERT WITH CHECK (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "compliance_reports_update" ON public.compliance_reports FOR UPDATE USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "compliance_reports_delete" ON public.compliance_reports FOR DELETE USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
  ELSE
    EXECUTE $p$CREATE POLICY "compliance_reports_select" ON public.compliance_reports FOR SELECT USING (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "compliance_reports_insert" ON public.compliance_reports FOR INSERT WITH CHECK (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "compliance_reports_update" ON public.compliance_reports FOR UPDATE USING (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "compliance_reports_delete" ON public.compliance_reports FOR DELETE USING (public.is_super_admin())$p$;
  END IF;
END $$;

-- ----------------------------------------------------------------
-- document_approvals  (company_id)
-- ----------------------------------------------------------------
DO $$
DECLARE has_cid boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='document_approvals' AND column_name='company_id' AND data_type='uuid') INTO has_cid;
  EXECUTE 'DROP POLICY IF EXISTS "document_approvals_select" ON public.document_approvals';
  EXECUTE 'DROP POLICY IF EXISTS "document_approvals_insert" ON public.document_approvals';
  EXECUTE 'DROP POLICY IF EXISTS "document_approvals_update" ON public.document_approvals';
  EXECUTE 'DROP POLICY IF EXISTS "document_approvals_delete" ON public.document_approvals';
  IF has_cid THEN
    EXECUTE $p$CREATE POLICY "document_approvals_select" ON public.document_approvals FOR SELECT USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "document_approvals_insert" ON public.document_approvals FOR INSERT WITH CHECK (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "document_approvals_update" ON public.document_approvals FOR UPDATE USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "document_approvals_delete" ON public.document_approvals FOR DELETE USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
  ELSE
    EXECUTE $p$CREATE POLICY "document_approvals_select" ON public.document_approvals FOR SELECT USING (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "document_approvals_insert" ON public.document_approvals FOR INSERT WITH CHECK (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "document_approvals_update" ON public.document_approvals FOR UPDATE USING (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "document_approvals_delete" ON public.document_approvals FOR DELETE USING (public.is_super_admin())$p$;
  END IF;
END $$;

-- ----------------------------------------------------------------
-- documents_backup  (company_id TEXT — matches documents table)
-- ----------------------------------------------------------------
DO $$
DECLARE has_text boolean; has_uuid boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents_backup' AND column_name='company_id' AND data_type='text') INTO has_text;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents_backup' AND column_name='company_id' AND data_type='uuid') INTO has_uuid;
  EXECUTE 'DROP POLICY IF EXISTS "documents_backup_select" ON public.documents_backup';
  EXECUTE 'DROP POLICY IF EXISTS "documents_backup_insert" ON public.documents_backup';
  EXECUTE 'DROP POLICY IF EXISTS "documents_backup_update" ON public.documents_backup';
  EXECUTE 'DROP POLICY IF EXISTS "documents_backup_delete" ON public.documents_backup';
  IF has_text THEN
    EXECUTE $p$CREATE POLICY "documents_backup_select" ON public.documents_backup FOR SELECT USING (public.is_super_admin() OR company_id = public.get_my_company_id_text())$p$;
    EXECUTE $p$CREATE POLICY "documents_backup_insert" ON public.documents_backup FOR INSERT WITH CHECK (public.is_super_admin() OR company_id = public.get_my_company_id_text())$p$;
    EXECUTE $p$CREATE POLICY "documents_backup_update" ON public.documents_backup FOR UPDATE USING (public.is_super_admin() OR company_id = public.get_my_company_id_text())$p$;
    EXECUTE $p$CREATE POLICY "documents_backup_delete" ON public.documents_backup FOR DELETE USING (public.is_super_admin() OR company_id = public.get_my_company_id_text())$p$;
  ELSIF has_uuid THEN
    EXECUTE $p$CREATE POLICY "documents_backup_select" ON public.documents_backup FOR SELECT USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "documents_backup_insert" ON public.documents_backup FOR INSERT WITH CHECK (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "documents_backup_update" ON public.documents_backup FOR UPDATE USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "documents_backup_delete" ON public.documents_backup FOR DELETE USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
  ELSE
    EXECUTE $p$CREATE POLICY "documents_backup_select" ON public.documents_backup FOR SELECT USING (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "documents_backup_insert" ON public.documents_backup FOR INSERT WITH CHECK (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "documents_backup_update" ON public.documents_backup FOR UPDATE USING (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "documents_backup_delete" ON public.documents_backup FOR DELETE USING (public.is_super_admin())$p$;
  END IF;
END $$;

-- ----------------------------------------------------------------
-- failed_login_attempts  (security data — super_admin only for writes)
-- ----------------------------------------------------------------
DO $$
DECLARE has_uid boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='failed_login_attempts' AND column_name='user_id') INTO has_uid;
  EXECUTE 'DROP POLICY IF EXISTS "failed_login_attempts_select" ON public.failed_login_attempts';
  EXECUTE 'DROP POLICY IF EXISTS "failed_login_attempts_insert" ON public.failed_login_attempts';
  EXECUTE 'DROP POLICY IF EXISTS "failed_login_attempts_update" ON public.failed_login_attempts';
  EXECUTE 'DROP POLICY IF EXISTS "failed_login_attempts_delete" ON public.failed_login_attempts';
  IF has_uid THEN
    EXECUTE $p$CREATE POLICY "failed_login_attempts_select" ON public.failed_login_attempts FOR SELECT USING (public.is_super_admin() OR user_id = auth.uid())$p$;
  ELSE
    EXECUTE $p$CREATE POLICY "failed_login_attempts_select" ON public.failed_login_attempts FOR SELECT USING (public.is_super_admin())$p$;
  END IF;
  EXECUTE $p$CREATE POLICY "failed_login_attempts_insert" ON public.failed_login_attempts FOR INSERT WITH CHECK (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "failed_login_attempts_update" ON public.failed_login_attempts FOR UPDATE USING (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "failed_login_attempts_delete" ON public.failed_login_attempts FOR DELETE USING (public.is_super_admin())$p$;
END $$;

-- ----------------------------------------------------------------
-- iso_standards  (reference data — no company_id; authenticated read)
-- ----------------------------------------------------------------
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "iso_standards_select" ON public.iso_standards';
  EXECUTE 'DROP POLICY IF EXISTS "iso_standards_insert" ON public.iso_standards';
  EXECUTE 'DROP POLICY IF EXISTS "iso_standards_update" ON public.iso_standards';
  EXECUTE 'DROP POLICY IF EXISTS "iso_standards_delete" ON public.iso_standards';
  EXECUTE $p$CREATE POLICY "iso_standards_select" ON public.iso_standards FOR SELECT USING (auth.role() = 'authenticated')$p$;
  EXECUTE $p$CREATE POLICY "iso_standards_insert" ON public.iso_standards FOR INSERT WITH CHECK (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "iso_standards_update" ON public.iso_standards FOR UPDATE USING (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "iso_standards_delete" ON public.iso_standards FOR DELETE USING (public.is_super_admin())$p$;
END $$;

-- ----------------------------------------------------------------
-- payments  (clients view own invoices; super_admin manages)
-- ----------------------------------------------------------------
DO $$
DECLARE has_cid boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='company_id' AND data_type='uuid') INTO has_cid;
  EXECUTE 'DROP POLICY IF EXISTS "payments_select" ON public.payments';
  EXECUTE 'DROP POLICY IF EXISTS "payments_insert" ON public.payments';
  EXECUTE 'DROP POLICY IF EXISTS "payments_update" ON public.payments';
  EXECUTE 'DROP POLICY IF EXISTS "payments_delete" ON public.payments';
  IF has_cid THEN
    EXECUTE $p$CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
  ELSE
    EXECUTE $p$CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (public.is_super_admin())$p$;
  END IF;
  EXECUTE $p$CREATE POLICY "payments_insert" ON public.payments FOR INSERT WITH CHECK (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "payments_update" ON public.payments FOR UPDATE USING (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "payments_delete" ON public.payments FOR DELETE USING (public.is_super_admin())$p$;
END $$;

-- ----------------------------------------------------------------
-- reseller_commissions  (reseller sees own — NOTE: reseller_id is UUID)
-- ----------------------------------------------------------------
DO $$
DECLARE has_rid boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reseller_commissions' AND column_name='reseller_id') INTO has_rid;
  EXECUTE 'DROP POLICY IF EXISTS "reseller_commissions_select" ON public.reseller_commissions';
  EXECUTE 'DROP POLICY IF EXISTS "reseller_commissions_insert" ON public.reseller_commissions';
  EXECUTE 'DROP POLICY IF EXISTS "reseller_commissions_update" ON public.reseller_commissions';
  EXECUTE 'DROP POLICY IF EXISTS "reseller_commissions_delete" ON public.reseller_commissions';
  IF has_rid THEN
    -- Use subquery to avoid text/uuid cast issues — join on email instead
    EXECUTE $p$CREATE POLICY "reseller_commissions_select" ON public.reseller_commissions
      FOR SELECT USING (
        public.is_super_admin()
        OR reseller_id IN (SELECT id FROM public.resellers WHERE contact_email = auth.jwt() ->> 'email')
      )$p$;
  ELSE
    EXECUTE $p$CREATE POLICY "reseller_commissions_select" ON public.reseller_commissions FOR SELECT USING (public.is_super_admin())$p$;
  END IF;
  EXECUTE $p$CREATE POLICY "reseller_commissions_insert" ON public.reseller_commissions FOR INSERT WITH CHECK (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "reseller_commissions_update" ON public.reseller_commissions FOR UPDATE USING (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "reseller_commissions_delete" ON public.reseller_commissions FOR DELETE USING (public.is_super_admin())$p$;
END $$;

-- ----------------------------------------------------------------
-- reseller_milestones  (reseller sees own — same UUID pattern)
-- ----------------------------------------------------------------
DO $$
DECLARE has_rid boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reseller_milestones' AND column_name='reseller_id') INTO has_rid;
  EXECUTE 'DROP POLICY IF EXISTS "reseller_milestones_select" ON public.reseller_milestones';
  EXECUTE 'DROP POLICY IF EXISTS "reseller_milestones_insert" ON public.reseller_milestones';
  EXECUTE 'DROP POLICY IF EXISTS "reseller_milestones_update" ON public.reseller_milestones';
  EXECUTE 'DROP POLICY IF EXISTS "reseller_milestones_delete" ON public.reseller_milestones';
  IF has_rid THEN
    EXECUTE $p$CREATE POLICY "reseller_milestones_select" ON public.reseller_milestones
      FOR SELECT USING (
        public.is_super_admin()
        OR reseller_id IN (SELECT id FROM public.resellers WHERE contact_email = auth.jwt() ->> 'email')
      )$p$;
  ELSE
    EXECUTE $p$CREATE POLICY "reseller_milestones_select" ON public.reseller_milestones FOR SELECT USING (public.is_super_admin())$p$;
  END IF;
  EXECUTE $p$CREATE POLICY "reseller_milestones_insert" ON public.reseller_milestones FOR INSERT WITH CHECK (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "reseller_milestones_update" ON public.reseller_milestones FOR UPDATE USING (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "reseller_milestones_delete" ON public.reseller_milestones FOR DELETE USING (public.is_super_admin())$p$;
END $$;

-- ----------------------------------------------------------------
-- security_events  (company-scoped security records)
-- ----------------------------------------------------------------
DO $$
DECLARE has_cid boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='security_events' AND column_name='company_id' AND data_type='uuid') INTO has_cid;
  EXECUTE 'DROP POLICY IF EXISTS "security_events_select" ON public.security_events';
  EXECUTE 'DROP POLICY IF EXISTS "security_events_insert" ON public.security_events';
  EXECUTE 'DROP POLICY IF EXISTS "security_events_update" ON public.security_events';
  EXECUTE 'DROP POLICY IF EXISTS "security_events_delete" ON public.security_events';
  IF has_cid THEN
    EXECUTE $p$CREATE POLICY "security_events_select" ON public.security_events FOR SELECT USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "security_events_insert" ON public.security_events FOR INSERT WITH CHECK (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
  ELSE
    EXECUTE $p$CREATE POLICY "security_events_select" ON public.security_events FOR SELECT USING (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "security_events_insert" ON public.security_events FOR INSERT WITH CHECK (public.is_super_admin())$p$;
  END IF;
  EXECUTE $p$CREATE POLICY "security_events_update" ON public.security_events FOR UPDATE USING (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "security_events_delete" ON public.security_events FOR DELETE USING (public.is_super_admin())$p$;
END $$;

-- ----------------------------------------------------------------
-- team_members  (company_id)
-- ----------------------------------------------------------------
DO $$
DECLARE has_cid boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='team_members' AND column_name='company_id' AND data_type='uuid') INTO has_cid;
  EXECUTE 'DROP POLICY IF EXISTS "team_members_select" ON public.team_members';
  EXECUTE 'DROP POLICY IF EXISTS "team_members_insert" ON public.team_members';
  EXECUTE 'DROP POLICY IF EXISTS "team_members_update" ON public.team_members';
  EXECUTE 'DROP POLICY IF EXISTS "team_members_delete" ON public.team_members';
  IF has_cid THEN
    EXECUTE $p$CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT WITH CHECK (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "team_members_update" ON public.team_members FOR UPDATE USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "team_members_delete" ON public.team_members FOR DELETE USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
  ELSE
    EXECUTE $p$CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT WITH CHECK (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "team_members_update" ON public.team_members FOR UPDATE USING (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "team_members_delete" ON public.team_members FOR DELETE USING (public.is_super_admin())$p$;
  END IF;
END $$;

-- ----------------------------------------------------------------
-- user_permissions  (users see own; company admins manage their team)
-- ----------------------------------------------------------------
DO $$
DECLARE has_uid boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_permissions' AND column_name='user_id') INTO has_uid;
  EXECUTE 'DROP POLICY IF EXISTS "user_permissions_select" ON public.user_permissions';
  EXECUTE 'DROP POLICY IF EXISTS "user_permissions_insert" ON public.user_permissions';
  EXECUTE 'DROP POLICY IF EXISTS "user_permissions_update" ON public.user_permissions';
  EXECUTE 'DROP POLICY IF EXISTS "user_permissions_delete" ON public.user_permissions';
  IF has_uid THEN
    EXECUTE $p$CREATE POLICY "user_permissions_select" ON public.user_permissions FOR SELECT USING (public.is_super_admin() OR user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.users u WHERE u.id = user_permissions.user_id AND u.company_id = public.get_my_company_id()))$p$;
    EXECUTE $p$CREATE POLICY "user_permissions_insert" ON public.user_permissions FOR INSERT WITH CHECK (public.is_super_admin() OR EXISTS(SELECT 1 FROM public.users u WHERE u.id = user_permissions.user_id AND u.company_id = public.get_my_company_id()))$p$;
    EXECUTE $p$CREATE POLICY "user_permissions_update" ON public.user_permissions FOR UPDATE USING (public.is_super_admin() OR EXISTS(SELECT 1 FROM public.users u WHERE u.id = user_permissions.user_id AND u.company_id = public.get_my_company_id()))$p$;
    EXECUTE $p$CREATE POLICY "user_permissions_delete" ON public.user_permissions FOR DELETE USING (public.is_super_admin() OR EXISTS(SELECT 1 FROM public.users u WHERE u.id = user_permissions.user_id AND u.company_id = public.get_my_company_id()))$p$;
  ELSE
    EXECUTE $p$CREATE POLICY "user_permissions_select" ON public.user_permissions FOR SELECT USING (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "user_permissions_insert" ON public.user_permissions FOR INSERT WITH CHECK (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "user_permissions_update" ON public.user_permissions FOR UPDATE USING (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "user_permissions_delete" ON public.user_permissions FOR DELETE USING (public.is_super_admin())$p$;
  END IF;
END $$;

-- ----------------------------------------------------------------
-- system_metrics  (platform-wide; super_admin only)
-- ----------------------------------------------------------------
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "system_metrics_select" ON public.system_metrics';
  EXECUTE 'DROP POLICY IF EXISTS "system_metrics_insert" ON public.system_metrics';
  EXECUTE 'DROP POLICY IF EXISTS "system_metrics_update" ON public.system_metrics';
  EXECUTE 'DROP POLICY IF EXISTS "system_metrics_delete" ON public.system_metrics';
  EXECUTE $p$CREATE POLICY "system_metrics_select" ON public.system_metrics FOR SELECT USING (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "system_metrics_insert" ON public.system_metrics FOR INSERT WITH CHECK (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "system_metrics_update" ON public.system_metrics FOR UPDATE USING (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "system_metrics_delete" ON public.system_metrics FOR DELETE USING (public.is_super_admin())$p$;
END $$;

-- ----------------------------------------------------------------
-- clients  (reseller-managed — super_admin + reseller read)
-- ----------------------------------------------------------------
DO $$
DECLARE has_cid boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='company_id' AND data_type='uuid') INTO has_cid;
  EXECUTE 'DROP POLICY IF EXISTS "clients_select" ON public.clients';
  EXECUTE 'DROP POLICY IF EXISTS "clients_insert" ON public.clients';
  EXECUTE 'DROP POLICY IF EXISTS "clients_update" ON public.clients';
  EXECUTE 'DROP POLICY IF EXISTS "clients_delete" ON public.clients';
  IF has_cid THEN
    EXECUTE $p$CREATE POLICY "clients_select" ON public.clients FOR SELECT USING (public.is_super_admin() OR company_id = public.get_my_company_id() OR public.is_reseller_for_uuid(company_id))$p$;
    EXECUTE $p$CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "clients_update" ON public.clients FOR UPDATE USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
    EXECUTE $p$CREATE POLICY "clients_delete" ON public.clients FOR DELETE USING (public.is_super_admin() OR company_id = public.get_my_company_id())$p$;
  ELSE
    EXECUTE $p$CREATE POLICY "clients_select" ON public.clients FOR SELECT USING (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "clients_update" ON public.clients FOR UPDATE USING (public.is_super_admin())$p$;
    EXECUTE $p$CREATE POLICY "clients_delete" ON public.clients FOR DELETE USING (public.is_super_admin())$p$;
  END IF;
END $$;

-- ----------------------------------------------------------------
-- commissions  (reseller earnings — super_admin manages)
-- ----------------------------------------------------------------
DO $$
DECLARE has_rid boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='commissions' AND column_name='reseller_id') INTO has_rid;
  EXECUTE 'DROP POLICY IF EXISTS "commissions_select" ON public.commissions';
  EXECUTE 'DROP POLICY IF EXISTS "commissions_insert" ON public.commissions';
  EXECUTE 'DROP POLICY IF EXISTS "commissions_update" ON public.commissions';
  EXECUTE 'DROP POLICY IF EXISTS "commissions_delete" ON public.commissions';
  IF has_rid THEN
    EXECUTE $p$CREATE POLICY "commissions_select" ON public.commissions
      FOR SELECT USING (
        public.is_super_admin()
        OR reseller_id IN (SELECT id FROM public.resellers WHERE contact_email = auth.jwt() ->> 'email')
      )$p$;
  ELSE
    EXECUTE $p$CREATE POLICY "commissions_select" ON public.commissions FOR SELECT USING (public.is_super_admin())$p$;
  END IF;
  EXECUTE $p$CREATE POLICY "commissions_insert" ON public.commissions FOR INSERT WITH CHECK (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "commissions_update" ON public.commissions FOR UPDATE USING (public.is_super_admin())$p$;
  EXECUTE $p$CREATE POLICY "commissions_delete" ON public.commissions FOR DELETE USING (public.is_super_admin())$p$;
END $$;
