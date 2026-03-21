-- ISOGuardian — Atomic Document Numbering Migration
-- Replaces race-prone client-side numbering with atomic PostgreSQL functions
-- Run this in Supabase SQL Editor

-- Step 1: Add counter columns to companies table (if not already present)
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS doc_counter INTEGER DEFAULT 0;

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS ncr_counter INTEGER DEFAULT 0;

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS audit_counter INTEGER DEFAULT 0;

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS review_counter INTEGER DEFAULT 0;

-- Step 2: Seed counters from existing data (so numbers don't restart)
-- NCR counter: find highest existing number per company
UPDATE public.companies c
SET ncr_counter = COALESCE(sub.max_num, 0)
FROM (
  SELECT company_id, MAX(
    CASE
      WHEN ncr_number ~ 'NCR-\d{4}-(\d+)'
      THEN (regexp_match(ncr_number, 'NCR-\d{4}-(\d+)'))[1]::integer
      ELSE 0
    END
  ) as max_num
  FROM public.ncrs
  GROUP BY company_id
) sub
WHERE c.id = sub.company_id::uuid;

-- Audit counter: find highest existing number per company
UPDATE public.companies c
SET audit_counter = COALESCE(sub.max_num, 0)
FROM (
  SELECT company_id, MAX(
    CASE
      WHEN audit_number ~ 'AUD-\d{4}-(\d+)'
      THEN (regexp_match(audit_number, 'AUD-\d{4}-(\d+)'))[1]::integer
      ELSE 0
    END
  ) as max_num
  FROM public.audits
  GROUP BY company_id
) sub
WHERE c.id = sub.company_id::uuid;

-- Step 3: Create atomic next-number function for NCRs
CREATE OR REPLACE FUNCTION public.next_ncr_number(p_company_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_counter INTEGER;
  v_year TEXT;
BEGIN
  -- Atomically increment and return the new counter value
  UPDATE public.companies
  SET ncr_counter = ncr_counter + 1
  WHERE id = p_company_id
  RETURNING ncr_counter INTO v_counter;

  IF v_counter IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', p_company_id;
  END IF;

  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  RETURN 'NCR-' || v_year || '-' || LPAD(v_counter::TEXT, 3, '0');
END;
$$;

-- Step 4: Create atomic next-number function for Audits
CREATE OR REPLACE FUNCTION public.next_audit_number(p_company_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_counter INTEGER;
  v_year TEXT;
BEGIN
  UPDATE public.companies
  SET audit_counter = audit_counter + 1
  WHERE id = p_company_id
  RETURNING audit_counter INTO v_counter;

  IF v_counter IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', p_company_id;
  END IF;

  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  RETURN 'AUD-' || v_year || '-' || LPAD(v_counter::TEXT, 3, '0');
END;
$$;

-- Step 5: Create atomic next-number function for Documents
CREATE OR REPLACE FUNCTION public.next_doc_number(p_company_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_counter INTEGER;
  v_code TEXT;
BEGIN
  UPDATE public.companies
  SET doc_counter = doc_counter + 1
  WHERE id = p_company_id
  RETURNING doc_counter INTO v_counter;

  IF v_counter IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', p_company_id;
  END IF;

  SELECT company_code INTO v_code FROM public.companies WHERE id = p_company_id;
  v_code := COALESCE(v_code, 'XX');

  RETURN 'IG-' || v_code || '-DOC-' || LPAD(v_counter::TEXT, 3, '0');
END;
$$;

-- Step 6: Create atomic next-number function for Management Reviews
CREATE OR REPLACE FUNCTION public.next_review_number(p_company_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_counter INTEGER;
  v_code TEXT;
BEGIN
  UPDATE public.companies
  SET review_counter = review_counter + 1
  WHERE id = p_company_id
  RETURNING review_counter INTO v_counter;

  IF v_counter IS NULL THEN
    RAISE EXCEPTION 'Company not found: %', p_company_id;
  END IF;

  SELECT company_code INTO v_code FROM public.companies WHERE id = p_company_id;
  v_code := COALESCE(v_code, 'XX');

  RETURN 'IG-' || v_code || '-MR-' || LPAD(v_counter::TEXT, 3, '0');
END;
$$;

-- Step 7: Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.next_ncr_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_audit_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_doc_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_review_number(UUID) TO authenticated;

-- Verify functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('next_ncr_number', 'next_audit_number', 'next_doc_number', 'next_review_number');
