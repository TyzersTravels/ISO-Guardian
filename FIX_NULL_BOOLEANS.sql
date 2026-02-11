-- ============================================================
-- ISOGuardian: Fix NULL Boolean Fields
-- 
-- WHAT THIS FIXES:
--   Your RLS policies check for archived=false or deleted=false,
--   but existing rows have NULL in these columns (not false).
--   NULL != false in SQL, so rows get filtered out silently.
--
-- RUN THIS: Supabase Dashboard → SQL Editor → Paste → Run
-- ============================================================

-- STEP 1: Fix NULL booleans in ncrs table
UPDATE ncrs SET archived = false WHERE archived IS NULL;
UPDATE ncrs SET permanently_deleted = false WHERE permanently_deleted IS NULL;

-- STEP 2: Fix NULL booleans in documents table  
UPDATE documents SET archived = false WHERE archived IS NULL;
UPDATE documents SET deleted = false WHERE deleted IS NULL;

-- STEP 3: Fix NULL booleans in audits table
UPDATE audits SET archived = false WHERE archived IS NULL;

-- STEP 4: Fix NULL booleans in management_reviews table
UPDATE management_reviews SET archived = false WHERE archived IS NULL;

-- STEP 5: Set DEFAULT values so future rows are always false (not NULL)
ALTER TABLE ncrs ALTER COLUMN archived SET DEFAULT false;
ALTER TABLE ncrs ALTER COLUMN permanently_deleted SET DEFAULT false;
ALTER TABLE documents ALTER COLUMN archived SET DEFAULT false;
ALTER TABLE documents ALTER COLUMN deleted SET DEFAULT false;
ALTER TABLE audits ALTER COLUMN archived SET DEFAULT false;
ALTER TABLE management_reviews ALTER COLUMN archived SET DEFAULT false;

-- STEP 6: Verify the fix worked
SELECT 'ncrs' as table_name, count(*) as total, 
       count(*) filter (where archived IS NULL) as null_archived
FROM ncrs
UNION ALL
SELECT 'documents', count(*), count(*) filter (where archived IS NULL)
FROM documents
UNION ALL
SELECT 'audits', count(*), count(*) filter (where archived IS NULL)
FROM audits
UNION ALL
SELECT 'management_reviews', count(*), count(*) filter (where archived IS NULL)
FROM management_reviews;

-- Expected result: null_archived should be 0 for all tables
-- If any column doesn't exist yet, that UPDATE will fail harmlessly
-- Just skip it and move on
