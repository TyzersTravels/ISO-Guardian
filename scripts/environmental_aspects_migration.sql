-- IMS Clause 6.1.2 (ISO 14001): Environmental Aspects & Impacts

CREATE TABLE IF NOT EXISTS environmental_aspects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  activity text NOT NULL,
  aspect text NOT NULL,
  impact text NOT NULL,
  condition text NOT NULL CHECK (condition IN ('normal', 'abnormal', 'emergency')),
  temporal text NOT NULL DEFAULT 'current' CHECK (temporal IN ('past', 'current', 'planned')),
  aspect_type text NOT NULL DEFAULT 'direct' CHECK (aspect_type IN ('direct', 'indirect')),
  impact_category text NOT NULL CHECK (impact_category IN (
    'air_emissions', 'water_discharge', 'land_contamination',
    'waste_generation', 'resource_consumption', 'energy_use',
    'noise_vibration', 'biodiversity', 'visual_impact', 'other'
  )),
  impact_direction text NOT NULL DEFAULT 'negative' CHECK (impact_direction IN ('positive', 'negative')),
  severity integer NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  probability integer NOT NULL DEFAULT 1 CHECK (probability BETWEEN 1 AND 5),
  frequency integer NOT NULL DEFAULT 1 CHECK (frequency BETWEEN 1 AND 5),
  legal_factor boolean DEFAULT false,
  stakeholder_concern boolean DEFAULT false,
  significance_score integer GENERATED ALWAYS AS (severity * probability + CASE WHEN legal_factor THEN 5 ELSE 0 END + CASE WHEN stakeholder_concern THEN 3 ELSE 0 END) STORED,
  is_significant boolean DEFAULT false,
  current_controls text,
  planned_controls text,
  responsible_person text,
  target_date date,
  standards text[] NOT NULL DEFAULT '{ISO_14001}',
  clause_references text[] DEFAULT '{6.1.2}',
  linked_legal_id uuid,
  linked_process_id uuid,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Under Review', 'Eliminated', 'Archived')),
  last_reviewed date,
  next_review_date date,
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_env_aspects_company ON environmental_aspects(company_id);
CREATE INDEX IF NOT EXISTS idx_env_aspects_significant ON environmental_aspects(is_significant);
CREATE INDEX IF NOT EXISTS idx_env_aspects_category ON environmental_aspects(impact_category);

ALTER TABLE environmental_aspects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "env_aspects_select" ON environmental_aspects
  FOR SELECT USING (company_id = public.get_my_company_id() OR public.is_super_admin() OR public.is_reseller_for_uuid(company_id));
CREATE POLICY "env_aspects_insert" ON environmental_aspects
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
CREATE POLICY "env_aspects_update" ON environmental_aspects
  FOR UPDATE USING (company_id = public.get_my_company_id());
CREATE POLICY "env_aspects_delete" ON environmental_aspects
  FOR DELETE USING (company_id = public.get_my_company_id());

CREATE OR REPLACE FUNCTION update_environmental_aspects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_env_aspects_updated
  BEFORE UPDATE ON environmental_aspects FOR EACH ROW
  EXECUTE FUNCTION update_environmental_aspects_updated_at();
