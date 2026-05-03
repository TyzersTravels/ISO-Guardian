-- ============================================================================
-- ISOGuardian — Document Retention Policy
-- ISO 9001 §7.5.3, ISO 14001 §7.5.3, ISO 45001 §7.5.3, SA OHS Act s24, POPIA s14
--
-- Adds retention_policy + retention_until + archived_at to documents.
-- Adds trigger that auto-computes retention_until when a document is archived.
-- Adds two indexes: retention_until (partial) + (company_id, archived) composite.
--
-- Idempotent — safe to re-run.
-- Zero downtime — all operations are additive and non-blocking.
-- ============================================================================

-- 1. Columns
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS retention_policy TEXT DEFAULT 'standard_3y',
  ADD COLUMN IF NOT EXISTS retention_until  DATE,
  ADD COLUMN IF NOT EXISTS archived_at      TIMESTAMPTZ;

-- 2. Enum constraint
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_retention_policy_check;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_retention_policy_check
  CHECK (retention_policy IN (
    'standard_3y', 'standard_5y', 'standard_7y',
    'ohs_incident', 'employment_plus_5y', 'medical_40y',
    'indefinite', 'no_retention'
  ));

-- 3. Backfill existing rows with sensible defaults
UPDATE public.documents SET retention_policy = CASE
  WHEN type = 'Manual'                                             THEN 'standard_5y'
  WHEN type = 'Policy'                                             THEN 'standard_5y'
  WHEN type = 'Procedure'                                          THEN 'standard_3y'
  WHEN type = 'Work Instruction'                                   THEN 'standard_3y'
  WHEN type = 'Form'                                               THEN 'no_retention'
  WHEN type = 'Certificate'                                        THEN 'indefinite'
  WHEN type = 'Record' AND clause = 7  AND standard LIKE '%9001%'  THEN 'employment_plus_5y'
  WHEN type = 'Record' AND clause = 9                              THEN 'standard_5y'
  WHEN type = 'Record' AND clause = 10                             THEN 'standard_3y'
  WHEN type = 'Record' AND clause = 6  AND standard LIKE '%45001%' THEN 'ohs_incident'
  WHEN type = 'Register' AND clause = 6 AND standard LIKE '%14001%' THEN 'standard_5y'
  ELSE 'standard_3y'
END
WHERE retention_policy IS NULL OR retention_policy = 'standard_3y';

-- 4. Trigger: auto-compute retention_until on archive
CREATE OR REPLACE FUNCTION public.set_retention_until()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.archived = true AND (OLD.archived IS DISTINCT FROM true) THEN
    NEW.archived_at := COALESCE(NEW.archived_at, now());
    NEW.retention_until := CASE NEW.retention_policy
      WHEN 'standard_3y'        THEN (NEW.archived_at::date + interval '3 years')::date
      WHEN 'standard_5y'        THEN (NEW.archived_at::date + interval '5 years')::date
      WHEN 'standard_7y'        THEN (NEW.archived_at::date + interval '7 years')::date
      WHEN 'ohs_incident'       THEN (NEW.archived_at::date + interval '7 years')::date
      WHEN 'employment_plus_5y' THEN NULL
      WHEN 'medical_40y'        THEN (NEW.archived_at::date + interval '40 years')::date
      WHEN 'indefinite'         THEN NULL
      WHEN 'no_retention'       THEN NEW.archived_at::date
      ELSE (NEW.archived_at::date + interval '3 years')::date
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documents_retention ON public.documents;
CREATE TRIGGER trg_documents_retention
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_retention_until();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_documents_retention_until
  ON public.documents (retention_until)
  WHERE retention_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_archived_company
  ON public.documents (company_id, archived);

-- 6. Verify
SELECT retention_policy, COUNT(*) AS doc_count
FROM public.documents
GROUP BY retention_policy
ORDER BY retention_policy;
