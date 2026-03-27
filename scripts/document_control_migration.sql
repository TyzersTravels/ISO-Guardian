-- ===== ISOGuardian Document Control System Migration =====
-- Run in Supabase SQL Editor
-- Non-destructive: all ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS

-- ─── Phase A: Enhance documents table with document control columns ───

-- A1: Ensure versioning columns exist (from document_versioning_migration.sql)
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS version_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS date_updated DATE;

-- A2: Document control columns
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS review_frequency_months INTEGER DEFAULT 12;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS last_reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS next_review_date DATE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES public.documents(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS supersedes UUID REFERENCES public.documents(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS requires_acknowledgement BOOLEAN DEFAULT false;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS change_summary TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS source_type TEXT;        -- 'upload' or 'template'
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS source_id UUID;          -- template_instances.id if from template

-- A3: Backfill defaults
UPDATE public.documents SET version = '1.0' WHERE version IS NULL;
UPDATE public.documents SET version_history = '[]'::jsonb WHERE version_history IS NULL;
UPDATE public.documents SET review_frequency_months = 12 WHERE review_frequency_months IS NULL;

-- A4: Indexes
CREATE INDEX IF NOT EXISTS idx_documents_next_review_date ON public.documents(next_review_date) WHERE next_review_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON public.documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_company_status ON public.documents(company_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_source ON public.documents(source_type, source_id) WHERE source_type IS NOT NULL;

-- ─── Phase B: document_versions table (proper version history) ───

CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,
  version_number TEXT NOT NULL,
  file_path TEXT,
  file_size BIGINT,
  change_summary TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(document_id, version_number)
);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies (idempotent: drop if exists then create)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view versions for their company" ON public.document_versions;
  CREATE POLICY "Users can view versions for their company"
    ON public.document_versions FOR SELECT
    USING (company_id = get_my_company_id_text());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can insert versions for their company" ON public.document_versions;
  CREATE POLICY "Users can insert versions for their company"
    ON public.document_versions FOR INSERT
    WITH CHECK (company_id = get_my_company_id_text());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Super admins can view all versions" ON public.document_versions;
  CREATE POLICY "Super admins can view all versions"
    ON public.document_versions FOR SELECT
    USING (is_super_admin());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_company_id ON public.document_versions(company_id);

-- ─── Phase C: document_acknowledgements table ───

CREATE TABLE IF NOT EXISTS public.document_acknowledgements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  version_acknowledged TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(document_id, user_id, version_acknowledged)
);

ALTER TABLE public.document_acknowledgements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view acknowledgements for their company" ON public.document_acknowledgements;
  CREATE POLICY "Users can view acknowledgements for their company"
    ON public.document_acknowledgements FOR SELECT
    USING (company_id = get_my_company_id_text());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can acknowledge documents in their company" ON public.document_acknowledgements;
  CREATE POLICY "Users can acknowledge documents in their company"
    ON public.document_acknowledgements FOR INSERT
    WITH CHECK (company_id = get_my_company_id_text() AND user_id = auth.uid());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Super admins can view all acknowledgements" ON public.document_acknowledgements;
  CREATE POLICY "Super admins can view all acknowledgements"
    ON public.document_acknowledgements FOR SELECT
    USING (is_super_admin());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_doc_ack_document_id ON public.document_acknowledgements(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_ack_user_id ON public.document_acknowledgements(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_ack_company_id ON public.document_acknowledgements(company_id);

-- ─── Phase D: Verify ───

SELECT 'document_versions' AS table_name, count(*) AS rows FROM public.document_versions
UNION ALL
SELECT 'document_acknowledgements', count(*) FROM public.document_acknowledgements;
