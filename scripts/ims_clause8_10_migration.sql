-- ============================================================
-- IMS Clause 8 (Operation) + Clause 9.1.2 + Clause 10.3
-- Covers: 8.4 Supplier Register, 9.1.2 Customer Satisfaction, 10.3 Continual Improvement
-- Run in Supabase SQL Editor
-- ============================================================

-- =============================
-- 1. SUPPLIER REGISTER (Clause 8.4)
-- =============================
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Supplier details
  supplier_name text NOT NULL,
  supplier_code text, -- internal ref
  contact_person text,
  email text,
  phone text,
  address text,
  website text,

  -- Classification
  supplier_type text NOT NULL CHECK (supplier_type IN (
    'product', 'service', 'contractor', 'consultant', 'outsourced_process', 'other'
  )),
  products_services text, -- what they supply
  is_critical boolean DEFAULT false, -- critical supplier flag

  -- IMS mapping
  standards text[] NOT NULL DEFAULT '{}',
  clause_reference text DEFAULT '8.4',

  -- ISO 14001 — environmental
  environmental_criteria text, -- environmental requirements placed on supplier
  environmental_risk text CHECK (environmental_risk IN ('low', 'medium', 'high')),

  -- ISO 45001 — OH&S
  ohs_requirements text, -- OH&S requirements for contractors/suppliers
  ohs_risk text CHECK (ohs_risk IN ('low', 'medium', 'high')),

  -- Evaluation
  approval_status text NOT NULL DEFAULT 'Pending' CHECK (approval_status IN (
    'Pending', 'Approved', 'Conditional', 'Suspended', 'Rejected'
  )),
  approval_date date,
  approved_by uuid REFERENCES users(id),
  evaluation_score numeric, -- 0-100
  evaluation_method text, -- questionnaire, site audit, performance, references
  evaluation_criteria text, -- what was assessed

  -- Re-evaluation
  last_evaluated date,
  next_evaluation_date date,
  evaluation_frequency text CHECK (evaluation_frequency IN ('quarterly', 'biannually', 'annually', 'biennial')),
  evaluation_notes text,

  -- Documents
  bbeee_level text, -- South African B-BBEE level
  bbeee_certificate_url text,
  iso_certified boolean DEFAULT false,
  iso_certificate_details text,

  -- Status
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Blacklisted')),
  blacklist_reason text,

  -- Metadata
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(company_id, status);
CREATE INDEX IF NOT EXISTS idx_suppliers_standards ON suppliers USING GIN(standards);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company suppliers" ON suppliers FOR SELECT
  USING (company_id = get_my_company_id() OR is_super_admin());
CREATE POLICY "Users can insert own company suppliers" ON suppliers FOR INSERT
  WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "Users can update own company suppliers" ON suppliers FOR UPDATE
  USING (company_id = get_my_company_id()) WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "Users can delete own company suppliers" ON suppliers FOR DELETE
  USING (company_id = get_my_company_id());

-- =============================
-- 2. CUSTOMER SATISFACTION (Clause 9.1.2)
-- =============================
CREATE TABLE IF NOT EXISTS customer_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Feedback details
  feedback_type text NOT NULL CHECK (feedback_type IN (
    'complaint', 'compliment', 'suggestion', 'survey', 'return', 'warranty_claim', 'other'
  )),
  customer_name text NOT NULL,
  customer_contact text,
  source text, -- email, phone, form, social media, meeting
  reference_number text, -- external ref

  -- Content
  subject text NOT NULL,
  description text NOT NULL,
  product_service text, -- which product/service affected
  date_received date NOT NULL,

  -- Resolution (for complaints)
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  assigned_to uuid REFERENCES users(id),
  root_cause text,
  corrective_action text,
  date_resolved date,
  resolution_notes text,
  linked_ncr_id uuid, -- can link to NCR

  -- Satisfaction scoring
  satisfaction_score integer CHECK (satisfaction_score BETWEEN 1 AND 10),
  nps_score integer CHECK (nps_score BETWEEN 0 AND 10),

  -- Status
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),

  -- IMS mapping
  standards text[] NOT NULL DEFAULT '{}',
  clause_reference text DEFAULT '9.1.2',

  -- Metadata
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_company ON customer_feedback(company_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON customer_feedback(company_id, status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON customer_feedback(company_id, feedback_type);

ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company feedback" ON customer_feedback FOR SELECT
  USING (company_id = get_my_company_id() OR is_super_admin());
CREATE POLICY "Users can insert own company feedback" ON customer_feedback FOR INSERT
  WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "Users can update own company feedback" ON customer_feedback FOR UPDATE
  USING (company_id = get_my_company_id()) WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "Users can delete own company feedback" ON customer_feedback FOR DELETE
  USING (company_id = get_my_company_id());

-- =============================
-- 3. CONTINUAL IMPROVEMENT REGISTER (Clause 10.3)
-- =============================
CREATE TABLE IF NOT EXISTS improvements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Improvement details
  improvement_number text,
  title text NOT NULL,
  description text NOT NULL,
  improvement_type text NOT NULL CHECK (improvement_type IN (
    'process_improvement', 'corrective_action', 'preventive_action',
    'innovation', 'cost_reduction', 'efficiency', 'safety_improvement',
    'environmental_improvement', 'customer_driven', 'other'
  )),

  -- Source
  source text, -- audit, management review, ncr, suggestion, customer feedback, risk
  source_reference text, -- linked entity ID

  -- IMS mapping
  standards text[] NOT NULL DEFAULT '{}',
  clause_reference text DEFAULT '10.3',

  -- Planning
  expected_benefit text,
  resources_required text,
  responsible_person uuid REFERENCES users(id),
  target_date date,
  priority text CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Implementation
  actions_taken text,
  date_implemented date,
  actual_benefit text, -- measured outcome

  -- Effectiveness
  effectiveness_review text,
  effectiveness_verified boolean DEFAULT false,
  verified_by uuid REFERENCES users(id),
  verified_date date,

  -- Status
  status text NOT NULL DEFAULT 'Identified' CHECK (status IN (
    'Identified', 'Planned', 'In Progress', 'Implemented', 'Verified', 'Closed', 'Rejected'
  )),

  -- Metadata
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_improvements_company ON improvements(company_id);
CREATE INDEX IF NOT EXISTS idx_improvements_status ON improvements(company_id, status);
CREATE INDEX IF NOT EXISTS idx_improvements_standards ON improvements USING GIN(standards);

ALTER TABLE improvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company improvements" ON improvements FOR SELECT
  USING (company_id = get_my_company_id() OR is_super_admin());
CREATE POLICY "Users can insert own company improvements" ON improvements FOR INSERT
  WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "Users can update own company improvements" ON improvements FOR UPDATE
  USING (company_id = get_my_company_id()) WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "Users can delete own company improvements" ON improvements FOR DELETE
  USING (company_id = get_my_company_id());

-- =============================
-- 4. Counters + triggers
-- =============================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS improvement_counter integer DEFAULT 0;

CREATE TRIGGER set_suppliers_updated_at
  BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER set_feedback_updated_at
  BEFORE UPDATE ON customer_feedback FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER set_improvements_updated_at
  BEFORE UPDATE ON improvements FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- DONE: Run in Supabase SQL Editor
-- ============================================================
