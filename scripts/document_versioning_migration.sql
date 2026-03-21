-- ISOGuardian — Document Versioning Migration
-- Adds version and version_history columns to documents table
-- Run this in Supabase SQL Editor

-- Step 1: Add version column (default '1.0' for new documents)
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0';

-- Step 2: Add version_history column (JSONB array of previous versions)
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS version_history JSONB DEFAULT '[]'::jsonb;

-- Step 3: Add uploaded_by column if not exists (tracks who uploaded current version)
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- Step 4: Add file_size column if not exists
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Step 5: Add date_updated column if not exists
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS date_updated DATE;

-- Step 6: Set version to '1.0' for all existing documents that have NULL version
UPDATE public.documents
SET version = '1.0'
WHERE version IS NULL;

-- Step 7: Set version_history to empty array for existing documents
UPDATE public.documents
SET version_history = '[]'::jsonb
WHERE version_history IS NULL;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'documents'
  AND column_name IN ('version', 'version_history', 'uploaded_by', 'file_size', 'date_updated')
ORDER BY column_name;
