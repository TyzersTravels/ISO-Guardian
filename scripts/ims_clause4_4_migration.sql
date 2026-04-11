-- ============================================================
-- IMS Clause 4.4: Quality Management System and its Processes
-- Process Register / Process Map
-- Run in Supabase SQL Editor
-- ============================================================

-- =============================
-- 1. PROCESS REGISTER (Clause 4.4)
-- =============================
CREATE TABLE IF NOT EXISTS processes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Process identification
  process_name text NOT NULL,
  process_code text, -- e.g. PR-001
  process_owner uuid REFERENCES users(id),
  process_owner_name text, -- display name (denormalized for speed)
  department text,

  -- Classification
  process_type text NOT NULL CHECK (process_type IN (
    'core', 'support', 'management'
  )),
  -- core = value-adding (sales, production, service delivery)
  -- support = enabling (HR, IT, procurement, maintenance)
  -- management = governing (planning, review, improvement)

  -- IMS mapping
  standards text[] NOT NULL DEFAULT '{}',
  clause_references text[] NOT NULL DEFAULT '{}', -- e.g. ['4.4', '8.1']

  -- Process details (ISO 4.4.1 a-h)
  purpose text, -- what the process achieves
  scope text, -- boundaries of the process
  inputs text, -- required inputs
  outputs text, -- expected outputs / deliverables
  activities text, -- key activities / steps
  sequence_order integer DEFAULT 0, -- for ordering in process map

  -- Interactions
  upstream_processes uuid[] DEFAULT '{}', -- process IDs that feed into this
  downstream_processes uuid[] DEFAULT '{}', -- process IDs this feeds into

  -- Resources & responsibilities
  resources text, -- people, equipment, information needed
  competency_requirements text, -- skills/training needed

  -- Risks & opportunities (link to risk register)
  risks_opportunities text, -- summary of associated risks

  -- Performance
  kpis text, -- key performance indicators
  performance_target text, -- measurable targets
  monitoring_method text, -- how performance is measured
  monitoring_frequency text CHECK (monitoring_frequency IN (
    'daily', 'weekly', 'monthly', 'quarterly', 'biannually', 'annually'
  )),

  -- Documentation
  related_documents text, -- document references
  related_procedures text, -- SOP references

  -- Status
  status text NOT NULL DEFAULT 'Active' CHECK (status IN (
    'Active', 'Under Review', 'Obsolete', 'Draft'
  )),
  effective_date date,
  last_reviewed date,
  next_review_date date,

  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================
-- 2. INDEXES
-- =============================
CREATE INDEX IF NOT EXISTS idx_processes_company ON processes(company_id);
CREATE INDEX IF NOT EXISTS idx_processes_type ON processes(process_type);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);
CREATE INDEX IF NOT EXISTS idx_processes_owner ON processes(process_owner);

-- =============================
-- 3. RLS POLICIES
-- =============================
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;

-- Users can view processes in their company
CREATE POLICY "processes_select" ON processes
  FOR SELECT USING (
    company_id = public.get_my_company_id()
    OR public.is_super_admin()
    OR public.is_reseller_for_uuid(company_id)
  );

-- Users can insert processes for their company
CREATE POLICY "processes_insert" ON processes
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());

-- Users can update processes in their company
CREATE POLICY "processes_update" ON processes
  FOR UPDATE USING (company_id = public.get_my_company_id());

-- Users can delete processes in their company
CREATE POLICY "processes_delete" ON processes
  FOR DELETE USING (company_id = public.get_my_company_id());

-- =============================
-- 4. UPDATED_AT TRIGGER
-- =============================
CREATE OR REPLACE FUNCTION update_processes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_processes_updated_at
  BEFORE UPDATE ON processes
  FOR EACH ROW
  EXECUTE FUNCTION update_processes_updated_at();
