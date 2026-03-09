-- ISOGuardian AI Copilot — Database Tables
-- Run this in Supabase SQL Editor

-- ─── AI Usage Tracking Table ─────────────────────────────────────────────────
-- Tracks all AI queries for fair usage enforcement and cost monitoring

CREATE TABLE IF NOT EXISTS ai_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  company_id uuid NOT NULL REFERENCES companies(id),
  query_type text NOT NULL DEFAULT 'chat',  -- 'chat', 'document_analysis', 'gap_analysis'
  tokens_used integer NOT NULL DEFAULT 0,
  model text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_company_month
  ON ai_usage (company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_daily
  ON ai_usage (created_at);

-- RLS: Users can only see their own company's usage
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company AI usage"
  ON ai_usage FOR SELECT
  USING (company_id = public.get_my_company_id());

CREATE POLICY "Super admins can view all AI usage"
  ON ai_usage FOR SELECT
  USING (public.is_super_admin());

-- Service role inserts (Edge Function uses service role key)
CREATE POLICY "Service role can insert AI usage"
  ON ai_usage FOR INSERT
  WITH CHECK (true);

-- ─── AI Chat History Table ───────────────────────────────────────────────────
-- Stores conversation history per user for context persistence

CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  company_id uuid NOT NULL REFERENCES companies(id),
  title text NOT NULL DEFAULT 'New Conversation',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user
  ON ai_conversations (user_id, updated_at DESC);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations"
  ON ai_conversations FOR ALL
  USING (user_id = auth.uid());

-- ─── Auditor Portal Tables ───────────────────────────────────────────────────

-- Audit sessions: links external auditors to specific audits
CREATE TABLE IF NOT EXISTS audit_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id),
  auditor_name text NOT NULL,
  auditor_email text NOT NULL,
  auditor_organisation text,
  access_token text NOT NULL UNIQUE,  -- Secure token for auditor login
  status text NOT NULL DEFAULT 'pending',  -- pending, active, completed, expired
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_sessions_token
  ON audit_sessions (access_token);
CREATE INDEX IF NOT EXISTS idx_audit_sessions_audit
  ON audit_sessions (audit_id);

ALTER TABLE audit_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can manage audit sessions"
  ON audit_sessions FOR ALL
  USING (company_id = public.get_my_company_id());

CREATE POLICY "Super admins can view all audit sessions"
  ON audit_sessions FOR SELECT
  USING (public.is_super_admin());

-- Audit findings: real-time findings raised during audits
CREATE TABLE IF NOT EXISTS audit_findings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_session_id uuid NOT NULL REFERENCES audit_sessions(id) ON DELETE CASCADE,
  audit_id uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id),
  clause text NOT NULL,
  standard text NOT NULL,
  finding_type text NOT NULL,  -- 'major_nc', 'minor_nc', 'observation', 'opportunity', 'conformity'
  description text NOT NULL,
  evidence text,
  evidence_files jsonb DEFAULT '[]'::jsonb,  -- Array of file URLs
  auditor_notes text,
  status text NOT NULL DEFAULT 'open',  -- open, accepted, disputed, closed
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_findings_session
  ON audit_findings (audit_session_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_audit
  ON audit_findings (audit_id);

ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view findings"
  ON audit_findings FOR SELECT
  USING (company_id = public.get_my_company_id());

CREATE POLICY "Company admins can manage findings"
  ON audit_findings FOR ALL
  USING (company_id = public.get_my_company_id());

CREATE POLICY "Super admins can view all findings"
  ON audit_findings FOR SELECT
  USING (public.is_super_admin());

-- Audit checklist: clause-by-clause checklist for live auditing
CREATE TABLE IF NOT EXISTS audit_checklist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_session_id uuid NOT NULL REFERENCES audit_sessions(id) ON DELETE CASCADE,
  audit_id uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id),
  standard text NOT NULL,
  clause text NOT NULL,
  clause_title text NOT NULL,
  result text,  -- 'conforming', 'non_conforming', 'not_applicable', 'not_audited'
  notes text,
  evidence_refs jsonb DEFAULT '[]'::jsonb,
  checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_checklist_session
  ON audit_checklist (audit_session_id, standard, clause);

ALTER TABLE audit_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view checklist"
  ON audit_checklist FOR SELECT
  USING (company_id = public.get_my_company_id());

CREATE POLICY "Company admins can manage checklist"
  ON audit_checklist FOR ALL
  USING (company_id = public.get_my_company_id());

-- ─── Grant permissions ───────────────────────────────────────────────────────
GRANT ALL ON ai_usage TO authenticated;
GRANT ALL ON ai_usage TO service_role;
GRANT ALL ON ai_conversations TO authenticated;
GRANT ALL ON audit_sessions TO authenticated;
GRANT ALL ON audit_findings TO authenticated;
GRANT ALL ON audit_checklist TO authenticated;
