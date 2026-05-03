-- ============================================================================
-- Dev environment super_admin bootstrap
-- Run in DEV Supabase project (kesmzjuegmgdxiruhfdz) → SQL Editor
-- ============================================================================
-- Prerequisites:
--   1. Auth user already created via Dashboard → Auth → Users → Add user
--   2. You have that user's UUID ready
-- ============================================================================

-- STEP A: Create ISOGuardian HQ company (idempotent via ON CONFLICT)
insert into public.companies (
  id, name, company_code, industry, tier, status,
  doc_counter, ncr_counter, audit_counter, review_counter,
  created_at, updated_at
)
values (
  gen_random_uuid(),
  'ISOGuardian HQ (Dev)',
  'HQ',
  'Software',
  'enterprise',
  'active',
  0, 0, 0, 0,
  now(), now()
)
on conflict (company_code) do nothing
returning id, name, company_code;

-- Copy the returned company `id` for step B below.
-- If nothing returned (company already existed), run:
--   select id, name, company_code from public.companies where company_code = 'HQ';

-- ============================================================================
-- STEP B: Link the auth user to the company as super_admin
-- REPLACE the two UUIDs below before running.
-- ============================================================================

-- >>> REPLACE THESE TWO VALUES <<<
--   :auth_user_id  = the UUID from Dashboard → Auth → Users
--   :company_id    = the HQ company id from step A

insert into public.users (
  id, email, full_name, role, company_id, status,
  created_at, updated_at
)
values (
  '<PASTE_AUTH_USER_UUID_HERE>'::uuid,
  'support@isoguardian.co.za',   -- match what you used in Dashboard
  'Tyreece Kruger (Dev)',
  'super_admin',
  '<PASTE_COMPANY_UUID_HERE>'::uuid,
  'active',
  now(), now()
)
on conflict (id) do update set
  role = 'super_admin',
  company_id = excluded.company_id,
  status = 'active',
  updated_at = now();

-- Verify
select id, email, role, company_id, status from public.users where email = 'support@isoguardian.co.za';
