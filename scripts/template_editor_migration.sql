-- ============================================================================
-- ISOGuardian — Template Editor Migration
-- In-app template editing with autosave, approval workflow, version history
-- ============================================================================

-- 1. Template instances — user-editable copies of templates
CREATE TABLE IF NOT EXISTS template_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  template_id text NOT NULL,                          -- references TEMPLATES array key (e.g. 'qms-manual')
  title text NOT NULL,
  doc_number text,                                     -- IG-SH-QMS-001 format

  -- Content: TipTap JSON per section
  -- Structure: { "sections": [ { "heading": "...", "content": {...tiptap json...}, "completed": bool } ] }
  content jsonb NOT NULL DEFAULT '{"sections": []}',

  -- Metadata
  standard text,                                       -- ISO_9001 / ISO_14001 / ISO_45001
  revision text DEFAULT '01',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'archived', 'superseded')),

  -- Completion tracking
  completion_percent int DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
  total_sections int DEFAULT 0,
  completed_sections int DEFAULT 0,

  -- Approval workflow
  prepared_by uuid REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  prepared_at timestamptz,
  reviewed_at timestamptz,
  approved_at timestamptz,
  review_comments text,
  approval_comments text,

  -- Version tracking
  version int DEFAULT 1,
  parent_instance_id uuid REFERENCES template_instances(id),   -- previous version

  -- Audit fields
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_autosave_at timestamptz
);

-- 2. Section-level edit history (lightweight change log)
CREATE TABLE IF NOT EXISTS template_instance_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES template_instances(id) ON DELETE CASCADE,
  section_index int NOT NULL,
  previous_content jsonb,
  new_content jsonb,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  changed_at timestamptz DEFAULT now(),
  change_type text DEFAULT 'edit' CHECK (change_type IN ('edit', 'approve', 'reject', 'revert'))
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_template_instances_company ON template_instances(company_id);
CREATE INDEX IF NOT EXISTS idx_template_instances_status ON template_instances(status);
CREATE INDEX IF NOT EXISTS idx_template_instances_template ON template_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_template_instances_created_by ON template_instances(created_by);
CREATE INDEX IF NOT EXISTS idx_template_instance_history_instance ON template_instance_history(instance_id);

-- 4. RLS policies
ALTER TABLE template_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_instance_history ENABLE ROW LEVEL SECURITY;

-- Users can see their own company's template instances
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'template_instances_company_read') THEN
    CREATE POLICY template_instances_company_read ON template_instances
      FOR SELECT USING (
        company_id = public.get_my_company_id()
        OR public.is_super_admin()
        OR public.is_reseller_for_uuid(company_id)
      );
  END IF;
END $$;

-- Users can insert for their own company
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'template_instances_company_insert') THEN
    CREATE POLICY template_instances_company_insert ON template_instances
      FOR INSERT WITH CHECK (
        company_id = public.get_my_company_id()
        OR public.is_super_admin()
      );
  END IF;
END $$;

-- Users can update their own company's instances
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'template_instances_company_update') THEN
    CREATE POLICY template_instances_company_update ON template_instances
      FOR UPDATE USING (
        company_id = public.get_my_company_id()
        OR public.is_super_admin()
      );
  END IF;
END $$;

-- Users can delete drafts for their own company
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'template_instances_company_delete') THEN
    CREATE POLICY template_instances_company_delete ON template_instances
      FOR DELETE USING (
        (company_id = public.get_my_company_id() AND status = 'draft')
        OR public.is_super_admin()
      );
  END IF;
END $$;

-- History: read access for company members
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'template_instance_history_read') THEN
    CREATE POLICY template_instance_history_read ON template_instance_history
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM template_instances ti
          WHERE ti.id = template_instance_history.instance_id
          AND (ti.company_id = public.get_my_company_id() OR public.is_super_admin())
        )
      );
  END IF;
END $$;

-- History: insert for company members
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'template_instance_history_insert') THEN
    CREATE POLICY template_instance_history_insert ON template_instance_history
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM template_instances ti
          WHERE ti.id = template_instance_history.instance_id
          AND (ti.company_id = public.get_my_company_id() OR public.is_super_admin())
        )
      );
  END IF;
END $$;

-- 5. Updated_at trigger
CREATE OR REPLACE FUNCTION update_template_instance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS template_instances_updated_at ON template_instances;
CREATE TRIGGER template_instances_updated_at
  BEFORE UPDATE ON template_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_template_instance_timestamp();
