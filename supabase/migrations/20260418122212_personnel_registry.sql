-- Personnel registry + QMS template columns on companies
-- Unblocks CompanySettings.jsx fetchCompany query (was 400ing)

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS key_personnel JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS products_services TEXT DEFAULT '';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS qms_scope TEXT DEFAULT '';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS quality_policy TEXT DEFAULT '';

COMMENT ON COLUMN public.companies.key_personnel IS 'Key personnel for ISO documentation (JSONB).';
COMMENT ON COLUMN public.companies.products_services IS 'Description of core products/services for QMS documentation.';
COMMENT ON COLUMN public.companies.qms_scope IS 'QMS scope statement for ISO documentation.';
COMMENT ON COLUMN public.companies.quality_policy IS 'Company quality policy statement for ISO documentation.';
