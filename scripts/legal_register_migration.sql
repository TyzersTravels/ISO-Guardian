-- IMS Clause 6.1.3: Compliance Obligations (Legal Register)

CREATE TABLE IF NOT EXISTS legal_requirements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  legislation_title text NOT NULL,
  legislation_number text,
  section_reference text,
  issuing_authority text,
  requirement_type text NOT NULL CHECK (requirement_type IN (
    'act', 'regulation', 'bylaw', 'standard', 'code_of_practice',
    'permit', 'licence', 'contract', 'industry_agreement', 'other'
  )),
  jurisdiction text DEFAULT 'South Africa',
  applicable_to text,
  applicability_reason text,
  standards text[] NOT NULL DEFAULT '{}',
  clause_references text[] DEFAULT '{6.1.3}',
  category text NOT NULL CHECK (category IN (
    'environmental', 'health_safety', 'quality', 'labour',
    'fire_safety', 'hazardous_substances', 'waste_management',
    'water', 'air_quality', 'noise', 'general', 'other'
  )),
  compliance_status text NOT NULL DEFAULT 'Compliant' CHECK (compliance_status IN (
    'Compliant', 'Partially Compliant', 'Non-Compliant', 'Not Assessed', 'Not Applicable'
  )),
  compliance_evidence text,
  last_compliance_evaluation date,
  next_evaluation_date date,
  evaluated_by text,
  permit_number text,
  issue_date date,
  expiry_date date,
  renewal_reminder_days integer DEFAULT 60,
  last_amended date,
  amendment_notes text,
  responsible_person text,
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_requirements_company ON legal_requirements(company_id);
CREATE INDEX IF NOT EXISTS idx_legal_requirements_category ON legal_requirements(category);
CREATE INDEX IF NOT EXISTS idx_legal_requirements_status ON legal_requirements(compliance_status);
CREATE INDEX IF NOT EXISTS idx_legal_requirements_expiry ON legal_requirements(expiry_date);

ALTER TABLE legal_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "legal_requirements_select" ON legal_requirements
  FOR SELECT USING (company_id = public.get_my_company_id() OR public.is_super_admin() OR public.is_reseller_for_uuid(company_id));
CREATE POLICY "legal_requirements_insert" ON legal_requirements
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
CREATE POLICY "legal_requirements_update" ON legal_requirements
  FOR UPDATE USING (company_id = public.get_my_company_id());
CREATE POLICY "legal_requirements_delete" ON legal_requirements
  FOR DELETE USING (company_id = public.get_my_company_id());

CREATE OR REPLACE FUNCTION update_legal_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_legal_requirements_updated
  BEFORE UPDATE ON legal_requirements FOR EACH ROW
  EXECUTE FUNCTION update_legal_requirements_updated_at();
