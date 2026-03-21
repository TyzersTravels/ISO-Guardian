-- ISOGuardian — Key Personnel Registry Migration
-- Adds key personnel fields to companies table for template auto-population
-- Run this in Supabase SQL Editor

-- Step 1: Add key personnel JSONB column to companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS key_personnel JSONB DEFAULT '{}'::jsonb;

-- Step 2: Add products/services description for QMS templates
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS products_services TEXT DEFAULT '';

-- Step 3: Add scope statement for QMS manual
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS qms_scope TEXT DEFAULT '';

-- Step 4: Add quality policy text
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS quality_policy TEXT DEFAULT '';

-- Step 5: Comment the structure for clarity
COMMENT ON COLUMN public.companies.key_personnel IS 'Key personnel for ISO documentation. Structure: { "managing_director": { "name": "", "title": "" }, "management_rep": { "name": "", "title": "" }, "quality_manager": { "name": "", "title": "" }, "document_controller": { "name": "", "title": "" }, "internal_audit_lead": { "name": "", "title": "" }, "safety_officer": { "name": "", "title": "" }, "environmental_officer": { "name": "", "title": "" }, "hr_manager": { "name": "", "title": "" } }';

COMMENT ON COLUMN public.companies.products_services IS 'Description of core products/services for QMS documentation';
COMMENT ON COLUMN public.companies.qms_scope IS 'QMS scope statement for ISO documentation';
COMMENT ON COLUMN public.companies.quality_policy IS 'Company quality policy statement for ISO documentation';

-- Verify columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'companies'
  AND column_name IN ('key_personnel', 'products_services', 'qms_scope', 'quality_policy');
