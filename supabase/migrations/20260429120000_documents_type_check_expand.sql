-- ============================================================================
-- ISOGuardian — Expand documents.type CHECK constraint
--
-- The original constraint allowed: Policy, Procedure, Form, Manual, Record.
-- The retention policy backfill (20260424120000_document_retention_policy.sql)
-- references three additional types that the UI now exposes:
--   - Work Instruction (standard_3y)
--   - Register         (standard_3y / standard_5y depending on clause)
--   - Certificate      (indefinite)
--
-- Without this migration, uploads of those types fail with Postgres error 23514
-- "violates check constraint documents_type_check".
--
-- Idempotent — safe to re-run.
-- Zero downtime — only widens the allowed set.
-- ============================================================================

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_type_check;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_type_check
  CHECK (type IN (
    'Policy',
    'Procedure',
    'Work Instruction',
    'Form',
    'Manual',
    'Record',
    'Register',
    'Certificate'
  ));

-- Verify
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conname = 'documents_type_check';
