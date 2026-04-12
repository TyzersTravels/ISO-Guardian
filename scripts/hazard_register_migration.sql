-- IMS Clause 6.1.2 (ISO 45001): Hazard Identification & Risk Assessment (HIRA)

CREATE TABLE IF NOT EXISTS hazards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  location_area text NOT NULL,
  activity text NOT NULL,
  hazard text NOT NULL,
  potential_harm text NOT NULL,
  who_at_risk text,
  hazard_category text NOT NULL CHECK (hazard_category IN (
    'physical', 'chemical', 'biological', 'ergonomic',
    'psychosocial', 'electrical', 'mechanical', 'fire',
    'environmental', 'vehicular', 'working_at_height',
    'confined_space', 'other'
  )),
  routine boolean DEFAULT true,
  pre_likelihood integer NOT NULL DEFAULT 1 CHECK (pre_likelihood BETWEEN 1 AND 5),
  pre_severity integer NOT NULL DEFAULT 1 CHECK (pre_severity BETWEEN 1 AND 5),
  pre_risk_rating integer GENERATED ALWAYS AS (pre_likelihood * pre_severity) STORED,
  control_elimination text,
  control_substitution text,
  control_engineering text,
  control_administrative text,
  control_ppe text,
  post_likelihood integer DEFAULT 1 CHECK (post_likelihood BETWEEN 1 AND 5),
  post_severity integer DEFAULT 1 CHECK (post_severity BETWEEN 1 AND 5),
  post_risk_rating integer GENERATED ALWAYS AS (post_likelihood * post_severity) STORED,
  responsible_person text,
  target_date date,
  standards text[] NOT NULL DEFAULT '{ISO_45001}',
  clause_references text[] DEFAULT '{6.1.2}',
  linked_legal_id uuid,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Under Review', 'Eliminated', 'Archived')),
  last_reviewed date,
  next_review_date date,
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hazards_company ON hazards(company_id);
CREATE INDEX IF NOT EXISTS idx_hazards_category ON hazards(hazard_category);
CREATE INDEX IF NOT EXISTS idx_hazards_status ON hazards(status);

ALTER TABLE hazards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hazards_select" ON hazards
  FOR SELECT USING (company_id = public.get_my_company_id() OR public.is_super_admin() OR public.is_reseller_for_uuid(company_id));
CREATE POLICY "hazards_insert" ON hazards
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
CREATE POLICY "hazards_update" ON hazards
  FOR UPDATE USING (company_id = public.get_my_company_id());
CREATE POLICY "hazards_delete" ON hazards
  FOR DELETE USING (company_id = public.get_my_company_id());

CREATE OR REPLACE FUNCTION update_hazards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hazards_updated
  BEFORE UPDATE ON hazards FOR EACH ROW
  EXECUTE FUNCTION update_hazards_updated_at();
