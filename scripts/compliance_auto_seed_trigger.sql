-- ===== Auto-seed compliance requirements on company creation =====
-- Trigger: when a new company is inserted, populate compliance_requirements
-- with clauses 4-10 for ISO 9001, 14001, and 45001.
--
-- Run this in: Supabase Dashboard → SQL Editor
-- Date: 2026-04-01

-- ─── 1. Create the seeding function ───
CREATE OR REPLACE FUNCTION public.seed_compliance_requirements()
RETURNS TRIGGER AS $$
BEGIN
  -- ISO 9001:2015
  INSERT INTO public.compliance_requirements (company_id, standard, clause_number, clause_name, requirement_text, compliance_status) VALUES
    (NEW.id, 'ISO_9001', 4, 'Context of the Organization', 'Determine external and internal issues, interested parties, and scope of the QMS.', 'Not Met'),
    (NEW.id, 'ISO_9001', 5, 'Leadership', 'Top management shall demonstrate leadership and commitment to the QMS.', 'Not Met'),
    (NEW.id, 'ISO_9001', 6, 'Planning', 'Plan actions to address risks and opportunities, quality objectives, and changes.', 'Not Met'),
    (NEW.id, 'ISO_9001', 7, 'Support', 'Determine and provide resources, competence, awareness, communication, and documented information.', 'Not Met'),
    (NEW.id, 'ISO_9001', 8, 'Operation', 'Plan and control operational processes, requirements, design, external provision, production, and release.', 'Not Met'),
    (NEW.id, 'ISO_9001', 9, 'Performance Evaluation', 'Monitor, measure, analyse, evaluate, conduct internal audits and management reviews.', 'Not Met'),
    (NEW.id, 'ISO_9001', 10, 'Improvement', 'Determine opportunities for improvement, address nonconformities, and continually improve.', 'Not Met');

  -- ISO 14001:2015
  INSERT INTO public.compliance_requirements (company_id, standard, clause_number, clause_name, requirement_text, compliance_status) VALUES
    (NEW.id, 'ISO_14001', 4, 'Context of the Organization', 'Determine external and internal issues, interested parties, and scope of the EMS.', 'Not Met'),
    (NEW.id, 'ISO_14001', 5, 'Leadership', 'Top management shall demonstrate leadership and commitment to the EMS.', 'Not Met'),
    (NEW.id, 'ISO_14001', 6, 'Planning', 'Plan actions to address environmental aspects, compliance obligations, risks and opportunities.', 'Not Met'),
    (NEW.id, 'ISO_14001', 7, 'Support', 'Determine and provide resources, competence, awareness, communication, and documented information.', 'Not Met'),
    (NEW.id, 'ISO_14001', 8, 'Operation', 'Establish operational controls, emergency preparedness and response procedures.', 'Not Met'),
    (NEW.id, 'ISO_14001', 9, 'Performance Evaluation', 'Monitor, measure, analyse, evaluate environmental performance, conduct audits and reviews.', 'Not Met'),
    (NEW.id, 'ISO_14001', 10, 'Improvement', 'Determine opportunities for improvement, address nonconformities, and continually improve.', 'Not Met');

  -- ISO 45001:2018
  INSERT INTO public.compliance_requirements (company_id, standard, clause_number, clause_name, requirement_text, compliance_status) VALUES
    (NEW.id, 'ISO_45001', 4, 'Context of the Organization', 'Determine external and internal issues, interested parties, and scope of the OH&S MS.', 'Not Met'),
    (NEW.id, 'ISO_45001', 5, 'Leadership and Worker Participation', 'Top management shall demonstrate leadership and ensure worker consultation and participation.', 'Not Met'),
    (NEW.id, 'ISO_45001', 6, 'Planning', 'Plan actions to address hazards, OH&S risks, legal requirements, and objectives.', 'Not Met'),
    (NEW.id, 'ISO_45001', 7, 'Support', 'Determine and provide resources, competence, awareness, communication, and documented information.', 'Not Met'),
    (NEW.id, 'ISO_45001', 8, 'Operation', 'Establish operational controls, eliminate hazards, manage change, procurement, and emergency preparedness.', 'Not Met'),
    (NEW.id, 'ISO_45001', 9, 'Performance Evaluation', 'Monitor, measure, analyse, evaluate OH&S performance, conduct audits and reviews.', 'Not Met'),
    (NEW.id, 'ISO_45001', 10, 'Improvement', 'Determine opportunities for improvement, investigate incidents, address nonconformities.', 'Not Met');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 2. Create the trigger ───
