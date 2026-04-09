-- ============================================================
-- IMS Clause 4 (Context) + Clause 7 (Support)
-- Covers: 4.2 Interested Parties, 7.2 Competence, 7.4 Communication
-- Run in Supabase SQL Editor
-- ============================================================

-- =============================
-- 1. TRAINING & COMPETENCY MATRIX (Clause 7.2)
-- =============================
CREATE TABLE IF NOT EXISTS training_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Who
  user_id uuid REFERENCES users(id),
  employee_name text NOT NULL,
  job_title text,
  department text,

  -- What
  training_title text NOT NULL,
  training_type text NOT NULL CHECK (training_type IN (
    'induction', 'on_the_job', 'formal_course', 'certification',
    'awareness', 'drill', 'refresher', 'external', 'other'
  )),
  provider text, -- training provider / institution
  competency_area text, -- e.g. 'First Aid', 'Internal Auditing', 'Waste Management'

  -- IMS mapping
  standards text[] NOT NULL DEFAULT '{}',
  clause_reference text, -- e.g. '7.2'

  -- ISO 45001-specific
  is_safety_critical boolean DEFAULT false,
  legal_requirement boolean DEFAULT false, -- legally mandated training

  -- Dates
  date_completed date,
  expiry_date date,
  next_refresher_date date,

  -- Evidence
  certificate_url text, -- Supabase storage path
  certificate_number text,

  -- Assessment
  competency_status text NOT NULL DEFAULT 'Not Assessed' CHECK (competency_status IN (
    'Not Assessed', 'Competent', 'Not Yet Competent', 'Expired', 'In Progress'
  )),
  assessment_method text, -- observation, test, portfolio, interview
  assessment_score numeric,
  assessor text,

  -- Notes
  notes text,

  -- Metadata
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_company ON training_records(company_id);
CREATE INDEX IF NOT EXISTS idx_training_user ON training_records(user_id);
CREATE INDEX IF NOT EXISTS idx_training_expiry ON training_records(company_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_training_standards ON training_records USING GIN(standards);

ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company training"
  ON training_records FOR SELECT
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "Users can insert own company training"
  ON training_records FOR INSERT
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "Users can update own company training"
  ON training_records FOR UPDATE
  USING (company_id = get_my_company_id())
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "Users can delete own company training"
  ON training_records FOR DELETE
  USING (company_id = get_my_company_id());

-- =============================
-- 2. INTERESTED PARTIES REGISTER (Clause 4.2)
-- =============================
CREATE TABLE IF NOT EXISTS interested_parties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Party details
  party_name text NOT NULL,
  party_type text NOT NULL CHECK (party_type IN (
    'customer', 'supplier', 'employee', 'regulator', 'shareholder',
    'community', 'contractor', 'union', 'insurance', 'neighbour', 'other'
  )),
  description text,
  contact_info text,

  -- ISO requirements
  needs_expectations text NOT NULL, -- what they need/expect from us
  relevance text, -- why they are relevant to the IMS
  obligations text, -- compliance obligations arising

  -- IMS mapping
  standards text[] NOT NULL DEFAULT '{}',
  clause_reference text DEFAULT '4.2',

  -- Assessment
  influence_level text CHECK (influence_level IN ('low', 'medium', 'high', 'critical')),
  engagement_strategy text, -- how we engage with this party

  -- Review
  last_reviewed date,
  review_notes text,

  -- Metadata
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ip_company ON interested_parties(company_id);
CREATE INDEX IF NOT EXISTS idx_ip_standards ON interested_parties USING GIN(standards);

ALTER TABLE interested_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company interested parties"
  ON interested_parties FOR SELECT
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "Users can insert own company interested parties"
  ON interested_parties FOR INSERT
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "Users can update own company interested parties"
  ON interested_parties FOR UPDATE
  USING (company_id = get_my_company_id())
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "Users can delete own company interested parties"
  ON interested_parties FOR DELETE
  USING (company_id = get_my_company_id());

-- =============================
-- 3. COMMUNICATION REGISTER (Clause 7.4)
-- =============================
CREATE TABLE IF NOT EXISTS communications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- What, when, who, how
  subject text NOT NULL,
  communication_type text NOT NULL CHECK (communication_type IN (
    'internal', 'external_incoming', 'external_outgoing'
  )),
  description text,

  -- ISO 7.4 requirements: what, when, with whom, how, who
  what_communicated text NOT NULL, -- the message/topic
  when_communicated date,
  with_whom text NOT NULL, -- recipient/audience
  how_communicated text, -- method: email, meeting, notice board, report, etc.
  who_communicates text, -- responsible person/role

  -- IMS mapping
  standards text[] NOT NULL DEFAULT '{}',
  clause_reference text DEFAULT '7.4',

  -- Frequency for recurring communications
  frequency text CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly', 'quarterly', 'annually', 'as_needed')),
  is_recurring boolean DEFAULT false,

  -- Environmental / OH&S specific
  is_legal_communication boolean DEFAULT false, -- regulatory reporting
  regulatory_body text, -- e.g. DFFE, DoL, municipality

  -- Status
  status text NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'Completed', 'Overdue', 'Cancelled')),

  -- Evidence
  evidence_url text,
  notes text,

  -- Metadata
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comms_company ON communications(company_id);
CREATE INDEX IF NOT EXISTS idx_comms_standards ON communications USING GIN(standards);
CREATE INDEX IF NOT EXISTS idx_comms_status ON communications(company_id, status);

ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company communications"
  ON communications FOR SELECT
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "Users can insert own company communications"
  ON communications FOR INSERT
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "Users can update own company communications"
  ON communications FOR UPDATE
  USING (company_id = get_my_company_id())
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "Users can delete own company communications"
  ON communications FOR DELETE
  USING (company_id = get_my_company_id());

-- =============================
-- 4. Add counters to companies table
-- =============================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS training_counter integer DEFAULT 0;

-- =============================
-- 5. Updated_at triggers
-- =============================
CREATE TRIGGER set_training_updated_at
  BEFORE UPDATE ON training_records
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_ip_updated_at
  BEFORE UPDATE ON interested_parties
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_comms_updated_at
  BEFORE UPDATE ON communications
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- DONE: Run in Supabase SQL Editor
-- ============================================================
