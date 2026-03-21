-- Fix: Allow anonymous users to insert into landing page tables
-- These tables receive submissions from the public landing page (no auth required)
-- RLS was enabled but INSERT policies were missing, causing all form submissions to silently fail

-- ISO Readiness Assessments — anyone can submit
CREATE POLICY "Anyone can submit assessments"
  ON iso_readiness_assessments FOR INSERT
  WITH CHECK (true);

-- Allow anon to read (for dedup/confirmation if needed)
CREATE POLICY "Anyone can view assessments"
  ON iso_readiness_assessments FOR SELECT
  USING (true);

-- Consultation Requests — anyone can submit
CREATE POLICY "Anyone can submit consultation requests"
  ON consultation_requests FOR INSERT
  WITH CHECK (true);

-- Allow anon to read
CREATE POLICY "Anyone can view consultation requests"
  ON consultation_requests FOR SELECT
  USING (true);
