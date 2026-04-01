-- Fix SECURITY DEFINER views flagged by Supabase Security Advisor
-- Recreate with SECURITY INVOKER so RLS policies are enforced.
--
-- Run this in: Supabase Dashboard → SQL Editor
-- Date: 2026-04-01

-- ─── 1. v_mrr_by_client ───
DROP VIEW IF EXISTS public.v_mrr_by_client;

CREATE VIEW public.v_mrr_by_client
WITH (security_invoker = true)
AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  c.company_code,
  s.status AS subscription_status,
  s.created_at AS subscription_start
FROM companies c
INNER JOIN subscriptions s ON s.company_id::text = c.id::text;

-- ─── 2. v_client_engagement ───
DROP VIEW IF EXISTS public.v_client_engagement;

CREATE VIEW public.v_client_engagement
WITH (security_invoker = true)
AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  c.company_code,
  (SELECT COUNT(*) FROM users u WHERE u.company_id::text = c.id::text) AS user_count,
  (SELECT COUNT(*) FROM documents d WHERE d.company_id::text = c.id::text) AS document_count,
  (SELECT COUNT(*) FROM ncrs n WHERE n.company_id::text = c.id::text) AS ncr_count,
  (SELECT COUNT(*) FROM audits a WHERE a.company_id::text = c.id::text) AS audit_count,
  (SELECT MAX(al.created_at) FROM audit_log al WHERE al.company_id::text = c.id::text) AS last_activity
FROM companies c;

-- ─── 3. v_outstanding_invoices ───
DROP VIEW IF EXISTS public.v_outstanding_invoices;

CREATE VIEW public.v_outstanding_invoices
WITH (security_invoker = true)
AS
SELECT
  i.id,
  i.invoice_number,
  i.company_id,
  c.name AS company_name,
  i.amount,
  i.vat,
  i.total,
  i.currency,
  i.status,
  i.invoice_date,
  i.due_date,
  i.paid_date
FROM invoices i
LEFT JOIN companies c ON c.id::text = i.company_id::text
WHERE i.status IN ('pending', 'overdue');

-- Grant SELECT to authenticated users (RLS will enforce company-level access)
GRANT SELECT ON public.v_mrr_by_client TO authenticated;
GRANT SELECT ON public.v_client_engagement TO authenticated;
GRANT SELECT ON public.v_outstanding_invoices TO authenticated;
