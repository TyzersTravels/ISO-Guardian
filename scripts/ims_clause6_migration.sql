-- ============================================================
-- IMS Clause 6: Planning — Risk Register + Quality Objectives
-- Covers: ISO 9001 §6.1-6.2, ISO 14001 §6.1-6.2, ISO 45001 §6.1-6.2
-- Run in Supabase SQL Editor
-- ============================================================

-- =============================
-- 1. RISK & OPPORTUNITIES REGISTER
-- =============================
CREATE TABLE IF NOT EXISTS risks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Identification
  risk_number text NOT NULL,
  title text NOT NULL,
  description text,
  risk_type text NOT NULL CHECK (risk_type IN ('risk', 'opportunity')),
  category text NOT NULL CHECK (category IN (
    'strategic', 'operational', 'compliance', 'financial',
    'environmental', 'health_safety', 'quality', 'reputational', 'other'
  )),
  source text, -- where was this identified (audit, review, incident, etc.)

  -- IMS Standard Mapping
  standards text[] NOT NULL DEFAULT '{}', -- e.g. {'ISO_9001', 'ISO_14001'}
  clause_reference text, -- e.g. '6.1.1', '6.1.2'

  -- ISO 14001-specific: Environmental aspects
  environmental_aspect text, -- the activity/product/service
  environmental_impact text, -- the environmental change
  aspect_condition text CHECK (aspect_condition IN ('normal', 'abnormal', 'emergency')),

  -- ISO 45001-specific: Hazard identification
  hazard_type text, -- physical, chemical, biological, ergonomic, psychosocial
  hazard_source text, -- what causes the hazard
  who_affected text, -- workers, visitors, contractors, public

  -- Risk Assessment (5x5 matrix)
  likelihood integer CHECK (likelihood BETWEEN 1 AND 5),
  severity integer CHECK (severity BETWEEN 1 AND 5),
  risk_rating integer GENERATED ALWAYS AS (likelihood * severity) STORED,
  residual_likelihood integer CHECK (residual_likelihood BETWEEN 1 AND 5),
  residual_severity integer CHECK (residual_severity BETWEEN 1 AND 5),
  residual_risk_rating integer GENERATED ALWAYS AS (
    CASE WHEN residual_likelihood IS NOT NULL AND residual_severity IS NOT NULL
    THEN residual_likelihood * residual_severity ELSE NULL END
  ) STORED,

  -- Treatment
  treatment_plan text,
  treatment_type text CHECK (treatment_type IN ('avoid', 'mitigate', 'transfer', 'accept', 'exploit', 'enhance', 'share')),
  controls text, -- existing controls in place
  responsible_person uuid REFERENCES users(id),
  due_date date,

  -- Status & Review
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Treatment', 'Monitoring', 'Closed', 'Accepted')),
  last_reviewed date,
  next_review_date date,
  review_notes text,

  -- Metadata
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_risks_company ON risks(company_id);
CREATE INDEX IF NOT EXISTS idx_risks_standards ON risks USING GIN(standards);
CREATE INDEX IF NOT EXISTS idx_risks_status ON risks(company_id, status);
CREATE INDEX IF NOT EXISTS idx_risks_rating ON risks(company_id, risk_rating DESC);

-- RLS
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company risks"
  ON risks FOR SELECT
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "Users can insert own company risks"
  ON risks FOR INSERT
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "Users can update own company risks"
  ON risks FOR UPDATE
  USING (company_id = get_my_company_id())
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "Users can delete own company risks"
  ON risks FOR DELETE
  USING (company_id = get_my_company_id());

-- =============================
-- 2. QUALITY OBJECTIVES TRACKER
-- =============================
CREATE TABLE IF NOT EXISTS quality_objectives (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Identification
  objective_number text NOT NULL,
  title text NOT NULL,
  description text,

  -- IMS Standard Mapping
  standards text[] NOT NULL DEFAULT '{}',
  clause_reference text, -- e.g. '6.2.1'

  -- ISO Requirements: "consistent with policy", "measurable", "monitored", "communicated", "updated"
  relevant_policy text, -- which policy this aligns to
  kpi_name text NOT NULL, -- what we measure
  kpi_unit text, -- %, count, days, score, etc.
  baseline_value numeric, -- starting point
  target_value numeric NOT NULL, -- what we're aiming for
  current_value numeric, -- latest measurement

  -- Planning: "what will be done, what resources, who responsible, when completed, how evaluated"
  action_plan text,
  resources_required text,
  responsible_person uuid REFERENCES users(id),
  target_date date,
  evaluation_method text, -- how we measure progress

  -- Status
  status text NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'On Track', 'At Risk', 'Achieved', 'Not Achieved', 'Cancelled')),
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  last_reviewed date,
  review_frequency text DEFAULT 'quarterly' CHECK (review_frequency IN ('monthly', 'quarterly', 'biannually', 'annually')),

  -- Metadata
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_objectives_company ON quality_objectives(company_id);
CREATE INDEX IF NOT EXISTS idx_objectives_standards ON quality_objectives USING GIN(standards);
CREATE INDEX IF NOT EXISTS idx_objectives_status ON quality_objectives(company_id, status);

-- RLS
ALTER TABLE quality_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company objectives"
  ON quality_objectives FOR SELECT
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "Users can insert own company objectives"
  ON quality_objectives FOR INSERT
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "Users can update own company objectives"
  ON quality_objectives FOR UPDATE
  USING (company_id = get_my_company_id())
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "Users can delete own company objectives"
  ON quality_objectives FOR DELETE
  USING (company_id = get_my_company_id());

-- =============================
-- 3. OBJECTIVE PROGRESS LOG
-- =============================
CREATE TABLE IF NOT EXISTS objective_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  objective_id uuid NOT NULL REFERENCES quality_objectives(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  recorded_value numeric NOT NULL,
  notes text,
  recorded_by uuid REFERENCES users(id),
  recorded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obj_progress_objective ON objective_progress(objective_id);

ALTER TABLE objective_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company progress"
  ON objective_progress FOR SELECT
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "Users can insert own company progress"
  ON objective_progress FOR INSERT
  WITH CHECK (company_id = get_my_company_id());

-- =============================
-- 4. Add counters to companies table
-- =============================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS risk_counter integer DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS objective_counter integer DEFAULT 0;

-- =============================
-- 5. Updated_at trigger
-- =============================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_risks_updated_at
  BEFORE UPDATE ON risks
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_objectives_updated_at
  BEFORE UPDATE ON quality_objectives
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- DONE: Run this in Supabase SQL Editor, then proceed to frontend
-- ============================================================