DROP TRIGGER IF EXISTS trg_seed_compliance ON public.companies;

CREATE TRIGGER trg_seed_compliance
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_compliance_requirements();

-- ─── 3. Backfill existing companies that have no compliance requirements ───
INSERT INTO public.compliance_requirements (company_id, standard, clause_number, clause_name, requirement_text, compliance_status)
SELECT c.id, s.standard, s.clause_number, s.clause_name, s.requirement_text, 'Not Met'
FROM public.companies c
CROSS JOIN (VALUES
  ('ISO_9001', 4, 'Context of the Organization', 'Determine external and internal issues, interested parties, and scope of the QMS.'),
  ('ISO_9001', 5, 'Leadership', 'Top management shall demonstrate leadership and commitment to the QMS.'),
  ('ISO_9001', 6, 'Planning', 'Plan actions to address risks and opportunities, quality objectives, and changes.'),
  ('ISO_9001', 7, 'Support', 'Determine and provide resources, competence, awareness, communication, and documented information.'),
  ('ISO_9001', 8, 'Operation', 'Plan and control operational processes, requirements, design, external provision, production, and release.'),
  ('ISO_9001', 9, 'Performance Evaluation', 'Monitor, measure, analyse, evaluate, conduct internal audits and management reviews.'),
  ('ISO_9001', 10, 'Improvement', 'Determine opportunities for improvement, address nonconformities, and continually improve.'),
  ('ISO_14001', 4, 'Context of the Organization', 'Determine external and internal issues, interested parties, and scope of the EMS.'),
  ('ISO_14001', 5, 'Leadership', 'Top management shall demonstrate leadership and commitment to the EMS.'),
  ('ISO_14001', 6, 'Planning', 'Plan actions to address environmental aspects, compliance obligations, risks and opportunities.'),
  ('ISO_14001', 7, 'Support', 'Determine and provide resources, competence, awareness, communication, and documented information.'),
  ('ISO_14001', 8, 'Operation', 'Establish operational controls, emergency preparedness and response procedures.'),
  ('ISO_14001', 9, 'Performance Evaluation', 'Monitor, measure, analyse, evaluate environmental performance, conduct audits and reviews.'),
  ('ISO_14001', 10, 'Improvement', 'Determine opportunities for improvement, address nonconformities, and continually improve.'),
  ('ISO_45001', 4, 'Context of the Organization', 'Determine external and internal issues, interested parties, and scope of the OH&S MS.'),
  ('ISO_45001', 5, 'Leadership and Worker Participation', 'Top management shall demonstrate leadership and ensure worker consultation and participation.'),
  ('ISO_45001', 6, 'Planning', 'Plan actions to address hazards, OH&S risks, legal requirements, and objectives.'),
  ('ISO_45001', 7, 'Support', 'Determine and provide resources, competence, awareness, communication, and documented information.'),
  ('ISO_45001', 8, 'Operation', 'Establish operational controls, eliminate hazards, manage change, procurement, and emergency preparedness.'),
  ('ISO_45001', 9, 'Performance Evaluation', 'Monitor, measure, analyse, evaluate OH&S performance, conduct audits and reviews.'),
  ('ISO_45001', 10, 'Improvement', 'Determine opportunities for improvement, investigate incidents, address nonconformities.')
) AS s(standard, clause_number, clause_name, requirement_text)
WHERE NOT EXISTS (
  SELECT 1 FROM public.compliance_requirements cr
  WHERE cr.company_id = c.id AND cr.standard = s.standard AND cr.clause_number = s.clause_number
);
