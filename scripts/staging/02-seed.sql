-- Staging persona seed — idempotent-ish (DELETE first, then INSERT).
-- Passwords: all personas use "TestPass!2026" for convenience.
-- Applied via Supabase Management API /database/query (superuser-ish role).

BEGIN;

-- ── 1. Clean up any prior seed rows ──
DELETE FROM auth.users WHERE email LIKE '%-test.example';
DELETE FROM public.companies WHERE company_code IN ('MF','APEX','DCC','ALPHA','BETA','GAMMA','CHURN');

-- ── 2. Companies ──
WITH ids AS (
  SELECT
    'a0000001-0000-4000-a000-000000000001'::uuid AS mf,
    'a0000001-0000-4000-a000-000000000002'::uuid AS apex,
    'a0000001-0000-4000-a000-000000000003'::uuid AS dcc,
    'a0000001-0000-4000-a000-000000000004'::uuid AS alpha,
    'a0000001-0000-4000-a000-000000000005'::uuid AS beta,
    'a0000001-0000-4000-a000-000000000006'::uuid AS gamma,
    'a0000001-0000-4000-a000-000000000007'::uuid AS churn
)
INSERT INTO public.companies (id, name, company_code, industry, tier, status, standards_enabled, doc_counter, ncr_counter, audit_counter, review_counter)
SELECT mf,    'Mokoena Fabrication (Pty) Ltd',   'MF',    'Manufacturing', 'basic',        'active', ARRAY['iso_9001'], 0, 0, 0, 0 FROM ids UNION ALL
SELECT apex,  'Apex Logistics Solutions',        'APEX',  'Logistics',     'professional', 'active', ARRAY['iso_9001','iso_14001','iso_45001'], 0, 0, 0, 0 FROM ids UNION ALL
SELECT dcc,   'Dlamini Compliance Consulting CC','DCC',   'Consulting',    'reseller',     'active', ARRAY['iso_9001','iso_14001','iso_45001'], 0, 0, 0, 0 FROM ids UNION ALL
SELECT alpha, 'Client Alpha (Pty) Ltd',          'ALPHA', 'Manufacturing', 'basic',        'active', ARRAY['iso_9001'], 0, 0, 0, 0 FROM ids UNION ALL
SELECT beta,  'Client Beta (Pty) Ltd',           'BETA',  'Construction',  'basic',        'active', ARRAY['iso_45001'], 0, 0, 0, 0 FROM ids UNION ALL
SELECT gamma, 'Client Gamma (Pty) Ltd',          'GAMMA', 'Chemicals',     'basic',        'active', ARRAY['iso_14001'], 0, 0, 0, 0 FROM ids UNION ALL
SELECT churn, 'Churn Test Co (Pty) Ltd',         'CHURN', 'Services',      'basic',        'active', ARRAY['iso_9001'], 0, 0, 0, 0 FROM ids;

-- ── 3. Auth users with bcrypt password ──
WITH uids AS (
  SELECT
    'b0000002-0000-4000-b000-000000000001'::uuid AS thabo,
    'b0000002-0000-4000-b000-000000000002'::uuid AS priya,
    'b0000002-0000-4000-b000-000000000003'::uuid AS sipho,
    'b0000002-0000-4000-b000-000000000004'::uuid AS karen,
    extensions.crypt('TestPass!2026', extensions.gen_salt('bf')) AS pw
)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT '00000000-0000-0000-0000-000000000000'::uuid, thabo, 'authenticated','authenticated','thabo@mokoena-test.example', pw, now(), '{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb, now(), now(),'','','','' FROM uids UNION ALL
SELECT '00000000-0000-0000-0000-000000000000'::uuid, priya, 'authenticated','authenticated','priya@apex-test.example',    pw, now(), '{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb, now(), now(),'','','','' FROM uids UNION ALL
SELECT '00000000-0000-0000-0000-000000000000'::uuid, sipho, 'authenticated','authenticated','sipho@dcc-test.example',     pw, now(), '{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb, now(), now(),'','','','' FROM uids UNION ALL
SELECT '00000000-0000-0000-0000-000000000000'::uuid, karen, 'authenticated','authenticated','karen@churn-test.example',   pw, now(), '{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb, now(), now(),'','','','' FROM uids;

-- auth.identities so password login works (provider_id must match the user id as text)
INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), u.id::text, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email', now(), now(), now()
FROM auth.users u
WHERE u.email LIKE '%-test.example';

-- ── 4. Public users linked to companies ──
INSERT INTO public.users (id, company_id, email, full_name, role, is_active, standards_access)
VALUES
  ('b0000002-0000-4000-b000-000000000001','a0000001-0000-4000-a000-000000000001','thabo@mokoena-test.example','Thabo Mokoena','admin', true, '["iso_9001"]'::jsonb),
  ('b0000002-0000-4000-b000-000000000002','a0000001-0000-4000-a000-000000000002','priya@apex-test.example','Priya Naicker','admin', true, '["iso_9001","iso_14001","iso_45001"]'::jsonb),
  ('b0000002-0000-4000-b000-000000000003','a0000001-0000-4000-a000-000000000003','sipho@dcc-test.example','Sipho Dlamini','admin', true, '["iso_9001","iso_14001","iso_45001"]'::jsonb),
  ('b0000002-0000-4000-b000-000000000004','a0000001-0000-4000-a000-000000000007','karen@churn-test.example','Karen van der Merwe','admin', true, '["iso_9001"]'::jsonb);

