-- IMS Clause 4.1: Understanding the Organisation and its Context
CREATE TABLE IF NOT EXISTS context_issues (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  issue_title text NOT NULL,
  description text,
  issue_type text NOT NULL CHECK (issue_type IN (
    'internal_strength', 'internal_weakness',
    'external_opportunity', 'external_threat'
  )),
  category text NOT NULL CHECK (category IN (
    'political', 'economic', 'social', 'technological',
    'legal', 'environmental', 'competitive', 'organisational',
    'cultural', 'financial', 'infrastructure', 'human_resources', 'other'
  )),
  impact_level text NOT NULL DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  affected_processes text,
  standards text[] NOT NULL DEFAULT '{}',
  clause_references text[] DEFAULT '{4.1}',
  response_action text,
  responsible_person text,
  target_date date,
  linked_risk_id uuid,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Monitoring', 'Resolved', 'Archived')),
  last_reviewed date,
  next_review_date date,
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_context_issues_company ON context_issues(company_id);
CREATE INDEX IF NOT EXISTS idx_context_issues_type ON context_issues(issue_type);

ALTER TABLE context_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "context_issues_select" ON context_issues
  FOR SELECT USING (company_id = public.get_my_company_id() OR public.is_super_admin() OR public.is_reseller_for_uuid(company_id));
CREATE POLICY "context_issues_insert" ON context_issues
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
CREATE POLICY "context_issues_update" ON context_issues
  FOR UPDATE USING (company_id = public.get_my_company_id());
CREATE POLICY "context_issues_delete" ON context_issues
  FOR DELETE USING (company_id = public.get_my_company_id());

CREATE TRIGGER trg_context_issues_updated
  BEFORE UPDATE ON context_issues FOR EACH ROW
  EXECUTE FUNCTION update_processes_updated_at();
