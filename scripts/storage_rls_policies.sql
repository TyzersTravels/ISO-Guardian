-- ============================================================================
-- Storage RLS Policies for `documents` bucket
-- ============================================================================
-- Path conventions used by the app:
--   Documents: {company_id}/{filename}              (Documents.jsx uploads)
--   Logos:     logos/{company_id}/logo.{ext}        (CompanySettings.jsx)
--
-- Run in Supabase SQL Editor. Safe to re-run — drops policies first.
-- ============================================================================

-- Make sure the bucket exists (idempotent).
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Drop existing policies so we start clean.
drop policy if exists "documents_select_own_company" on storage.objects;
drop policy if exists "documents_insert_own_company" on storage.objects;
drop policy if exists "documents_update_own_company" on storage.objects;
drop policy if exists "documents_delete_own_company" on storage.objects;
drop policy if exists "documents_super_admin_all" on storage.objects;

-- Helper: a path "belongs to" the caller's company if:
--   (a) first folder == company_id       (document uploads)
--   (b) first folder == 'logos' AND second folder == company_id  (logo uploads)
-- We use get_my_company_id_text() because documents.company_id is TEXT.

-- SELECT — anyone authenticated in the company can read. Bucket is public for
-- PDF-export hotlinking, so SELECT is permissive; INSERT/UPDATE/DELETE are not.
create policy "documents_select_own_company"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = public.get_my_company_id_text()
    or (
      (storage.foldername(name))[1] = 'logos'
      and (storage.foldername(name))[2] = public.get_my_company_id_text()
    )
    or public.is_super_admin()
  )
);

-- INSERT — only into your own company's prefix.
create policy "documents_insert_own_company"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = public.get_my_company_id_text()
    or (
      (storage.foldername(name))[1] = 'logos'
      and (storage.foldername(name))[2] = public.get_my_company_id_text()
    )
    or public.is_super_admin()
  )
);

-- UPDATE — same scope (upsert logo overwrites).
create policy "documents_update_own_company"
on storage.objects for update
to authenticated
using (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = public.get_my_company_id_text()
    or (
      (storage.foldername(name))[1] = 'logos'
      and (storage.foldername(name))[2] = public.get_my_company_id_text()
    )
    or public.is_super_admin()
  )
)
with check (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = public.get_my_company_id_text()
    or (
      (storage.foldername(name))[1] = 'logos'
      and (storage.foldername(name))[2] = public.get_my_company_id_text()
    )
    or public.is_super_admin()
  )
);

-- DELETE — same scope (remove old logo, delete documents).
create policy "documents_delete_own_company"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = public.get_my_company_id_text()
    or (
      (storage.foldername(name))[1] = 'logos'
      and (storage.foldername(name))[2] = public.get_my_company_id_text()
    )
    or public.is_super_admin()
  )
);

-- Verify
select policyname, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'documents_%'
order by policyname;