-- ── 5. Subscriptions ──
INSERT INTO public.subscriptions (id, company_id, plan, status, users_count, price_per_user, billing_cycle, current_period_start, current_period_end, currency)
VALUES
  (gen_random_uuid(),'a0000001-0000-4000-a000-000000000001','starter',    'active',  5, 400, 'monthly', now() - interval '10 days', now() + interval '20 days', 'ZAR'),
  (gen_random_uuid(),'a0000001-0000-4000-a000-000000000002','growth',     'active', 15, 247, 'monthly', now() - interval '40 days', now() - interval '10 days', 'ZAR'),
  (gen_random_uuid(),'a0000001-0000-4000-a000-000000000003','enterprise', 'active', 25, 340, 'monthly', now() - interval '15 days', now() + interval '15 days', 'ZAR'),
  (gen_random_uuid(),'a0000001-0000-4000-a000-000000000007','starter',    'active',  3, 667, 'monthly', now() - interval '200 days', now() - interval '170 days', 'ZAR');

-- ── 6. Reseller (DCC) + 3 linked clients ──
INSERT INTO public.resellers (id, company_id, reseller_name, contact_email, commission_rate, status, agreement_date)
VALUES ('c0000003-0000-4000-c000-000000000001', 'a0000001-0000-4000-a000-000000000003', 'Dlamini Compliance Consulting CC', 'sipho@dcc-test.example', 0.25, 'active', now() - interval '30 days');

INSERT INTO public.reseller_clients (id, reseller_id, client_company_id, client_name, client_email, subscription_tier, mrr, onboarded_date, status)
VALUES
  (gen_random_uuid(),'c0000003-0000-4000-c000-000000000001','a0000001-0000-4000-a000-000000000004','Client Alpha (Pty) Ltd','admin@alpha-test.example','starter',2000, now() - interval '60 days','active'),
  (gen_random_uuid(),'c0000003-0000-4000-c000-000000000001','a0000001-0000-4000-a000-000000000005','Client Beta (Pty) Ltd', 'admin@beta-test.example', 'starter',2000, now() - interval '45 days','active'),
  (gen_random_uuid(),'c0000003-0000-4000-c000-000000000001','a0000001-0000-4000-a000-000000000006','Client Gamma (Pty) Ltd','admin@gamma-test.example','starter',2000, now() - interval '20 days','active');

-- ── 7. Audits + auditor session tokens (for Persona 5) ──
INSERT INTO public.audits (id, company_id, audit_number, audit_type, standard, audit_date, status, scope)
VALUES
  ('d0000004-0000-4000-d000-000000000001','a0000001-0000-4000-a000-000000000002','IG-APEX-AUD-001','External','iso_9001',  now() + interval '3 days','Planned','Stage 2 Surveillance — full QMS'),
  ('d0000004-0000-4000-d000-000000000002','a0000001-0000-4000-a000-000000000007','IG-CHURN-AUD-001','External','iso_9001', now() + interval '3 days','Planned','Pre-cancellation audit');

-- Token belongs to Priya's company (APEX). Separate "foreign" token belongs to Karen's co for cross-tenant test.
INSERT INTO public.audit_sessions (id, audit_id, company_id, access_token, auditor_name, auditor_email, auditor_organisation, status, expires_at, created_at, created_by)
VALUES
  (gen_random_uuid(), 'd0000004-0000-4000-d000-000000000001', 'a0000001-0000-4000-a000-000000000002','AUDIT-VALID-APEX-TOKEN-2026', 'Nomsa Khumalo', 'nomsa@saas-auditor.example', 'SAAS Auditors',  'active', now() + interval '7 days', now(), 'b0000002-0000-4000-b000-000000000002'),
  (gen_random_uuid(), 'd0000004-0000-4000-d000-000000000002', 'a0000001-0000-4000-a000-000000000007','AUDIT-FOREIGN-CHURN-TOKEN-2026','Nomsa Khumalo','nomsa@saas-auditor.example','SAAS Auditors',  'active', now() + interval '7 days', now(), 'b0000002-0000-4000-b000-000000000004');

COMMIT;

-- Diagnostic output
SELECT 'companies' AS tbl, COUNT(*) FROM public.companies WHERE company_code IN ('MF','APEX','DCC','ALPHA','BETA','GAMMA','CHURN')
UNION ALL SELECT 'auth.users',      COUNT(*) FROM auth.users WHERE email LIKE '%-test.example'
UNION ALL SELECT 'public.users',    COUNT(*) FROM public.users WHERE email LIKE '%-test.example'
UNION ALL SELECT 'subscriptions',   COUNT(*) FROM public.subscriptions WHERE company_id::text LIKE 'a0000001-%'
UNION ALL SELECT 'resellers',       COUNT(*) FROM public.resellers WHERE company_id::text LIKE 'a0000001-%'
UNION ALL SELECT 'reseller_clients',COUNT(*) FROM public.reseller_clients WHERE reseller_id::text LIKE 'a0000001-%'
UNION ALL SELECT 'audit_sessions',  COUNT(*) FROM public.audit_sessions WHERE access_token LIKE 'AUDIT-%-2026';
