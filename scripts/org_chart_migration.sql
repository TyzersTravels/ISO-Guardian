-- IMS Clause 5.3: Organisational Roles, Responsibilities & Authorities
CREATE TABLE IF NOT EXISTS org_positions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  position_title text NOT NULL,
  department text,
  holder_name text,
  holder_email text,
  user_id uuid REFERENCES users(id),
  reports_to uuid REFERENCES org_positions(id) ON DELETE SET NULL,
  position_level integer NOT NULL DEFAULT 0,
  responsibilities text,
  authorities text,
  sheq_role text,
  is_sheq_critical boolean DEFAULT false,
  standards text[] NOT NULL DEFAULT '{}',
  clause_references text[] DEFAULT '{5.3}',
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Vacant', 'Acting')),
  effective_date date,
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_positions_company ON org_positions(company_id);
CREATE INDEX IF NOT EXISTS idx_org_positions_reports_to ON org_positions(reports_to);

ALTER TABLE org_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_positions_select" ON org_positions
  FOR SELECT USING (company_id = public.get_my_company_id() OR public.is_super_admin() OR public.is_reseller_for_uuid(company_id));
CREATE POLICY "org_positions_insert" ON org_positions
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
CREATE POLICY "org_positions_update" ON org_positions
  FOR UPDATE USING (company_id = public.get_my_company_id());
CREATE POLICY "org_positions_delete" ON org_positions
  FOR DELETE USING (company_id = public.get_my_company_id());

CREATE TRIGGER trg_org_positions_updated
  BEFORE UPDATE ON org_positions FOR EACH ROW
  EXECUTE FUNCTION update_processes_updated_at();
