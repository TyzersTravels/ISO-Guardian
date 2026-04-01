-- ===== ISOGuardian Demo Account Seed =====
-- Creates a realistic demo company with 6+ months of activity
-- Auth user already exists: 8b642e5c-0d45-4efc-bf0f-8aab57bc39de
--
-- Run this script in Supabase SQL Editor
-- Log in as demo@isoguardian.co.za to screen record

DO $$
DECLARE
  v_user_id UUID := '8b642e5c-0d45-4efc-bf0f-8aab57bc39de';
  v_company_id UUID := gen_random_uuid();
  v_company_id_text TEXT;
BEGIN

  v_company_id_text := v_company_id::TEXT;

  -- ─── Step 1: Create demo company ───
  INSERT INTO public.companies (id, name, company_code, industry, tier, status, doc_counter, ncr_counter, audit_counter, review_counter, created_at)
  VALUES (
    v_company_id,
    'Apex Manufacturing (Pty) Ltd',
    'AM',
    'Manufacturing',
    'professional',
    'active',
    22, 8, 5, 3,
    NOW() - INTERVAL '7 months'
  );

  -- ─── Step 2: Create demo user profile ───
  INSERT INTO public.users (id, email, full_name, role, company_id, standards_access, is_active, referral_code, created_at)
  VALUES (
    v_user_id,
    'demo@isoguardian.co.za',
    'James van der Merwe',
    'admin',
    v_company_id,
    '["ISO_9001", "ISO_14001", "ISO_45001"]'::jsonb,
    true,
    'APEX-DEMO',
    NOW() - INTERVAL '7 months'
  );

  -- ─── Step 3: Subscription (Growth tier, active) ───
  INSERT INTO public.subscriptions (company_id, plan, status, users_count, price_per_user, billing_cycle, current_period_start, current_period_end, currency, next_billing_date, created_at)
  VALUES (
    v_company_id,
    'Growth',
    'active',
    20,
    185,
    'monthly',
    (NOW() - INTERVAL '1 month')::DATE,
    (NOW() + INTERVAL '1 month')::DATE,
    'ZAR',
    (NOW() + INTERVAL '1 month')::DATE,
    NOW() - INTERVAL '6 months'
  );

  -- ─── Step 4: Documents (22 controlled documents) ───
  INSERT INTO public.documents (company_id, name, document_number, standard, clause, clause_name, type, version, status, owner_id, review_frequency_months, next_review_date, last_reviewed_at, last_reviewed_by, requires_acknowledgement, uploaded_by, date_updated, created_at) VALUES
    -- ISO 9001 documents
    (v_company_id_text, 'Quality Management System Manual', 'IG-AM-DOC-001', 'ISO_9001', '4', 'Clause 4: Context of the Organization', 'Manual', '2.0', 'active', v_user_id, 12, (NOW() + INTERVAL '5 months')::DATE, NOW() - INTERVAL '1 month', v_user_id, true, v_user_id, (NOW() - INTERVAL '1 month')::DATE, NOW() - INTERVAL '7 months'),
    (v_company_id_text, 'Quality Policy', 'IG-AM-DOC-002', 'ISO_9001', '5', 'Clause 5: Leadership', 'Policy', '1.0', 'active', v_user_id, 12, (NOW() + INTERVAL '5 months')::DATE, NOW() - INTERVAL '2 months', v_user_id, true, v_user_id, (NOW() - INTERVAL '6 months')::DATE, NOW() - INTERVAL '6 months'),
    (v_company_id_text, 'Risk & Opportunity Register', 'IG-AM-DOC-003', 'ISO_9001', '6', 'Clause 6: Planning', 'Record', '3.0', 'active', v_user_id, 6, (NOW() + INTERVAL '2 months')::DATE, NOW() - INTERVAL '4 months', v_user_id, false, v_user_id, (NOW() - INTERVAL '2 weeks')::DATE, NOW() - INTERVAL '6 months'),
    (v_company_id_text, 'Competence & Training Matrix', 'IG-AM-DOC-004', 'ISO_9001', '7', 'Clause 7: Support', 'Record', '2.0', 'active', v_user_id, 6, (NOW() + INTERVAL '1 month')::DATE, NOW() - INTERVAL '5 months', v_user_id, true, v_user_id, (NOW() - INTERVAL '3 weeks')::DATE, NOW() - INTERVAL '6 months'),
    (v_company_id_text, 'Document Control Procedure', 'IG-AM-DOC-005', 'ISO_9001', '7', 'Clause 7: Support', 'Procedure', '1.0', 'active', v_user_id, 12, (NOW() + INTERVAL '6 months')::DATE, NOW() - INTERVAL '6 months', v_user_id, true, v_user_id, (NOW() - INTERVAL '6 months')::DATE, NOW() - INTERVAL '6 months'),
    (v_company_id_text, 'Production Control Procedure', 'IG-AM-DOC-006', 'ISO_9001', '8', 'Clause 8: Operation', 'Procedure', '2.0', 'active', v_user_id, 12, (NOW() + INTERVAL '4 months')::DATE, NOW() - INTERVAL '2 months', v_user_id, false, v_user_id, (NOW() - INTERVAL '1 month')::DATE, NOW() - INTERVAL '6 months'),
    (v_company_id_text, 'Customer Satisfaction Survey Procedure', 'IG-AM-DOC-007', 'ISO_9001', '9', 'Clause 9: Performance Evaluation', 'Procedure', '1.0', 'active', v_user_id, 12, (NOW() + INTERVAL '6 months')::DATE, NOW() - INTERVAL '6 months', v_user_id, false, v_user_id, (NOW() - INTERVAL '6 months')::DATE, NOW() - INTERVAL '6 months'),
    (v_company_id_text, 'Internal Audit Procedure', 'IG-AM-DOC-008', 'ISO_9001', '9', 'Clause 9: Performance Evaluation', 'Procedure', '1.0', 'active', v_user_id, 12, (NOW() + INTERVAL '5 months')::DATE, NOW() - INTERVAL '6 months', v_user_id, true, v_user_id, (NOW() - INTERVAL '6 months')::DATE, NOW() - INTERVAL '6 months'),
    (v_company_id_text, 'Corrective Action Procedure', 'IG-AM-DOC-009', 'ISO_9001', '10', 'Clause 10: Improvement', 'Procedure', '1.0', 'active', v_user_id, 12, (NOW() + INTERVAL '5 months')::DATE, NOW() - INTERVAL '6 months', v_user_id, true, v_user_id, (NOW() - INTERVAL '6 months')::DATE, NOW() - INTERVAL '6 months'),
    (v_company_id_text, 'Supplier Evaluation Form', 'IG-AM-DOC-010', 'ISO_9001', '8', 'Clause 8: Operation', 'Form', '1.0', 'active', v_user_id, 12, (NOW() + INTERVAL '3 months')::DATE, NOW() - INTERVAL '3 months', v_user_id, false, v_user_id, (NOW() - INTERVAL '5 months')::DATE, NOW() - INTERVAL '5 months'),
    -- ISO 14001 documents
    (v_company_id_text, 'Environmental Management Manual', 'IG-AM-DOC-011', 'ISO_14001', '4', 'Clause 4: Context of the Organization', 'Manual', '1.0', 'active', v_user_id, 12, (NOW() + INTERVAL '6 months')::DATE, NOW() - INTERVAL '6 months', v_user_id, true, v_user_id, (NOW() - INTERVAL '5 months')::DATE, NOW() - INTERVAL '5 months'),
    (v_company_id_text, 'Environmental Policy', 'IG-AM-DOC-012', 'ISO_14001', '5', 'Clause 5: Leadership', 'Policy', '1.0', 'active', v_user_id, 12, (NOW() + INTERVAL '6 months')::DATE, NOW() - INTERVAL '6 months', v_user_id, true, v_user_id, (NOW() - INTERVAL '5 months')::DATE, NOW() - INTERVAL '5 months'),
    (v_company_id_text, 'Environmental Aspects & Impacts Register', 'IG-AM-DOC-013', 'ISO_14001', '6', 'Clause 6: Planning', 'Record', '2.0', 'active', v_user_id, 6, (NOW() + INTERVAL '2 months')::DATE, NOW() - INTERVAL '4 months', v_user_id, false, v_user_id, (NOW() - INTERVAL '3 months')::DATE, NOW() - INTERVAL '5 months'),
    (v_company_id_text, 'Waste Management Procedure', 'IG-AM-DOC-014', 'ISO_14001', '8', 'Clause 8: Operation', 'Procedure', '1.0', 'active', v_user_id, 12, (NOW() + INTERVAL '5 months')::DATE, NOW() - INTERVAL '5 months', v_user_id, false, v_user_id, (NOW() - INTERVAL '4 months')::DATE, NOW() - INTERVAL '4 months'),
    (v_company_id_text, 'Emergency Preparedness Plan', 'IG-AM-DOC-015', 'ISO_14001', '8', 'Clause 8: Operation', 'Procedure', '1.0', 'active', v_user_id, 12, (NOW() + INTERVAL '4 months')::DATE, NOW() - INTERVAL '4 months', v_user_id, true, v_user_id, (NOW() - INTERVAL '4 months')::DATE, NOW() - INTERVAL '4 months'),
    -- ISO 45001 documents
    (v_company_id_text, 'OH&S Management Manual', 'IG-AM-DOC-016', 'ISO_45001', '4', 'Clause 4: Context of the Organization', 'Manual', '1.0', 'active', v_user_id, 12, (NOW() + INTERVAL '6 months')::DATE, NOW() - INTERVAL '5 months', v_user_id, true, v_user_id, (NOW() - INTERVAL '4 months')::DATE, NOW() - INTERVAL '4 months'),
    (v_company_id_text, 'OH&S Policy', 'IG-AM-DOC-017', 'ISO_45001', '5', 'Clause 5: Leadership', 'Policy', '1.0', 'active', v_user_id, 12, (NOW() + INTERVAL '6 months')::DATE, NOW() - INTERVAL '4 months', v_user_id, true, v_user_id, (NOW() - INTERVAL '4 months')::DATE, NOW() - INTERVAL '4 months'),
    (v_company_id_text, 'Hazard Identification & Risk Assessment', 'IG-AM-DOC-018', 'ISO_45001', '6', 'Clause 6: Planning', 'Record', '3.0', 'active', v_user_id, 3, (NOW() - INTERVAL '5 days')::DATE, NOW() - INTERVAL '3 months', v_user_id, false, v_user_id, (NOW() - INTERVAL '2 weeks')::DATE, NOW() - INTERVAL '4 months'),
    (v_company_id_text, 'Incident Investigation Procedure', 'IG-AM-DOC-019', 'ISO_45001', '10', 'Clause 10: Improvement', 'Procedure', '1.0', 'active', v_user_id, 12, (NOW() + INTERVAL '5 months')::DATE, NOW() - INTERVAL '4 months', v_user_id, true, v_user_id, (NOW() - INTERVAL '4 months')::DATE, NOW() - INTERVAL '4 months'),
    (v_company_id_text, 'PPE Issue Register', 'IG-AM-DOC-020', 'ISO_45001', '8', 'Clause 8: Operation', 'Record', '1.0', 'active', v_user_id, 6, (NOW() + INTERVAL '3 months')::DATE, NOW() - INTERVAL '3 months', v_user_id, false, v_user_id, (NOW() - INTERVAL '3 months')::DATE, NOW() - INTERVAL '3 months'),
    -- Documents in other states
    (v_company_id_text, 'Management of Change Procedure', 'IG-AM-DOC-021', 'ISO_9001', '8', 'Clause 8: Operation', 'Procedure', '1.0', 'in_review', v_user_id, 12, NULL, NULL, NULL, true, v_user_id, (NOW() - INTERVAL '3 days')::DATE, NOW() - INTERVAL '1 week'),
    (v_company_id_text, 'Calibration Procedure (Draft)', 'IG-AM-DOC-022', 'ISO_9001', '7', 'Clause 7: Support', 'Procedure', '1.0', 'draft', v_user_id, 12, NULL, NULL, NULL, false, v_user_id, (NOW() - INTERVAL '2 days')::DATE, NOW() - INTERVAL '5 days');

  -- ─── Step 5: NCRs (8 NCRs at various stages) ───
  INSERT INTO public.ncrs (company_id, ncr_number, title, description, standard, clause, clause_name, severity, status, assigned_to, date_opened, due_date, root_cause, corrective_action, date_closed, created_by, created_at) VALUES
    (v_company_id, 'IG-AM-NCR-001', 'Calibration records missing for torque wrench', 'During internal audit, calibration certificate for torque wrench TW-007 could not be located.', 'ISO_9001', '7', 'Clause 7: Support', 'Major', 'Closed', v_user_id, (NOW() - INTERVAL '5 months')::DATE, (NOW() - INTERVAL '4 months')::DATE, 'Calibration tracking spreadsheet was not updated when the workshop moved.', 'Implemented calibration tracking in ISOGuardian with automated reminders.', (NOW() - INTERVAL '3.5 months')::DATE, v_user_id, NOW() - INTERVAL '5 months'),
    (v_company_id, 'IG-AM-NCR-002', 'Customer complaint — incorrect packaging labels', 'Customer (Sasol) received 200 units with incorrect batch numbers on packaging labels.', 'ISO_9001', '8', 'Clause 8: Operation', 'Major', 'Closed', v_user_id, (NOW() - INTERVAL '4 months')::DATE, (NOW() - INTERVAL '3 months')::DATE, 'Label printer software not updated after batch number format change.', 'Updated label printer firmware. Retrained all packaging operators.', (NOW() - INTERVAL '2.5 months')::DATE, v_user_id, NOW() - INTERVAL '4 months'),
    (v_company_id, 'IG-AM-NCR-003', 'Fire extinguisher inspection overdue', 'Monthly inspection of 3 fire extinguishers in Workshop B not recorded for September and October.', 'ISO_45001', '8', 'Clause 8: Operation', 'Minor', 'Closed', v_user_id, (NOW() - INTERVAL '3 months')::DATE, (NOW() - INTERVAL '2 months')::DATE, 'Responsible person was on extended leave. No backup assigned.', 'Assigned backup inspectors for all safety equipment.', (NOW() - INTERVAL '2 months')::DATE, v_user_id, NOW() - INTERVAL '3 months'),
    (v_company_id, 'IG-AM-NCR-004', 'Chemical spill containment inadequate', 'Environmental audit revealed that secondary containment does not meet 110% volume requirement.', 'ISO_14001', '8', 'Clause 8: Operation', 'Critical', 'In Progress', v_user_id, (NOW() - INTERVAL '3 weeks')::DATE, (NOW() + INTERVAL '2 weeks')::DATE, 'Original containment bund designed for smaller volume.', 'Quotation obtained from Enviro-Bund Solutions for upgraded containment.', NULL, v_user_id, NOW() - INTERVAL '3 weeks'),
    (v_company_id, 'IG-AM-NCR-005', 'Supplier evaluation not conducted for new supplier', 'Raw material supplier Metalco SA onboarded without completing supplier evaluation form.', 'ISO_9001', '8', 'Clause 8: Operation', 'Minor', 'In Progress', v_user_id, (NOW() - INTERVAL '2 weeks')::DATE, (NOW() + INTERVAL '3 weeks')::DATE, 'Procurement team unaware that evaluation applies to all new suppliers.', NULL, NULL, v_user_id, NOW() - INTERVAL '2 weeks'),
    (v_company_id, 'IG-AM-NCR-006', 'Near-miss incident not reported within 24 hours', 'Forklift near-miss in loading bay reported 5 days later during toolbox talk.', 'ISO_45001', '10', 'Clause 10: Improvement', 'Minor', 'Open', v_user_id, (NOW() - INTERVAL '10 days')::DATE, (NOW() + INTERVAL '1 month')::DATE, NULL, NULL, NULL, v_user_id, NOW() - INTERVAL '10 days'),
    (v_company_id, 'IG-AM-NCR-007', 'Management review actions not closed out', 'Three action items from January management review still outstanding.', 'ISO_9001', '9', 'Clause 9: Performance Evaluation', 'Major', 'In Progress', v_user_id, (NOW() - INTERVAL '2 months')::DATE, (NOW() - INTERVAL '2 weeks')::DATE, 'Action items assigned but no follow-up mechanism.', 'Assigned specific owners with deadlines in ISOGuardian.', NULL, v_user_id, NOW() - INTERVAL '2 months'),
    (v_company_id, 'IG-AM-NCR-008', 'First aid kit contents incomplete', 'Workshop A first aid kit missing burn gel, eye wash, and CPR face shield.', 'ISO_45001', '7', 'Clause 7: Support', 'Minor', 'Open', v_user_id, (NOW() - INTERVAL '2 days')::DATE, (NOW() + INTERVAL '1 month')::DATE, NULL, NULL, NULL, v_user_id, NOW() - INTERVAL '2 days');

  -- ─── Step 6: Audits (5 audits) ───
  INSERT INTO public.audits (company_id, audit_number, audit_type, standard, scope, audit_date, audit_time, assigned_auditor_name, status, findings, observations, ncrs_raised, conclusion, evidence_reviewed, corrective_actions, auditor_recommendation, created_by, created_at) VALUES
    (v_company_id, 'IG-AM-AUD-001', 'Internal', 'ISO_9001', 'Full system audit — Clauses 4-10.', (NOW() - INTERVAL '5 months')::DATE, '09:00', 'Sarah Nkosi', 'Complete', 'Document control procedure followed but 2 documents found without current revision stamps.', 'Recommend digitalising remaining paper-based quality records.', 2, 'The QMS is effectively implemented with minor opportunities for improvement.', 'Quality manual, procedure documents, calibration certificates, production records.', 'Close out NCR-001 and NCR-002. Update document control process.', 'Continue certification readiness. Schedule Stage 1 audit within 3 months.', v_user_id, NOW() - INTERVAL '5 months'),
    (v_company_id, 'IG-AM-AUD-002', 'Internal', 'ISO_14001', 'Environmental aspects, legal compliance, waste management.', (NOW() - INTERVAL '3 months')::DATE, '08:30', 'Sarah Nkosi', 'Complete', 'Waste segregation mostly compliant. Chemical storage area containment below regulatory requirement.', 'Energy monitoring not yet formalised — recommend installing sub-meters.', 1, 'Environmental management system functional with one critical finding on chemical containment.', 'Environmental aspects register, waste disposal certificates, chemical inventory.', 'Upgrade chemical containment bund. Implement energy monitoring programme.', 'Address critical NCR before external audit.', v_user_id, NOW() - INTERVAL '3 months'),
    (v_company_id, 'IG-AM-AUD-003', 'Internal', 'ISO_45001', 'OH&S hazard identification, risk assessment, incident management.', (NOW() - INTERVAL '6 weeks')::DATE, '09:00', 'Sarah Nkosi', 'Complete', 'HIRA register comprehensive and current. PPE compliance good (98%).', 'Recommend formalising safety observations programme.', 1, 'OH&S system well established. One minor NCR on incident reporting timeline.', 'HIRA register, incident reports, PPE issue register, training records.', 'Reinforce 24-hour incident reporting requirement through toolbox talks.', 'System ready for external audit.', v_user_id, NOW() - INTERVAL '6 weeks'),
    (v_company_id, 'IG-AM-AUD-004', 'Surveillance', 'ISO_9001', 'Stage 1 certification audit — documentation review.', (NOW() + INTERVAL '3 weeks')::DATE, '08:00', 'External — ISOQAR Africa', 'Planned', NULL, NULL, NULL, NULL, NULL, NULL, NULL, v_user_id, NOW() - INTERVAL '1 month'),
    (v_company_id, 'IG-AM-AUD-005', 'Internal', 'ISO_9001', 'Pre-certification internal audit — full system review.', (NOW() + INTERVAL '10 days')::DATE, '09:00', 'Sarah Nkosi', 'Planned', NULL, NULL, NULL, NULL, NULL, NULL, NULL, v_user_id, NOW() - INTERVAL '2 weeks');

  -- ─── Step 7: Management Reviews (3 reviews) ───
  INSERT INTO public.management_reviews (company_id, review_number, review_date, review_time, status, chairperson, attendees, agenda_items, minutes, decisions_made, action_items, resource_decisions, improvement_opportunities, next_review_date, created_by, created_at) VALUES
    (v_company_id, 'IG-AM-MR-001', (NOW() - INTERVAL '5 months')::DATE, '10:00', 'Completed', 'James van der Merwe', 'James van der Merwe (MD), Sarah Nkosi (Quality Manager), Thabo Molefe (Safety Officer), Lerato Dlamini (Production Manager)', 'Status of previous actions, Audit results review, Customer feedback analysis, NCR trends, Resource requirements', 'Meeting opened at 10:00. Previous actions: 4 of 5 completed. Audit results reviewed — 2 NCRs being addressed. Customer satisfaction at 92%. NCR trend declining (positive). Resource request: additional quality inspector approved. Meeting closed at 12:15.', 'Approved hiring of additional quality inspector. Budget allocated for ISOGuardian Growth subscription. Chemical containment upgrade approved (R85,000).', 'Update training plan for new hires. Complete customer feedback analysis for Q3. Revise KPI dashboard.', 'Approved additional quality inspector (R25,000/month). ISOGuardian Growth subscription. Chemical containment bund upgrade (R85,000 capex).', 'Digitise remaining paper-based quality records. Implement customer satisfaction real-time tracking.', (NOW() - INTERVAL '2 months')::DATE, v_user_id, NOW() - INTERVAL '5 months'),
    (v_company_id, 'IG-AM-MR-002', (NOW() - INTERVAL '2 months')::DATE, '10:00', 'Completed', 'James van der Merwe', 'James van der Merwe (MD), Sarah Nkosi (Quality Manager), Thabo Molefe (Safety Officer)', 'Follow-up on previous review actions, Certification readiness, NCR status update, Environmental programme progress', 'Meeting opened at 10:00. Training plan updated (complete). Customer feedback analysis done (complete). KPI dashboard still in progress. Stage 1 audit scheduled with ISOQAR Africa. 4 NCRs closed, 3 in progress, 1 new. Meeting closed at 11:45.', 'Proceed with ISOQAR Africa Stage 1 audit booking. Prioritise closing open NCRs. OH&S bonus scheme approved.', 'Close all open NCRs before Stage 1 audit. Complete pre-certification internal audit. Prepare document packages.', 'OH&S performance bonus (R5,000 per employee for zero LTI record). Pre-audit preparation costs budgeted.', 'Implement safety observations programme. Explore ISO 27001 for future roadmap.', (NOW() + INTERVAL '1 month')::DATE, v_user_id, NOW() - INTERVAL '2 months'),
    (v_company_id, 'IG-AM-MR-003', (NOW() + INTERVAL '1 month')::DATE, '10:00', 'Scheduled', 'James van der Merwe', NULL, 'Pre-audit readiness review, NCR close-out status, Certification timeline confirmation', NULL, NULL, NULL, NULL, NULL, (NOW() + INTERVAL '4 months')::DATE, v_user_id, NOW() - INTERVAL '1 week');

  -- ─── Step 8: Compliance requirements (INSERT, not just UPDATE) ───
  -- ISO 9001:2015 clauses
  INSERT INTO public.compliance_requirements (company_id, standard, clause_number, clause_name, requirement_text, compliance_status, last_reviewed, notes) VALUES
    (v_company_id, 'ISO_9001', 4, 'Context of the Organization', 'Determine external and internal issues, interested parties, and scope of the QMS.', 'Met', (NOW() - INTERVAL '1 month')::DATE, NULL),
    (v_company_id, 'ISO_9001', 5, 'Leadership', 'Top management shall demonstrate leadership and commitment to the QMS.', 'Met', (NOW() - INTERVAL '1 month')::DATE, NULL),
    (v_company_id, 'ISO_9001', 6, 'Planning', 'Plan actions to address risks and opportunities, quality objectives, and changes.', 'Met', (NOW() - INTERVAL '1 month')::DATE, NULL),
    (v_company_id, 'ISO_9001', 7, 'Support', 'Determine and provide resources, competence, awareness, communication, and documented information.', 'Met', (NOW() - INTERVAL '1 month')::DATE, NULL),
    (v_company_id, 'ISO_9001', 8, 'Operation', 'Plan and control operational processes, requirements, design, external provision, production, and release.', 'Partially Met', (NOW() - INTERVAL '2 weeks')::DATE, 'Supplier evaluation process needs strengthening.'),
    (v_company_id, 'ISO_9001', 9, 'Performance Evaluation', 'Monitor, measure, analyse, evaluate, conduct internal audits and management reviews.', 'Met', (NOW() - INTERVAL '1 month')::DATE, NULL),
    (v_company_id, 'ISO_9001', 10, 'Improvement', 'Determine opportunities for improvement, address nonconformities, and continually improve.', 'Met', (NOW() - INTERVAL '1 month')::DATE, NULL);

  -- ISO 14001:2015 clauses
  INSERT INTO public.compliance_requirements (company_id, standard, clause_number, clause_name, requirement_text, compliance_status, last_reviewed, notes) VALUES
    (v_company_id, 'ISO_14001', 4, 'Context of the Organization', 'Determine external and internal issues, interested parties, and scope of the EMS.', 'Met', (NOW() - INTERVAL '6 weeks')::DATE, NULL),
    (v_company_id, 'ISO_14001', 5, 'Leadership', 'Top management shall demonstrate leadership and commitment to the EMS.', 'Met', (NOW() - INTERVAL '6 weeks')::DATE, NULL),
    (v_company_id, 'ISO_14001', 6, 'Planning', 'Plan actions to address environmental aspects, compliance obligations, risks and opportunities.', 'Met', (NOW() - INTERVAL '6 weeks')::DATE, NULL),
    (v_company_id, 'ISO_14001', 7, 'Support', 'Determine and provide resources, competence, awareness, communication, and documented information.', 'Met', (NOW() - INTERVAL '6 weeks')::DATE, NULL),
    (v_company_id, 'ISO_14001', 8, 'Operation', 'Establish operational controls, emergency preparedness and response procedures.', 'Partially Met', (NOW() - INTERVAL '3 weeks')::DATE, 'Chemical containment below 110% requirement. Upgrade in progress.'),
    (v_company_id, 'ISO_14001', 9, 'Performance Evaluation', 'Monitor, measure, analyse, evaluate environmental performance, conduct audits and reviews.', 'Met', (NOW() - INTERVAL '6 weeks')::DATE, NULL),
    (v_company_id, 'ISO_14001', 10, 'Improvement', 'Determine opportunities for improvement, address nonconformities, and continually improve.', 'Met', (NOW() - INTERVAL '6 weeks')::DATE, NULL);

  -- ISO 45001:2018 clauses
  INSERT INTO public.compliance_requirements (company_id, standard, clause_number, clause_name, requirement_text, compliance_status, last_reviewed, notes) VALUES
    (v_company_id, 'ISO_45001', 4, 'Context of the Organization', 'Determine external and internal issues, interested parties, and scope of the OH&S MS.', 'Met', (NOW() - INTERVAL '6 weeks')::DATE, NULL),
    (v_company_id, 'ISO_45001', 5, 'Leadership and Worker Participation', 'Top management shall demonstrate leadership and ensure worker consultation and participation.', 'Met', (NOW() - INTERVAL '6 weeks')::DATE, NULL),
    (v_company_id, 'ISO_45001', 6, 'Planning', 'Plan actions to address hazards, OH&S risks, legal requirements, and objectives.', 'Met', (NOW() - INTERVAL '6 weeks')::DATE, NULL),
    (v_company_id, 'ISO_45001', 7, 'Support', 'Determine and provide resources, competence, awareness, communication, and documented information.', 'Met', (NOW() - INTERVAL '6 weeks')::DATE, NULL),
    (v_company_id, 'ISO_45001', 8, 'Operation', 'Establish operational controls, eliminate hazards, manage change, procurement, and emergency preparedness.', 'Met', (NOW() - INTERVAL '6 weeks')::DATE, NULL),
    (v_company_id, 'ISO_45001', 9, 'Performance Evaluation', 'Monitor, measure, analyse, evaluate OH&S performance, conduct audits and reviews.', 'Met', (NOW() - INTERVAL '6 weeks')::DATE, NULL),
    (v_company_id, 'ISO_45001', 10, 'Improvement', 'Determine opportunities for improvement, investigate incidents, address nonconformities.', 'Partially Met', (NOW() - INTERVAL '10 days')::DATE, 'Near-miss reporting within 24 hours not consistently achieved.');

  -- ─── Step 9: Activity trail ───
  INSERT INTO public.audit_log (company_id, user_id, action, entity_type, entity_id, changes, created_at) VALUES
    (v_company_id, v_user_id, 'created', 'company', v_company_id, '{"name": "Apex Manufacturing (Pty) Ltd"}'::jsonb, NOW() - INTERVAL '7 months'),
    (v_company_id, v_user_id, 'uploaded', 'document', NULL, '{"name": "Quality Management System Manual"}'::jsonb, NOW() - INTERVAL '7 months'),
    (v_company_id, v_user_id, 'uploaded', 'document', NULL, '{"name": "Quality Policy"}'::jsonb, NOW() - INTERVAL '6 months'),
    (v_company_id, v_user_id, 'created', 'ncr', NULL, '{"ncr_number": "IG-AM-NCR-001"}'::jsonb, NOW() - INTERVAL '5 months'),
    (v_company_id, v_user_id, 'created', 'audit', NULL, '{"audit_number": "IG-AM-AUD-001"}'::jsonb, NOW() - INTERVAL '5 months'),
    (v_company_id, v_user_id, 'created', 'management_review', NULL, '{"review_number": "IG-AM-MR-001"}'::jsonb, NOW() - INTERVAL '5 months'),
    (v_company_id, v_user_id, 'status_changed', 'ncr', NULL, '{"ncr_number": "IG-AM-NCR-001", "from": "Open", "to": "Closed"}'::jsonb, NOW() - INTERVAL '3.5 months'),
    (v_company_id, v_user_id, 'status_changed', 'ncr', NULL, '{"ncr_number": "IG-AM-NCR-002", "from": "Open", "to": "Closed"}'::jsonb, NOW() - INTERVAL '2.5 months'),
    (v_company_id, v_user_id, 'created', 'audit', NULL, '{"audit_number": "IG-AM-AUD-002"}'::jsonb, NOW() - INTERVAL '3 months'),
    (v_company_id, v_user_id, 'created', 'management_review', NULL, '{"review_number": "IG-AM-MR-002"}'::jsonb, NOW() - INTERVAL '2 months'),
    (v_company_id, v_user_id, 'updated', 'document', NULL, '{"name": "QMS Manual", "old_version": "1.0", "new_version": "2.0"}'::jsonb, NOW() - INTERVAL '1 month'),
    (v_company_id, v_user_id, 'created', 'audit', NULL, '{"audit_number": "IG-AM-AUD-003"}'::jsonb, NOW() - INTERVAL '6 weeks'),
    (v_company_id, v_user_id, 'created', 'ncr', NULL, '{"ncr_number": "IG-AM-NCR-004"}'::jsonb, NOW() - INTERVAL '3 weeks'),
    (v_company_id, v_user_id, 'approved', 'document', NULL, '{"name": "HIRA", "version": "3.0"}'::jsonb, NOW() - INTERVAL '2 weeks'),
    (v_company_id, v_user_id, 'viewed', 'document', NULL, '{"name": "Quality Policy"}'::jsonb, NOW() - INTERVAL '1 week'),
    (v_company_id, v_user_id, 'created', 'ncr', NULL, '{"ncr_number": "IG-AM-NCR-008"}'::jsonb, NOW() - INTERVAL '2 days'),
    (v_company_id, v_user_id, 'status_changed', 'document', NULL, '{"name": "Management of Change Procedure", "to": "in_review"}'::jsonb, NOW() - INTERVAL '3 days');

  -- ─── Step 10: Document acknowledgements ───
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_acknowledgements') THEN
    INSERT INTO public.document_acknowledgements (document_id, company_id, user_id, version_acknowledged, acknowledged_at)
    SELECT d.id, v_company_id_text, v_user_id, d.version, NOW() - INTERVAL '4 months'
    FROM public.documents d WHERE d.company_id = v_company_id_text AND d.requires_acknowledgement = true;
  END IF;

  RAISE NOTICE 'Demo seed complete! Company: Apex Manufacturing, Code: AM, User: demo@isoguardian.co.za';
END $$;
