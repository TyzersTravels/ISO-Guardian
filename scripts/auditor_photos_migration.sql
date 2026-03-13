-- Add evidence_photos column to audit_findings
-- Run this in Supabase SQL Editor

ALTER TABLE audit_findings
ADD COLUMN IF NOT EXISTS evidence_photos TEXT[] DEFAULT '{}';

-- Allow public uploads to the audit-evidence folder in documents bucket
-- (External auditors don't have Supabase accounts, so we need a permissive policy)
INSERT INTO storage.policies (name, bucket_id, definition, check_expression)
SELECT
  'Auditor evidence uploads',
  'documents',
  'true',
  'bucket_id = ''documents'' AND name LIKE ''audit-evidence/%'''
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies WHERE name = 'Auditor evidence uploads'
);
