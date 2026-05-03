// ISOGuardian Template Content — Server-side only (IP protected)
// This content is NEVER sent to the frontend bundle
// Placeholders: {{COMPANY}}, {{CODE}}, {{DATE}}, {{STANDARD}}, {{PREPARED_BY}}

export const TEMPLATE_CONTENT: Record<string, any> = {
  'qms-manual': {
    title: 'Quality Management System Manual',
    docNumber: 'IG-{{CODE}}-QMS-001',
    revision: '01',
    sections: [
      {
        heading: '1. Introduction',
        body: 'This Quality Management System (QMS) Manual defines the quality management system of {{COMPANY}} in accordance with ISO 9001:2015. It describes the scope, processes, and framework that govern how {{COMPANY}} consistently delivers products and services that meet customer and regulatory requirements.\n\nThis manual serves as the top-level document of the QMS and provides a roadmap to the supporting procedures, work instructions, forms, and records that make up the complete system.\n\n**Document Control:**\n| Detail | Value |\n|--------|-------|\n| Document Number | IG-{{CODE}}-QMS-001 |\n| Revision | 01 |\n| Effective Date | {{DATE}} |\n| Prepared By | {{PREPARED_BY}} |\n| Approved By | [Management Representative] |\n| Next Review Date | [12 months from effective date] |'
      },
      {
        heading: '2. Company Profile',
        body: '**Organisation:** {{COMPANY}}\n\n**Products/Services:** [Describe your core products or services]\n\n**Organisational Structure:**\n{{COMPANY}} operates under a defined organisational structure with clear lines of authority and responsibility. The Management Representative has been appointed to oversee the QMS and report on its performance to top management.\n\n**Key Interested Parties:**\n| Interested Party | Needs & Expectations |\n|-----------------|---------------------|\n| Customers | Quality products/services, on-time delivery, responsive support |\n| Employees | Safe working environment, training, fair compensation |\n| Regulatory Bodies | Compliance with applicable laws and regulations |\n| Suppliers | Clear requirements, timely payment, fair dealings |\n| Shareholders/Owners | Profitability, growth, risk management |'
      },
      {
        heading: '3. Scope of the QMS',
        body: 'The QMS of {{COMPANY}} applies to the following:\n\n**Scope Statement:** [Define the scope of your QMS — what products, services, sites, and processes are covered]\n\n**Applicability of ISO 9001:2015 Clauses:**\nAll clauses of ISO 9001:2015 are applicable unless otherwise justified below.\n\n**Exclusions:** [If any clause is not applicable, justify here. Note: only Clause 8.3 (Design & Development) may be excluded if the organisation does not design products/services]\n\n**Normative References:**\n- ISO 9001:2015 — Quality management systems — Requirements\n- ISO 9000:2015 — Quality management systems — Fundamentals and vocabulary'
      },
      {
        heading: '4. Context of the Organisation (Clause 4)',
        body: '**4.1 Understanding the Organisation and its Context**\n\n{{COMPANY}} determines external and internal issues relevant to its purpose and strategic direction that affect its ability to achieve the intended results of the QMS.\n\n**External Issues:**\n- Market conditions and competition\n- Regulatory and legal requirements (including South African legislation)\n- Technological changes\n- Economic factors\n- Customer expectations and trends\n\n**Internal Issues:**\n- Organisational culture and values\n- Staff competence and capacity\n- Infrastructure and technology\n- Financial resources\n- Knowledge and intellectual property\n\n**4.2 Understanding the Needs and Expectations of Interested Parties**\n\nRefer to the Interested Parties table in Section 2. These are reviewed at each Management Review meeting.\n\n**4.3 Determining the Scope of the QMS**\n\nRefer to Section 3 of this manual.\n\n**4.4 QMS and its Processes**\n\n{{COMPANY}} has identified the following core processes:\n\n| Process | Owner | Key Inputs | Key Outputs |\n|---------|-------|-----------|-------------|\n| Sales & Customer Requirements | [Name] | Customer enquiries, RFQs | Quotations, orders, contracts |\n| Operations / Service Delivery | [Name] | Customer orders, specifications | Completed products/services |\n| Purchasing & Supplier Management | [Name] | Purchase requirements | Approved suppliers, materials |\n| Quality Control & Inspection | [Name] | Products/services, standards | Inspection records, release |\n| Customer Feedback & Satisfaction | [Name] | Complaints, surveys | Corrective actions, improvements |\n\nProcess interactions are documented in the Process Interaction Map (separate document).'
      },
      {
        heading: '5. Leadership (Clause 5)',
        body: '**5.1 Leadership and Commitment**\n\nTop management of {{COMPANY}} demonstrates leadership and commitment to the QMS by:\n- Taking accountability for the effectiveness of the QMS\n- Ensuring the quality policy and objectives are established and compatible with the strategic direction\n- Ensuring integration of the QMS into business processes\n- Promoting the use of the process approach and risk-based thinking\n- Ensuring the resources needed for the QMS are available\n- Communicating the importance of effective quality management\n- Ensuring the QMS achieves its intended results\n- Engaging, directing, and supporting persons to contribute to QMS effectiveness\n- Promoting continual improvement\n\n**5.1.2 Customer Focus**\n\nTop management ensures that customer requirements and applicable statutory/regulatory requirements are determined, understood, and consistently met. Risks and opportunities that can affect product/service conformity are determined and addressed.\n\n**5.2 Quality Policy**\n\nThe Quality Policy of {{COMPANY}}:\n\n> *{{COMPANY}} is committed to delivering products and services that consistently meet or exceed customer expectations and regulatory requirements. We achieve this through effective management of our quality system, competent people, continual improvement, and a culture of accountability. Every employee is responsible for quality.*\n\nThe Quality Policy is:\n- Available as documented information\n- Communicated and understood within the organisation\n- Available to relevant interested parties\n- Reviewed for continuing suitability at Management Review\n\n**5.3 Organisational Roles, Responsibilities, and Authorities**\n\n| Role | QMS Responsibility |\n|------|-------------------|\n| Managing Director | Overall accountability for QMS, resource provision |\n| Management Representative | Day-to-day QMS management, reporting to top management |\n| Department Managers | Process ownership, compliance within their areas |\n| Quality Coordinator | Document control, audit coordination, NCR management |\n| All Employees | Follow documented procedures, report nonconformities |'
      },
      {
        heading: '6. Planning (Clause 6)',
        body: '**6.1 Actions to Address Risks and Opportunities**\n\n{{COMPANY}} applies risk-based thinking throughout the QMS. Risks and opportunities are identified considering:\n- The context issues (Clause 4.1)\n- Interested party requirements (Clause 4.2)\n- Process performance data\n- Customer feedback and complaints\n- Audit findings\n\nRisks are assessed using the Risk Register (IG-{{CODE}}-REG-001) and managed according to the Risk Management Procedure.\n\n**Risk Assessment Matrix:**\n| Likelihood \u2192 | Rare (1) | Unlikely (2) | Possible (3) | Likely (4) | Almost Certain (5) |\n|---|---|---|---|---|---|\n| **Catastrophic (5)** | 5 | 10 | 15 | 20 | 25 |\n| **Major (4)** | 4 | 8 | 12 | 16 | 20 |\n| **Moderate (3)** | 3 | 6 | 9 | 12 | 15 |\n| **Minor (2)** | 2 | 4 | 6 | 8 | 10 |\n| **Insignificant (1)** | 1 | 2 | 3 | 4 | 5 |\n\n**Risk Treatment:** Scores \u226512 require documented mitigation actions.\n\n**6.2 Quality Objectives and Planning to Achieve Them**\n\nQuality objectives are established at relevant functions, levels, and processes. Objectives are SMART (Specific, Measurable, Achievable, Relevant, Time-bound).\n\n| Objective | Target | Responsible | Timeframe | Measurement |\n|-----------|--------|-------------|-----------|-------------|\n| Customer satisfaction | \u226585% satisfaction score | Quality Manager | Annual | Customer survey |\n| On-time delivery | \u226595% | Operations Manager | Monthly | Delivery records |\n| NCR reduction | 10% year-on-year | Quality Coordinator | Annual | NCR register |\n| Internal audit compliance | 0 major findings | Management Rep | Per audit | Audit reports |\n\n**6.3 Planning of Changes**\n\nChanges to the QMS are planned and implemented in a controlled manner, considering:\n- The purpose of the change and potential consequences\n- The integrity of the QMS\n- Availability of resources\n- Allocation or reallocation of responsibilities'
      },
      {
        heading: '7. Support (Clause 7)',
        body: '**7.1 Resources**\n\n{{COMPANY}} determines and provides the resources needed for the QMS, including:\n- **People:** Sufficient competent personnel for all QMS processes\n- **Infrastructure:** Buildings, equipment, transport, IT systems, and communication technology\n- **Environment:** Suitable working conditions (temperature, lighting, cleanliness, noise)\n- **Monitoring and Measuring Resources:** Calibrated equipment where applicable\n- **Organisational Knowledge:** Lessons learned, industry knowledge, standards, regulations\n\n**7.2 Competence**\n\n{{COMPANY}} ensures persons doing work under its control are competent based on education, training, or experience. The competence process includes:\n1. Determining required competencies for QMS-affecting roles\n2. Ensuring persons are competent (education, training, experience)\n3. Taking actions to acquire necessary competence (training, mentoring, reassignment)\n4. Retaining documented information as evidence of competence (Training Register)\n\n**7.3 Awareness**\n\nAll persons working under {{COMPANY}}\'s control are aware of:\n- The Quality Policy\n- Relevant quality objectives\n- Their contribution to the QMS effectiveness\n- Implications of not conforming to QMS requirements\n\n**7.4 Communication**\n\n| What | When | With Whom | How |\n|------|------|-----------|-----|\n| Quality Policy | Induction + annually | All staff | Notice boards, email, induction |\n| Quality Objectives | Quarterly | All staff | Team meetings, reports |\n| QMS Changes | As needed | Affected staff | Email, meetings, memos |\n| Customer Feedback | Monthly | Management + relevant staff | Management meetings |\n| Audit Results | Per audit | Management + auditees | Audit reports, meetings |\n\n**7.5 Documented Information**\n\nThe QMS documentation hierarchy:\n1. **Level 1:** Quality Manual (this document)\n2. **Level 2:** Procedures (how processes are managed)\n3. **Level 3:** Work instructions (step-by-step task instructions)\n4. **Level 4:** Forms, records, and supporting documents\n\nDocument control is managed per the Document Control Procedure (IG-{{CODE}}-SOP-001).'
      },
      {
        heading: '8. Operation (Clause 8)',
        body: '**8.1 Operational Planning and Control**\n\n{{COMPANY}} plans, implements, and controls the processes needed to meet requirements for the provision of products and services. Planning includes:\n- Determining requirements for products/services\n- Establishing criteria for processes and acceptance of products/services\n- Determining resources needed\n- Implementing control of processes in accordance with criteria\n- Retaining documented information to demonstrate conformity\n\n**8.2 Requirements for Products and Services**\n\n**8.2.1 Customer Communication:** {{COMPANY}} communicates with customers regarding product/service information, enquiries, contracts, changes, customer feedback (including complaints), and handling of customer property.\n\n**8.2.2 Determining Requirements:** Requirements include those stated by the customer, those not stated but necessary for intended use, statutory and regulatory requirements, and any additional requirements determined by {{COMPANY}}.\n\n**8.2.3 Review of Requirements:** Before committing to supply, {{COMPANY}} reviews the ability to meet requirements. This includes contract review for formal orders and quotation review for ad-hoc requests.\n\n**8.4 Control of Externally Provided Processes, Products, and Services**\n\n{{COMPANY}} ensures externally provided products/services conform to requirements through:\n- Supplier evaluation and approval (Approved Supplier List)\n- Incoming inspection where applicable\n- Supplier performance monitoring\n- Re-evaluation at planned intervals\n\nRefer to the Purchasing & Supplier Management Procedure (IG-{{CODE}}-SOP-004).\n\n**8.5 Production and Service Provision**\n\nProduction/service delivery is carried out under controlled conditions including:\n- Documented information defining product/service characteristics and activities\n- Availability of monitoring and measuring resources\n- Implementation of monitoring and measurement activities\n- Use of suitable infrastructure and environment\n- Appointment of competent persons\n- Validation of processes where output cannot be verified by subsequent monitoring\n- Actions to prevent human error\n- Implementation of release, delivery, and post-delivery activities\n\n**8.6 Release of Products and Services**\n\nProducts and services are not released until planned arrangements have been satisfactorily completed, unless approved by a relevant authority and by the customer where applicable.\n\n**8.7 Control of Nonconforming Outputs**\n\nNonconforming outputs are identified and controlled to prevent unintended use or delivery. Actions include correction, segregation, containment, return, or informing the customer. Refer to the NCR Procedure (IG-{{CODE}}-SOP-003).'
      },
      {
        heading: '9. Performance Evaluation (Clause 9)',
        body: '**9.1 Monitoring, Measurement, Analysis, and Evaluation**\n\n{{COMPANY}} determines:\n- What needs to be monitored and measured\n- Methods for monitoring, measurement, analysis, and evaluation\n- When monitoring and measuring shall be performed\n- When results shall be analysed and evaluated\n\n**Customer Satisfaction:** Monitored through customer surveys, feedback forms, repeat business rates, complaints, and delivery performance.\n\n**Analysis and Evaluation:** Data is analysed to evaluate conformity, customer satisfaction, QMS effectiveness, planning effectiveness, risk action effectiveness, supplier performance, and improvement needs.\n\n**9.2 Internal Audit**\n\n{{COMPANY}} conducts internal audits at planned intervals (minimum annually) to provide information on whether the QMS:\n- Conforms to {{COMPANY}}\'s own requirements and ISO 9001:2015 requirements\n- Is effectively implemented and maintained\n\nAudits are conducted per the Internal Audit Procedure (IG-{{CODE}}-SOP-002). Auditors do not audit their own work. Results are reported to relevant management and recorded in the audit report.\n\n**9.3 Management Review**\n\nTop management reviews the QMS at planned intervals (minimum annually) considering:\n\n**Inputs:**\n- Status of actions from previous reviews\n- Changes in external/internal issues\n- QMS performance and effectiveness (customer satisfaction, objectives, process performance, nonconformities, audit results, supplier performance)\n- Adequacy of resources\n- Effectiveness of risk/opportunity actions\n- Opportunities for improvement\n\n**Outputs:**\n- Improvement opportunities\n- Need for QMS changes\n- Resource needs\n\nManagement review records are maintained per the Management Review Procedure.'
      },
      {
        heading: '10. Improvement (Clause 10)',
        body: '**10.1 General**\n\n{{COMPANY}} determines and selects opportunities for improvement and implements necessary actions to meet customer requirements and enhance satisfaction. This includes:\n- Improving products and services\n- Correcting, preventing, or reducing undesired effects\n- Improving QMS performance and effectiveness\n\n**10.2 Nonconformity and Corrective Action**\n\nWhen a nonconformity occurs (including complaints), {{COMPANY}}:\n1. Reacts to the nonconformity (takes action to control and correct it)\n2. Evaluates the need for action to eliminate the cause(s)\n3. Implements any action needed\n4. Reviews the effectiveness of corrective action taken\n5. Updates risks and opportunities if necessary\n6. Makes changes to the QMS if necessary\n\nNonconformities are managed through the NCR process. Root cause analysis uses appropriate tools (5 Why, Fishbone, etc.).\n\nRefer to the Corrective Action Procedure (IG-{{CODE}}-SOP-003).\n\n**10.3 Continual Improvement**\n\n{{COMPANY}} continually improves the suitability, adequacy, and effectiveness of the QMS through:\n- Management Review outcomes\n- Internal audit findings\n- Data analysis results\n- Corrective action outcomes\n- Customer feedback\n- Employee suggestions\n- Benchmarking and best practices\n\nImprovement projects are tracked and their effectiveness verified at subsequent Management Reviews.'
      },
      {
        heading: 'Appendix A: Document Register',
        body: '| Doc Number | Title | Type | Rev |\n|-----------|-------|------|-----|\n| IG-{{CODE}}-QMS-001 | Quality Management System Manual | Manual | 01 |\n| IG-{{CODE}}-SOP-001 | Document Control Procedure | Procedure | 01 |\n| IG-{{CODE}}-SOP-002 | Internal Audit Procedure | Procedure | 01 |\n| IG-{{CODE}}-SOP-003 | Corrective Action & NCR Procedure | Procedure | 01 |\n| IG-{{CODE}}-SOP-004 | Purchasing & Supplier Management | Procedure | 01 |\n| IG-{{CODE}}-SOP-005 | Management Review Procedure | Procedure | 01 |\n| IG-{{CODE}}-SOP-006 | Training & Competence Procedure | Procedure | 01 |\n| IG-{{CODE}}-SOP-007 | Customer Feedback Procedure | Procedure | 01 |\n| IG-{{CODE}}-REG-001 | Risk Register | Register | 01 |\n| IG-{{CODE}}-FRM-001 | NCR Report Form | Form | 01 |\n| IG-{{CODE}}-FRM-002 | Internal Audit Checklist | Form | 01 |\n| IG-{{CODE}}-FRM-003 | Training Record Form | Form | 01 |\n| IG-{{CODE}}-FRM-004 | Supplier Evaluation Form | Form | 01 |\n| IG-{{CODE}}-FRM-005 | Management Review Minutes | Form | 01 |'
      },
    ],
  },

  'doc-control-proc': {
    title: 'Document Control Procedure',
    docNumber: 'IG-{{CODE}}-SOP-001',
    revision: '01',
    sections: [
      {
        heading: '1. Purpose',
        body: 'This procedure defines the controls for the creation, review, approval, distribution, revision, and disposal of documented information within the {{COMPANY}} management system, in accordance with ISO 9001:2015 Clause 7.5.'
      },
      {
        heading: '2. Scope',
        body: 'This procedure applies to all documented information required by the management system, including:\n- Policies, manuals, and procedures\n- Work instructions and standard operating procedures\n- Forms, checklists, and templates\n- Records and evidence of conformity\n- External documents (legislation, standards, customer specifications)'
      },
      {
        heading: '3. Responsibilities',
        body: '| Role | Responsibility |\n|------|---------------|\n| Management Representative | Oversee document control system, approve Level 1 & 2 documents |\n| Quality Coordinator | Maintain document register, issue/withdraw documents, manage archive |\n| Document Authors | Draft and revise documents according to this procedure |\n| Department Managers | Approve department-level documents, ensure compliance |\n| All Staff | Use current approved versions only, return obsolete copies |'
      },
      {
        heading: '4. Document Hierarchy',
        body: '| Level | Document Type | Approval Authority | Examples |\n|-------|--------------|-------------------|----------|\n| 1 | Policies & Manuals | Managing Director | Quality Manual, Quality Policy |\n| 2 | Procedures | Management Representative | SOPs, department procedures |\n| 3 | Work Instructions | Department Manager | Step-by-step task instructions |\n| 4 | Forms & Records | Quality Coordinator | Checklists, logs, forms |'
      },
      {
        heading: '5. Document Numbering',
        body: 'Documents are numbered using the following convention:\n\n**Format:** IG-[Company Code]-[Type]-[Sequential Number]\n\n| Type Code | Document Type |\n|-----------|--------------|\n| QMS | Quality Management System Manual |\n| SOP | Standard Operating Procedure |\n| WI | Work Instruction |\n| FRM | Form |\n| REG | Register |\n| POL | Policy |\n| PLN | Plan |\n\n**Example:** IG-{{CODE}}-SOP-001 = Document Control Procedure'
      },
      {
        heading: '6. Document Creation and Approval',
        body: '**6.1 Creation:**\n1. Author drafts document using the appropriate template\n2. Document includes: title, number, revision, date, author, approver\n3. Draft is reviewed by relevant stakeholders\n\n**6.2 Review and Approval:**\n1. Reviewer checks technical accuracy, clarity, and compliance\n2. Approver signs off (physical or electronic signature)\n3. Quality Coordinator registers document and assigns number\n4. Document is distributed to relevant personnel\n\n**6.3 Distribution:**\n- Controlled copies are distributed via the Document Management System (ISOGuardian)\n- Uncontrolled copies are marked "UNCONTROLLED" and are for reference only\n- Electronic distribution is the preferred method'
      },
      {
        heading: '7. Document Revision',
        body: '**7.1 Revision Process:**\n1. Change request submitted to Quality Coordinator\n2. Author revises document, highlighting changes\n3. Reviewer and Approver sign off on revised version\n4. Quality Coordinator updates document register, revision number, and effective date\n5. Previous version is archived (retained for a minimum of 3 years)\n6. Revised document is distributed; obsolete copies are withdrawn\n\n**7.2 Revision Tracking:**\n| Rev | Date | Description of Change | Author | Approved |\n|-----|------|--------------------|--------|----------|\n| 00 | [Date] | Initial issue | [Name] | [Name] |\n| 01 | [Date] | [Description] | [Name] | [Name] |\n\n**7.3 Emergency Changes:**\nIn urgent situations, verbal approval from the Approver is acceptable, followed by formal documentation within 5 working days.'
      },
      {
        heading: '8. External Documents',
        body: 'External documents (legislation, standards, customer specifications, supplier documentation) are:\n- Identified and recorded in the External Document Register\n- Reviewed for applicability when received or updated\n- Distributed to relevant personnel\n- Checked for currency at least annually'
      },
      {
        heading: '9. Record Retention',
        body: '| Record Type | Minimum Retention Period |\n|-------------|------------------------|\n| Quality records | 5 years |\n| Training records | Duration of employment + 3 years |\n| Audit reports | 5 years |\n| Management review minutes | 5 years |\n| NCR records | 5 years |\n| Customer complaints | 5 years |\n| Supplier evaluations | 3 years |\n| Calibration records | Life of equipment + 1 year |\n\nRecords are stored securely in ISOGuardian with access restricted to authorised personnel. Backup and disaster recovery are managed by the platform.'
      },
    ],
  },

  'internal-audit-proc': {
    title: 'Internal Audit Procedure',
    docNumber: 'IG-{{CODE}}-SOP-002',
    revision: '01',
    sections: [
      {
        heading: '1. Purpose',
        body: 'This procedure establishes the process for planning, conducting, reporting, and following up on internal audits of the {{COMPANY}} management system, in accordance with ISO 9001:2015 Clause 9.2 and ISO 19011 guidelines.'
      },
      {
        heading: '2. Scope',
        body: 'This procedure applies to all internal audits of the management system, including:\n- Full system audits (all clauses/processes)\n- Process audits (specific processes)\n- Compliance audits (regulatory/legal requirements)\n- Follow-up audits (verification of corrective actions)'
      },
      {
        heading: '3. Responsibilities',
        body: '| Role | Responsibility |\n|------|---------------|\n| Management Representative | Approve annual audit programme, assign lead auditor, review results |\n| Lead Auditor | Plan audits, assign audit team, prepare audit plan and checklist, conduct opening/closing meetings |\n| Internal Auditors | Conduct audit activities, gather evidence, document findings |\n| Auditees | Provide access, information, and cooperation during audits |\n| Quality Coordinator | Maintain audit records, track corrective actions to closure |'
      },
      {
        heading: '4. Auditor Competence',
        body: 'Internal auditors must:\n- Have completed internal auditor training (ISO 19011 or equivalent)\n- Understand the relevant ISO standard requirements\n- Be independent of the area being audited (auditors do not audit their own work)\n- Demonstrate objectivity and impartiality\n\n**Auditor Register:**\nA register of qualified internal auditors is maintained, recording:\n- Name, qualifications, and training\n- Audit experience\n- Date of last audit conducted'
      },
      {
        heading: '5. Annual Audit Programme',
        body: '**5.1 Planning:**\nThe Management Representative prepares an annual audit programme considering:\n- Importance and status of processes\n- Results of previous audits\n- Changes to the organisation or management system\n- Customer complaints and NCR trends\n- Risk assessment outcomes\n\nAll processes/clauses must be audited at least once per year. Higher-risk areas may be audited more frequently.\n\n**5.2 Audit Programme Format:**\n| Quarter | Process/Clause | Lead Auditor | Status |\n|---------|---------------|-------------|--------|\n| Q1 | Operations (Clause 8) | [Name] | Planned |\n| Q1 | Document Control (Clause 7.5) | [Name] | Planned |\n| Q2 | Purchasing (Clause 8.4) | [Name] | Planned |\n| Q2 | Customer Focus (Clause 5.1.2) | [Name] | Planned |\n| Q3 | Internal Audit (Clause 9.2) | [Name] | Planned |\n| Q3 | Competence (Clause 7.2) | [Name] | Planned |\n| Q4 | Management Review (Clause 9.3) | [Name] | Planned |\n| Q4 | Improvement (Clause 10) | [Name] | Planned |'
      },
      {
        heading: '6. Conducting the Audit',
        body: '**6.1 Preparation:**\n1. Lead auditor prepares audit plan (scope, criteria, schedule, team)\n2. Audit plan communicated to auditees at least 5 working days in advance\n3. Audit checklist prepared based on standard requirements and process documentation\n\n**6.2 Opening Meeting:**\n- Confirm scope, objectives, and schedule\n- Introduce audit team\n- Confirm communication channels and logistics\n- Address any concerns from auditees\n\n**6.3 Audit Execution:**\n- Collect evidence through interviews, observation, and document review\n- Record findings against audit criteria\n- Classify findings as per Section 7\n\n**6.4 Closing Meeting:**\n- Present findings to auditees and management\n- Agree on corrective action timelines\n- Thank auditees for their cooperation'
      },
      {
        heading: '7. Classification of Findings',
        body: '| Classification | Definition | Required Action |\n|---------------|-----------|----------------|\n| **Major Nonconformity** | Total absence or breakdown of a system requirement; systematic failure | Corrective action within 30 days; root cause analysis required |\n| **Minor Nonconformity** | Isolated lapse or partial non-fulfilment of a requirement | Corrective action within 60 days |\n| **Observation** | Not a nonconformity but a potential risk or area for improvement | Action recommended but not mandatory |\n| **Opportunity for Improvement (OFI)** | Suggestion that could enhance system effectiveness | Considered at management discretion |\n| **Positive Finding** | Evidence of good practice or notable compliance | Recognised and shared as best practice |'
      },
      {
        heading: '8. Reporting and Follow-Up',
        body: '**8.1 Audit Report:**\nThe lead auditor completes the audit report within 5 working days, including:\n- Audit objectives, scope, and criteria\n- Audit team and auditees\n- Summary of findings (by classification)\n- Detail for each finding (evidence, clause reference, classification)\n- Conclusion and recommendation\n\n**8.2 Corrective Action Follow-Up:**\n1. NCRs raised for all major and minor nonconformities\n2. Auditee determines root cause and corrective action\n3. Quality Coordinator tracks actions to agreed deadlines\n4. Follow-up verification conducted to confirm effectiveness\n5. NCR closed only when corrective action is verified effective\n\n**8.3 Reporting to Management:**\nAudit results are a required input to Management Review (Clause 9.3).'
      },
    ],
  },

  'corrective-action-proc': {
    title: 'Corrective Action & NCR Procedure',
    docNumber: 'IG-{{CODE}}-SOP-003',
    revision: '01',
    sections: [
      {
        heading: '1. Purpose',
        body: 'This procedure defines the process for identifying, documenting, investigating, and resolving nonconformities (NCs) and implementing corrective actions to prevent recurrence, in accordance with ISO 9001:2015 Clause 10.2.'
      },
      {
        heading: '2. Scope',
        body: 'This procedure applies to nonconformities arising from:\n- Internal audits\n- External audits (certification/surveillance)\n- Customer complaints\n- Process failures and product/service nonconformities\n- Supplier nonconformities\n- Management review actions\n- Regulatory non-compliance\n- Employee observations and near-misses'
      },
      {
        heading: '3. Definitions',
        body: '| Term | Definition |\n|------|-----------|\n| **Nonconformity (NC)** | Non-fulfilment of a requirement |\n| **Correction** | Action to eliminate a detected nonconformity (immediate fix) |\n| **Corrective Action** | Action to eliminate the cause of a nonconformity to prevent recurrence |\n| **Root Cause** | The fundamental reason why the nonconformity occurred |\n| **NCR** | Nonconformity Report — formal documented record of the NC and its resolution |'
      },
      {
        heading: '4. NCR Process Flow',
        body: '**Step 1: Identification & Reporting**\nAnyone can raise an NCR. The initiator completes the NCR form with:\n- Description of the nonconformity\n- Where and when it was identified\n- Clause/requirement not met\n- Immediate containment action taken (if applicable)\n\n**Step 2: Review & Assignment**\nQuality Coordinator reviews, assigns NCR number (IG-{{CODE}}-NCR-XXX), classifies severity (Major/Minor), and assigns to responsible person.\n\n**Step 3: Containment / Correction**\nResponsible person takes immediate action to contain the nonconformity and prevent further impact. Record the correction taken.\n\n**Step 4: Root Cause Analysis**\nResponsible person determines root cause using appropriate tools:\n- **5 Why Analysis** — Ask "Why?" repeatedly until fundamental cause is found\n- **Fishbone (Ishikawa) Diagram** — Categorise causes: Man, Machine, Method, Material, Measurement, Environment\n- **Fault Tree Analysis** — For complex or safety-related nonconformities\n\n**Step 5: Corrective Action**\nDefine and implement corrective action(s) to eliminate the root cause. Actions must be proportionate to the effects of the nonconformity.\n\n**Step 6: Verification of Effectiveness**\nAfter implementation, verify that the corrective action has been effective and the nonconformity has not recurred. Minimum verification period: 30 days.\n\n**Step 7: Closure**\nQuality Coordinator reviews evidence of effectiveness, closes NCR, and updates the NCR Register.'
      },
      {
        heading: '5. NCR Classification',
        body: '| Classification | Criteria | Corrective Action Deadline | Verification |\n|---------------|----------|--------------------------||--------------|\n| **Major** | Significant impact on product/service quality, customer satisfaction, or regulatory compliance | 30 calendar days | Required within 60 days |\n| **Minor** | Limited impact, isolated occurrence, no direct effect on product/service conformity | 60 calendar days | Required within 90 days |'
      },
      {
        heading: '6. Root Cause Analysis — 5 Why Example',
        body: '**Problem:** Customer received incorrect product.\n\n| Why # | Question | Answer |\n|-------|----------|--------|\n| 1 | Why was the wrong product shipped? | The packer used the wrong picking slip |\n| 2 | Why did the packer use the wrong picking slip? | Two orders were printed on the same page |\n| 3 | Why were two orders on the same page? | The printing system merged orders with similar references |\n| 4 | Why did the system merge orders? | The duplicate-check filter was disabled after a system update |\n| 5 | Why was it not re-enabled? | No post-update verification checklist exists |\n\n**Root Cause:** No post-update verification checklist for the order system.\n**Corrective Action:** Implement a mandatory post-update verification checklist for all IT system changes, including confirmation of all active filters and business rules.'
      },
      {
        heading: '7. Escalation',
        body: '| Condition | Escalation |\n|-----------|-----------|\n| NCR not addressed within deadline | Quality Coordinator escalates to Management Representative |\n| Repeat NCR (same root cause within 12 months) | Escalated to Management Review as systemic issue |\n| Customer-affecting NCR | Immediately notified to Management Representative + customer liaison |\n| Regulatory NCR | Immediately notified to Managing Director |'
      },
      {
        heading: '8. Records',
        body: 'All NCR records are maintained in ISOGuardian, including:\n- NCR report (description, classification, assignment)\n- Root cause analysis documentation\n- Corrective action plan and evidence of implementation\n- Verification of effectiveness\n- Closure sign-off\n\nNCR records are retained for a minimum of 5 years. NCR trend data is reported at Management Review.'
      },
    ],
  },

  'management-review-proc': {
    title: 'Management Review Procedure',
    docNumber: 'IG-{{CODE}}-SOP-005',
    revision: '01',
    sections: [
      {
        heading: '1. Purpose',
        body: 'This procedure defines the process for conducting management reviews of the {{COMPANY}} management system to ensure its continuing suitability, adequacy, effectiveness, and alignment with the strategic direction, in accordance with ISO 9001:2015 Clause 9.3.'
      },
      {
        heading: '2. Frequency and Attendance',
        body: '**Frequency:** Management reviews are conducted at least annually. Additional reviews may be called when significant changes occur.\n\n**Required Attendees:**\n| Role | Required/Optional |\n|------|------------------|\n| Managing Director | Required (Chair) |\n| Management Representative | Required |\n| Department Managers | Required |\n| Quality Coordinator | Required (Minutes) |\n| External Consultants | Optional (by invitation) |\n\nA quorum of at least the Managing Director and Management Representative is required.'
      },
      {
        heading: '3. Required Inputs (Agenda)',
        body: 'The following inputs must be prepared and presented at each management review:\n\n1. **Status of actions from previous management reviews**\n2. **Changes in external and internal issues** relevant to the QMS\n3. **Information on QMS performance and effectiveness:**\n   a. Customer satisfaction and feedback from interested parties\n   b. Extent to which quality objectives have been met\n   c. Process performance and conformity of products and services\n   d. Nonconformities and corrective actions\n   e. Monitoring and measurement results\n   f. Audit results (internal and external)\n   g. Supplier performance\n4. **Adequacy of resources**\n5. **Effectiveness of actions taken to address risks and opportunities** (Clause 6.1)\n6. **Opportunities for improvement**'
      },
      {
        heading: '4. Required Outputs (Decisions)',
        body: 'Management review outputs must include decisions and actions related to:\n\n1. **Opportunities for improvement** — specific improvement projects or initiatives\n2. **Any need for changes to the QMS** — policy changes, process changes, resource reallocation\n3. **Resource needs** — people, infrastructure, budget, training\n\nAll decisions and actions must have:\n- Clear description of the action\n- Assigned responsible person\n- Target completion date\n- Follow-up mechanism'
      },
      {
        heading: '5. Preparation',
        body: '**5.1 Before the Review:**\n1. Management Representative circulates agenda at least 10 working days before the meeting\n2. Department Managers prepare input data for their areas\n3. Quality Coordinator prepares:\n   - NCR summary and trends\n   - Audit results summary\n   - Customer satisfaction data\n   - Quality objectives scorecard\n   - Previous review action status\n\n**5.2 Data Presentation Format:**\nWhere possible, data should be presented as:\n- Trend charts (showing performance over time)\n- Dashboards (key metrics at a glance)\n- Pareto analysis (for NCRs, complaints, etc.)\n- RAG status (Red/Amber/Green) for objectives and actions'
      },
      {
        heading: '6. Conducting the Review',
        body: '1. Chair opens the meeting, confirms quorum, and approves agenda\n2. Each input item is presented and discussed in sequence\n3. Decisions are recorded against each agenda item\n4. Actions are assigned with responsible persons and due dates\n5. Chair summarises key decisions and closes the meeting\n6. Minutes distributed within 5 working days'
      },
      {
        heading: '7. Minutes Template',
        body: '| Field | Detail |\n|-------|--------|\n| Meeting Date | [Date] |\n| Attendees | [Names and roles] |\n| Apologies | [Names] |\n| Chair | [Name] |\n| Minutes By | [Name] |\n\n**Agenda Item Discussion:**\nFor each item:\n- Summary of presentation/data\n- Discussion points\n- Decision(s) made\n- Action(s) raised\n\n**Action Register:**\n| # | Action | Responsible | Due Date | Status |\n|---|--------|-------------|----------|--------|\n| 1 | [Action description] | [Name] | [Date] | Open |\n\nMinutes are stored in ISOGuardian under Management Reviews.'
      },
    ],
  },

  'env-management-proc': {
    title: 'Environmental Aspects & Impacts Procedure',
    docNumber: 'IG-{{CODE}}-SOP-ENV-001',
    revision: '01',
    sections: [
      {
        heading: '1. Purpose',
        body: 'This procedure defines the process for identifying environmental aspects, evaluating their associated impacts, and determining which are significant, in accordance with ISO 14001:2015 Clause 6.1.2. Significant aspects are managed through operational controls, objectives, and targets.'
      },
      {
        heading: '2. Definitions',
        body: '| Term | Definition |\n|------|-----------|\n| **Environmental Aspect** | Element of an organisation\'s activities, products, or services that interacts or can interact with the environment (e.g., emissions, waste, energy use) |\n| **Environmental Impact** | Change to the environment, whether adverse or beneficial, resulting from an aspect (e.g., air pollution, resource depletion, habitat improvement) |\n| **Significant Aspect** | An aspect that has or can have a significant environmental impact, determined through evaluation |\n| **Life Cycle Perspective** | Consideration of environmental aspects from raw material acquisition through end-of-life |'
      },
      {
        heading: '3. Identification of Aspects',
        body: '**3.1 When to Identify:**\n- During initial EMS implementation\n- When new activities, products, or services are introduced\n- When processes or operations change\n- After environmental incidents\n- At least annually during management review\n\n**3.2 What to Consider:**\nFor each activity, product, or service, consider:\n- Emissions to air (dust, fumes, gases, VOCs)\n- Releases to water (effluent, stormwater contamination)\n- Releases to land (spills, contamination)\n- Use of raw materials and natural resources\n- Energy use (electricity, fuel, gas)\n- Water consumption\n- Waste generation (hazardous and non-hazardous)\n- Noise and vibration\n- Visual impact\n- Effects on biodiversity\n\n**3.3 Conditions:**\nAspects must be identified under:\n- **Normal** operating conditions\n- **Abnormal** conditions (start-up, shutdown, maintenance)\n- **Emergency** conditions (spills, fires, equipment failure)'
      },
      {
        heading: '4. Significance Evaluation',
        body: 'Each aspect is evaluated using the following criteria:\n\n**Severity of Impact (S):**\n| Score | Description |\n|-------|-----------|\n| 1 | Negligible — no measurable impact |\n| 2 | Minor — localised, short-term, reversible |\n| 3 | Moderate — localised, medium-term impact |\n| 4 | Major — widespread or long-term impact |\n| 5 | Critical — irreversible, major environmental damage |\n\n**Frequency/Likelihood (F):**\n| Score | Description |\n|-------|-----------|\n| 1 | Rare — less than once per year |\n| 2 | Unlikely — once per year |\n| 3 | Possible — monthly |\n| 4 | Likely — weekly |\n| 5 | Almost certain — daily or continuous |\n\n**Regulatory/Legal Requirement (L):**\n| Score | Description |\n|-------|-----------|\n| 1 | No legal requirement |\n| 3 | General legal requirement exists |\n| 5 | Specific permit/licence condition or NEMA requirement |\n\n**Significance Score = S \u00d7 F + L**\n\n| Score Range | Significance | Action Required |\n|-------------|-------------|----------------|\n| \u226516 | **Highly Significant** | Operational controls + objectives + targets required |\n| 10\u201315 | **Significant** | Operational controls required |\n| 5\u20139 | **Moderate** | Monitor and review |\n| <5 | **Low** | No specific action, maintain awareness |'
      },
      {
        heading: '5. Environmental Aspects Register',
        body: 'Results are recorded in the Environmental Aspects Register (IG-{{CODE}}-REG-ENV-001):\n\n| Activity | Aspect | Impact | Condition | S | F | L | Score | Significance | Controls |\n|----------|--------|--------|-----------|---|---|---|-------|-------------|----------|\n| Workshop operations | Waste oil generation | Soil/water contamination | Normal | 4 | 4 | 5 | 21 | High | Licensed waste removal, drip trays |\n| Office operations | Electricity use | Resource depletion, GHG | Normal | 3 | 5 | 1 | 16 | High | Energy reduction targets |\n| Transport | Vehicle emissions | Air pollution | Normal | 3 | 5 | 3 | 18 | High | Vehicle maintenance, route optimisation |\n| Painting | VOC emissions | Air quality | Normal | 3 | 3 | 5 | 14 | Significant | Ventilation, PPE, permit compliance |\n| General | Municipal waste | Landfill | Normal | 2 | 5 | 1 | 11 | Significant | Recycling programme |\n\nThe register is reviewed at least annually and updated when changes occur.'
      },
      {
        heading: '6. South African Legal Context',
        body: 'Key South African environmental legislation to consider:\n- **NEMA** (National Environmental Management Act 107 of 1998)\n- **NEM:AQA** (Air Quality Act 39 of 2004)\n- **NEM:WA** (Waste Act 59 of 2008)\n- **NWA** (National Water Act 36 of 1998)\n- **MPRDA** (Mineral and Petroleum Resources Development Act) — if applicable\n- **Local municipal by-laws** for waste, water, noise\n\n**Compliance obligations** are maintained in the Legal Register and reviewed at management review.'
      },
    ],
  },

  'hazard-identification-proc': {
    title: 'Hazard Identification & Risk Assessment (HIRA) Procedure',
    docNumber: 'IG-{{CODE}}-SOP-OHS-001',
    revision: '01',
    sections: [
      {
        heading: '1. Purpose',
        body: 'This procedure defines the process for proactive and ongoing identification of hazards, assessment of OH&S risks, and determination of controls in the workplace, in accordance with ISO 45001:2018 Clause 6.1.2 and the South African Occupational Health and Safety Act (OHSA) 85 of 1993.'
      },
      {
        heading: '2. Scope',
        body: 'This procedure applies to:\n- All activities, processes, and work areas under {{COMPANY}}\'s control\n- Routine and non-routine activities\n- Activities of all persons (employees, contractors, visitors)\n- Design of new work areas, processes, and equipment\n- Workplace organisation, conditions, and social factors\n- Past incidents and potential emergency situations'
      },
      {
        heading: '3. Definitions',
        body: '| Term | Definition |\n|------|-----------|\n| **Hazard** | Source with potential to cause injury or ill health |\n| **Risk** | Effect of uncertainty, expressed as likelihood \u00d7 consequence |\n| **Risk Assessment** | Process of evaluating risk(s) arising from hazard(s) |\n| **HIRA** | Hazard Identification and Risk Assessment |\n| **Residual Risk** | Risk remaining after controls are applied |\n| **Hierarchy of Controls** | Ordered approach to risk reduction (elimination \u2192 PPE) |'
      },
      {
        heading: '4. Hazard Categories',
        body: 'When identifying hazards, consider the following categories:\n\n| Category | Examples |\n|----------|--------|\n| **Physical** | Noise, vibration, radiation, temperature extremes, lighting |\n| **Chemical** | Hazardous substances, dust, fumes, gases, solvents |\n| **Biological** | Bacteria, viruses, mould, allergens |\n| **Ergonomic** | Repetitive motion, manual handling, workstation design |\n| **Mechanical** | Moving parts, sharp edges, pressure systems, vehicles |\n| **Electrical** | Exposed wiring, faulty equipment, static electricity |\n| **Working at Height** | Ladders, scaffolding, roofwork, fall hazards |\n| **Fire** | Flammable materials, ignition sources, inadequate detection |\n| **Psychosocial** | Workload, violence, harassment, shift work, fatigue |\n| **Environmental** | Weather, flooding, ground conditions |'
      },
      {
        heading: '5. Risk Assessment Methodology',
        body: '**5.1 Risk Rating Matrix:**\n\n**Consequence (C):**\n| Score | Description | Examples |\n|-------|-----------|--------|\n| 1 | Insignificant | First aid, minor discomfort |\n| 2 | Minor | Medical treatment, restricted work |\n| 3 | Moderate | Lost time injury, temporary disability |\n| 4 | Major | Permanent disability, hospitalisation |\n| 5 | Catastrophic | Fatality, multiple casualties |\n\n**Likelihood (L):**\n| Score | Description |\n|-------|-----------|\n| 1 | Rare — only in exceptional circumstances |\n| 2 | Unlikely — could happen but not expected |\n| 3 | Possible — might happen at some time |\n| 4 | Likely — will probably happen |\n| 5 | Almost certain — expected to happen regularly |\n\n**Risk Score = C \u00d7 L**\n\n| Risk Score | Risk Level | Action Required |\n|-----------|-----------|----------------|\n| 20\u201325 | **Critical** | Stop work. Immediate action. Cannot proceed until risk is reduced |\n| 15\u201319 | **High** | Urgent controls required. Senior management attention |\n| 10\u201314 | **Medium** | Controls required. Plan actions within defined timeframe |\n| 5\u20139 | **Low** | Monitor. Controls may be applied for further reduction |\n| 1\u20134 | **Very Low** | Acceptable. Maintain existing controls |'
      },
      {
        heading: '6. Hierarchy of Controls',
        body: 'Controls must be applied in the following order of preference:\n\n| Priority | Control Type | Description | Example |\n|----------|-------------|-------------|--------|\n| 1 | **Elimination** | Remove the hazard entirely | Discontinue use of hazardous chemical |\n| 2 | **Substitution** | Replace with less hazardous alternative | Use water-based paint instead of solvent-based |\n| 3 | **Engineering Controls** | Isolate people from the hazard | Machine guarding, ventilation, barriers |\n| 4 | **Administrative Controls** | Change the way work is done | Procedures, training, job rotation, signage |\n| 5 | **PPE** | Protect the worker | Safety glasses, gloves, hard hats, harnesses |\n\n**Note:** PPE is always the last resort, not the first line of defence. Multiple controls may be applied in combination.'
      },
      {
        heading: '7. HIRA Register Format',
        body: '| Area | Activity | Hazard | Risk (C\u00d7L) | Existing Controls | Residual Risk | Additional Controls | Responsible | Due Date |\n|------|----------|--------|-----------|-------------------|--------------|-------------------|-------------|----------|\n| Workshop | Grinding | Flying particles, noise | 4\u00d74=16 (High) | Machine guard, ear plugs | 4\u00d72=8 (Low) | Safety glasses policy enforcement | Safety Officer | [Date] |\n| Office | Computer work | Ergonomic strain | 2\u00d74=8 (Low) | Adjustable chairs | 2\u00d72=4 (V.Low) | Ergonomic assessment | HR | [Date] |\n| Site | Working at height | Falls | 5\u00d73=15 (High) | Harnesses, training | 5\u00d71=5 (Low) | Fall arrest system, rescue plan | Site Manager | [Date] |'
      },
      {
        heading: '8. Review and Update',
        body: 'The HIRA must be reviewed and updated:\n- At least annually\n- After any incident, near-miss, or injury\n- When new equipment, processes, or materials are introduced\n- When workplace layout changes\n- When legislation changes\n- After risk control measures are implemented (to verify effectiveness)\n\nWorkers must be consulted and have the opportunity to participate in the hazard identification and risk assessment process (ISO 45001 Clause 5.4).'
      },
    ],
  },

  'ncr-form': {
    title: 'Nonconformity Report (NCR)',
    docNumber: 'IG-{{CODE}}-FRM-001',
    revision: '01',
    sections: [
      {
        heading: 'Section A: NCR Details',
        body: '| Field | Detail |\n|-------|--------|\n| **NCR Number** | IG-{{CODE}}-NCR-[XXX] |\n| **Date Raised** | {{DATE}} |\n| **Raised By** | {{PREPARED_BY}} |\n| **Department/Area** | [Department] |\n| **Source** | \u2610 Internal Audit  \u2610 External Audit  \u2610 Customer Complaint  \u2610 Process Failure  \u2610 Supplier  \u2610 Other: _______ |\n| **Classification** | \u2610 Major  \u2610 Minor |\n| **ISO Clause Reference** | [Clause number] |'
      },
      {
        heading: 'Section B: Description of Nonconformity',
        body: '**What was found (describe the nonconformity with objective evidence):**\n\n[Describe exactly what was observed, including specific details, evidence, dates, and quantities where applicable]\n\n**Requirement not met (standard clause, procedure, specification, or customer requirement):**\n\n[Reference the specific requirement that was not fulfilled]'
      },
      {
        heading: 'Section C: Immediate Containment / Correction',
        body: '**Immediate action taken to contain the nonconformity:**\n\n| Field | Detail |\n|-------|--------|\n| Action taken | [Describe containment/correction] |\n| Action by | [Name] |\n| Date | [Date] |\n| Product/service affected | [Describe what was affected] |\n| Customer notified? | \u2610 Yes  \u2610 No  \u2610 N/A |'
      },
      {
        heading: 'Section D: Root Cause Analysis',
        body: '**Method used:** \u2610 5 Why  \u2610 Fishbone  \u2610 Fault Tree  \u2610 Other: _______\n\n**Analysis:**\n\n| Why # | Question | Answer |\n|-------|----------|--------|\n| 1 | Why did this happen? | [Answer] |\n| 2 | Why? | [Answer] |\n| 3 | Why? | [Answer] |\n| 4 | Why? | [Answer] |\n| 5 | Why? | [Answer] |\n\n**Root Cause Statement:**\n[Clear statement of the fundamental root cause]\n\n| Analysed by | Date |\n|------------|------|\n| [Name] | [Date] |'
      },
      {
        heading: 'Section E: Corrective Action Plan',
        body: '| # | Corrective Action | Responsible | Target Date | Status |\n|---|------------------|-------------|-------------|--------|\n| 1 | [Action] | [Name] | [Date] | \u2610 Open  \u2610 In Progress  \u2610 Complete |\n| 2 | [Action] | [Name] | [Date] | \u2610 Open  \u2610 In Progress  \u2610 Complete |\n| 3 | [Action] | [Name] | [Date] | \u2610 Open  \u2610 In Progress  \u2610 Complete |\n\n**Similar risk elsewhere?** \u2610 Yes \u2192 [Where? Actions taken?]  \u2610 No\n\n**QMS changes required?** \u2610 Yes \u2192 [Which documents?]  \u2610 No'
      },
      {
        heading: 'Section F: Verification of Effectiveness',
        body: '| Field | Detail |\n|-------|--------|\n| **Verification date** | [Date — minimum 30 days after implementation] |\n| **Verified by** | [Name — must not be the person who implemented the action] |\n| **Evidence of effectiveness** | [Describe how effectiveness was confirmed] |\n| **Has the nonconformity recurred?** | \u2610 Yes \u2192 [Reopen / escalate]  \u2610 No |\n| **Corrective action effective?** | \u2610 Yes  \u2610 No \u2192 [Further action required] |\n\n**Signatures:**\n\n| Role | Name | Signature | Date |\n|------|------|-----------|------|\n| Closed by (Quality) | [Name] | _________ | [Date] |\n| Accepted by (Management) | [Name] | _________ | [Date] |'
      },
    ],
  },

  'audit-checklist': {
    title: 'Internal Audit Checklist — ISO 9001:2015',
    docNumber: 'IG-{{CODE}}-FRM-002',
    revision: '01',
    sections: [
      {
        heading: 'Audit Information',
        body: '| Field | Detail |\n|-------|--------|\n| Audit Number | IG-{{CODE}}-AUD-[XXX] |\n| Audit Date | {{DATE}} |\n| Lead Auditor | {{PREPARED_BY}} |\n| Audit Team | [Names] |\n| Scope | [Processes/clauses being audited] |\n| Auditee(s) | [Names and roles] |\n| Standard | ISO 9001:2015 |'
      },
      {
        heading: 'Clause 4: Context of the Organisation',
        body: '| # | Audit Question | Evidence to Review | Conformity | Finding |\n|---|---------------|-------------------|-----------|--------|\n| 4.1 | Has the organisation determined external and internal issues relevant to its purpose? | Context analysis document, SWOT, PESTLE | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 4.2 | Are interested parties and their requirements identified and monitored? | Interested parties register | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 4.3 | Is the scope of the QMS defined, documented, and available? | Quality Manual, scope statement | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 4.4 | Are QMS processes identified with inputs, outputs, sequence, and interactions? | Process map, turtle diagrams | \u2610 C  \u2610 NC  \u2610 OFI | |\n\n**C** = Conforming  **NC** = Nonconformity  **OFI** = Opportunity for Improvement'
      },
      {
        heading: 'Clause 5: Leadership',
        body: '| # | Audit Question | Evidence to Review | Conformity | Finding |\n|---|---------------|-------------------|-----------|--------|\n| 5.1.1 | Does top management demonstrate commitment to the QMS? | Interview, resource evidence, meeting minutes | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 5.1.2 | Is customer focus maintained (requirements determined, risks addressed)? | Customer feedback, complaint records | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 5.2 | Is the quality policy established, communicated, and available? | Policy document, display, awareness | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 5.3 | Are roles, responsibilities, and authorities assigned and communicated? | Org chart, job descriptions, interviews | \u2610 C  \u2610 NC  \u2610 OFI | |'
      },
      {
        heading: 'Clause 6: Planning',
        body: '| # | Audit Question | Evidence to Review | Conformity | Finding |\n|---|---------------|-------------------|-----------|--------|\n| 6.1 | Are risks and opportunities identified and actions taken? | Risk register, risk assessments | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 6.2 | Are quality objectives established (SMART) at relevant functions? | Objectives document, KPI tracking | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 6.3 | Are changes to the QMS planned and controlled? | Change records, management review minutes | \u2610 C  \u2610 NC  \u2610 OFI | |'
      },
      {
        heading: 'Clause 7: Support',
        body: '| # | Audit Question | Evidence to Review | Conformity | Finding |\n|---|---------------|-------------------|-----------|--------|\n| 7.1 | Are adequate resources provided? | Budget, staff levels, equipment | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 7.2 | Are persons competent (education, training, experience)? | Training records, competence matrix | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 7.3 | Are persons aware of QMS policy, objectives, and their contribution? | Interviews, induction records | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 7.4 | Are internal and external communications planned and effective? | Communication records, meeting minutes | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 7.5 | Is documented information controlled (creation, approval, distribution, access)? | Document register, version control | \u2610 C  \u2610 NC  \u2610 OFI | |'
      },
      {
        heading: 'Clause 8: Operation',
        body: '| # | Audit Question | Evidence to Review | Conformity | Finding |\n|---|---------------|-------------------|-----------|--------|\n| 8.1 | Is operational planning and control in place? | Process controls, work instructions | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 8.2 | Are customer requirements determined and reviewed before acceptance? | Quotations, orders, contract review | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 8.4 | Are external providers controlled and evaluated? | Approved supplier list, evaluations | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 8.5 | Is production/service provision controlled? | Process records, inspection records | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 8.6 | Are release activities completed before delivery? | Inspection/test records, release sign-off | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 8.7 | Are nonconforming outputs identified and controlled? | NCR records, segregation evidence | \u2610 C  \u2610 NC  \u2610 OFI | |'
      },
      {
        heading: 'Clause 9: Performance Evaluation',
        body: '| # | Audit Question | Evidence to Review | Conformity | Finding |\n|---|---------------|-------------------|-----------|--------|\n| 9.1 | Is monitoring, measurement, and analysis performed? | KPI data, trend analysis | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 9.1.2 | Is customer satisfaction monitored? | Surveys, feedback, complaint trends | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 9.2 | Are internal audits conducted per the programme? | Audit reports, programme, auditor qualifications | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 9.3 | Are management reviews conducted with all required inputs/outputs? | MR minutes, action tracking | \u2610 C  \u2610 NC  \u2610 OFI | |'
      },
      {
        heading: 'Clause 10: Improvement',
        body: '| # | Audit Question | Evidence to Review | Conformity | Finding |\n|---|---------------|-------------------|-----------|--------|\n| 10.1 | Are improvement opportunities determined and implemented? | Improvement projects, innovation records | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 10.2 | Are nonconformities addressed with root cause analysis and corrective action? | NCR register, root cause analysis, effectiveness verification | \u2610 C  \u2610 NC  \u2610 OFI | |\n| 10.3 | Is continual improvement of the QMS pursued? | Trend data, management review outputs | \u2610 C  \u2610 NC  \u2610 OFI | |'
      },
      {
        heading: 'Audit Summary',
        body: '| Category | Count |\n|----------|-------|\n| Conformities | [#] |\n| Major Nonconformities | [#] |\n| Minor Nonconformities | [#] |\n| Observations / OFIs | [#] |\n| Positive Findings | [#] |\n\n**Audit Conclusion:**\n[Overall assessment of QMS conformity and effectiveness]\n\n**Lead Auditor Signature:** _________________ Date: _________\n**Auditee Acknowledgement:** _________________ Date: _________'
      },
    ],
  },

  'training-record-form': {
    title: 'Training Record & Competence Matrix',
    docNumber: 'IG-{{CODE}}-FRM-003',
    revision: '01',
    sections: [
      {
        heading: 'Individual Training Record',
        body: '| Field | Detail |\n|-------|--------|\n| Employee Name | [Name] |\n| Employee Number | [Number] |\n| Department | [Department] |\n| Position | [Position] |\n| Date of Employment | [Date] |\n| Line Manager | [Name] |\n\n**Training History:**\n| Date | Training/Course | Provider | Duration | Certificate? | Effectiveness Review |\n|------|----------------|----------|----------|-------------|---------------------|\n| [Date] | Induction Training | Internal | 1 day | N/A | \u2610 Competent  \u2610 Needs follow-up |\n| [Date] | ISO 9001 Awareness | [Provider] | 2 hours | \u2610 Yes \u2610 No | \u2610 Competent  \u2610 Needs follow-up |\n| [Date] | [Course] | [Provider] | [Duration] | \u2610 Yes \u2610 No | \u2610 Competent  \u2610 Needs follow-up |'
      },
      {
        heading: 'Competence Matrix',
        body: '**Department:** [Department Name]\n**Date:** {{DATE}}\n**Prepared By:** {{PREPARED_BY}}\n\n**Competence Levels:**\n- **4** = Can train others (Expert)\n- **3** = Fully competent (Independent)\n- **2** = Competent with supervision\n- **1** = Awareness only / Under training\n- **0** = Not applicable / Not trained\n\n| Competence Area | Employee A | Employee B | Employee C | Employee D | Min. Required |\n|----------------|-----------|-----------|-----------|-----------|-------------|\n| QMS Awareness (ISO 9001) | [0-4] | [0-4] | [0-4] | [0-4] | 1 |\n| Document Control | [0-4] | [0-4] | [0-4] | [0-4] | 2 |\n| Internal Auditing | [0-4] | [0-4] | [0-4] | [0-4] | 3 |\n| NCR & Corrective Action | [0-4] | [0-4] | [0-4] | [0-4] | 2 |\n| Customer Service | [0-4] | [0-4] | [0-4] | [0-4] | 3 |\n| [Process-specific skill] | [0-4] | [0-4] | [0-4] | [0-4] | [Level] |\n| Health & Safety | [0-4] | [0-4] | [0-4] | [0-4] | 1 |\n| First Aid | [0-4] | [0-4] | [0-4] | [0-4] | 3 |\n| Fire Fighting | [0-4] | [0-4] | [0-4] | [0-4] | 2 |\n\n**Training Gaps Identified:**\n| Employee | Competence Gap | Training Required | Target Date | Priority |\n|----------|---------------|------------------|-------------|----------|\n| [Name] | [Gap] | [Training] | [Date] | \u2610 High  \u2610 Medium  \u2610 Low |'
      },
      {
        heading: 'Training Effectiveness Evaluation',
        body: '| Field | Detail |\n|-------|--------|\n| Employee | [Name] |\n| Training | [Course/training name] |\n| Date of Training | [Date] |\n| Evaluation Date | [Date — 30-90 days after training] |\n| Evaluated By | [Manager name] |\n\n**Evaluation Criteria:**\n| Criteria | Rating (1-5) | Comments |\n|----------|-------------|----------|\n| Can the employee demonstrate the new skills? | [1-5] | [Comment] |\n| Has job performance improved in this area? | [1-5] | [Comment] |\n| Can the employee explain the key concepts? | [1-5] | [Comment] |\n| Has the training objective been met? | [1-5] | [Comment] |\n\n**Overall Assessment:** \u2610 Competent  \u2610 Partially competent — further training required  \u2610 Not competent — retraining required\n\n**Manager Signature:** _________________ Date: _________'
      },
    ],
  },

  'supplier-eval-form': {
    title: 'Supplier Evaluation Form',
    docNumber: 'IG-{{CODE}}-FRM-004',
    revision: '01',
    sections: [
      {
        heading: 'Supplier Details',
        body: '| Field | Detail |\n|-------|--------|\n| Supplier Name | [Name] |\n| Contact Person | [Name] |\n| Phone / Email | [Contact details] |\n| Address | [Physical address] |\n| Products/Services Supplied | [Description] |\n| B-BBEE Level | [Level] |\n| ISO Certification(s) | \u2610 ISO 9001  \u2610 ISO 14001  \u2610 ISO 45001  \u2610 Other: _______ |\n| Evaluation Type | \u2610 Initial Evaluation  \u2610 Re-evaluation (Annual) |\n| Evaluation Date | {{DATE}} |\n| Evaluated By | {{PREPARED_BY}} |'
      },
      {
        heading: 'Evaluation Criteria',
        body: '**Scoring: 1 = Poor, 2 = Below Average, 3 = Acceptable, 4 = Good, 5 = Excellent**\n\n| # | Criteria | Weight | Score (1-5) | Weighted Score |\n|---|---------|--------|------------|---------------|\n| 1 | **Quality of Products/Services** — Conformity to specifications, defect rate, consistency | 30% | [1-5] | [Score \u00d7 0.30] |\n| 2 | **Delivery Performance** — On-time delivery, lead times, flexibility | 25% | [1-5] | [Score \u00d7 0.25] |\n| 3 | **Pricing & Value** — Competitiveness, price stability, total cost of ownership | 20% | [1-5] | [Score \u00d7 0.20] |\n| 4 | **Communication & Responsiveness** — Response time, problem resolution, account management | 10% | [1-5] | [Score \u00d7 0.10] |\n| 5 | **Compliance & Certification** — ISO certification, legal compliance, B-BBEE | 10% | [1-5] | [Score \u00d7 0.10] |\n| 6 | **Capacity & Capability** — Technical capability, backup capacity, innovation | 5% | [1-5] | [Score \u00d7 0.05] |\n| | **TOTAL WEIGHTED SCORE** | 100% | | **[Total]** |\n\n**Rating Scale:**\n| Score | Rating | Status |\n|-------|--------|--------|\n| 4.0 \u2013 5.0 | **Preferred Supplier** | Approved — preferred for orders |\n| 3.0 \u2013 3.9 | **Approved Supplier** | Approved — monitored |\n| 2.0 \u2013 2.9 | **Conditional** | Approved with conditions — improvement plan required |\n| Below 2.0 | **Not Approved** | Not recommended — find alternative |'
      },
      {
        heading: 'Evaluation Notes & Decision',
        body: '**Strengths:**\n[List supplier strengths observed during evaluation]\n\n**Weaknesses / Areas for Improvement:**\n[List areas where supplier needs to improve]\n\n**Conditions (if applicable):**\n[List any conditions for approval, e.g., "Must provide ISO 9001 certificate by Q3"]\n\n**Decision:** \u2610 Approved (Preferred)  \u2610 Approved  \u2610 Approved with Conditions  \u2610 Not Approved\n\n**Approved By:**\n| Role | Name | Signature | Date |\n|------|------|-----------|------|\n| Evaluator | [Name] | _________ | [Date] |\n| Purchasing Manager | [Name] | _________ | [Date] |\n| Management Representative | [Name] | _________ | [Date] |\n\n**Next Re-evaluation Date:** [12 months from evaluation date]'
      },
    ],
  },

  'risk-register': {
    title: 'Risk & Opportunity Register',
    docNumber: 'IG-{{CODE}}-REG-001',
    revision: '01',
    sections: [
      {
        heading: 'Register Information',
        body: '| Field | Detail |\n|-------|--------|\n| Company | {{COMPANY}} |\n| Document Number | IG-{{CODE}}-REG-001 |\n| Revision | 01 |\n| Effective Date | {{DATE}} |\n| Owner | [Management Representative] |\n| Review Frequency | Quarterly (minimum) |\n| Last Review | {{DATE}} |\n| Next Review | [3 months from effective date] |'
      },
      {
        heading: 'Risk Assessment Matrix',
        body: '**Likelihood:**\n| Score | Description | Frequency |\n|-------|-----------|----------|\n| 1 | Rare | Less than once in 5 years |\n| 2 | Unlikely | Once in 2-5 years |\n| 3 | Possible | Once per year |\n| 4 | Likely | Multiple times per year |\n| 5 | Almost Certain | Monthly or more |\n\n**Impact:**\n| Score | Quality | Financial | Reputation | Safety |\n|-------|---------|-----------|-----------|--------|\n| 1 | Minor defect | <R10,000 | No external impact | First aid |\n| 2 | Customer complaint | R10-50,000 | Local media | Medical treatment |\n| 3 | Product recall/rework | R50-250,000 | Industry awareness | Lost time injury |\n| 4 | Contract loss | R250K-1M | National media | Permanent disability |\n| 5 | Certification loss | >R1M | Regulatory action | Fatality |'
      },
      {
        heading: 'Risk Register',
        body: '| ID | Risk Description | Source | Category | L | I | Score | Level | Treatment | Owner | Status |\n|---|----------------|--------|----------|---|---|-------|-------|-----------|-------|--------|\n| R01 | Loss of key personnel with critical QMS knowledge | Internal | People | 3 | 4 | 12 | Medium | Cross-training programme, documented procedures | HR Manager | Open |\n| R02 | Supplier failure leading to production delays | External | Supply chain | 3 | 3 | 9 | Low | Dual sourcing for critical materials, approved supplier list | Purchasing | Open |\n| R03 | Customer requirements misunderstood | Process | Quality | 3 | 4 | 12 | Medium | Contract review procedure, customer sign-off | Sales Manager | Open |\n| R04 | Regulatory change affecting operations | External | Compliance | 2 | 4 | 8 | Low | Legal register, subscribe to regulatory updates | Management Rep | Open |\n| R05 | IT system failure / data loss | Internal | Technology | 2 | 5 | 10 | Medium | Backup system, cloud storage, disaster recovery plan | IT / Admin | Open |\n| R06 | [Add your risks] | | | | | | | | | |'
      },
      {
        heading: 'Opportunity Register',
        body: '| ID | Opportunity Description | Source | Category | Benefit | Feasibility | Priority | Action Plan | Owner | Status |\n|---|----------------------|--------|----------|---------|-------------|----------|------------|-------|--------|\n| O01 | Expand into new geographic market | Market analysis | Growth | High | Medium | High | Market research, pilot project | MD | Open |\n| O02 | Implement digital quality management system | Technology | Efficiency | High | High | High | Evaluate ISOGuardian platform, implement | Management Rep | In Progress |\n| O03 | Achieve ISO 14001 certification | Customer demand | Compliance | Medium | Medium | Medium | Gap analysis, implementation plan | Quality Manager | Open |\n| O04 | Develop employee suggestion scheme | Internal | Innovation | Medium | High | Medium | Design programme, launch communication | HR Manager | Open |\n| O05 | [Add your opportunities] | | | | | | | | |'
      },
      {
        heading: 'Risk Treatment Plan',
        body: 'For each risk scoring Medium or above, document:\n\n| Risk ID | Treatment Option | Specific Actions | Resources Required | Target Date | Residual Risk (L\u00d7I) | Review Date |\n|---------|-----------------|-----------------|-------------------|-------------|---------------------|------------|\n| R01 | Mitigate | 1. Create competence matrix 2. Cross-train for all critical roles 3. Document tacit knowledge | 2 days per role, training budget | [Date] | 2\u00d73=6 (Low) | [Date] |\n| R03 | Mitigate | 1. Enhance contract review checklist 2. Customer sign-off on specifications 3. Post-delivery feedback | Updated forms, 1 day training | [Date] | 2\u00d73=6 (Low) | [Date] |\n| R05 | Mitigate | 1. Automated daily backups 2. Cloud-based document management 3. Annual DR test | Cloud subscription, IT time | [Date] | 1\u00d74=4 (V.Low) | [Date] |\n\n**Treatment Options:**\n- **Avoid** — Eliminate the activity causing the risk\n- **Mitigate** — Reduce likelihood or impact through controls\n- **Transfer** — Share/transfer risk (insurance, outsourcing)\n- **Accept** — Accept the risk with monitoring (low risks only)'
      },
    ],
  },

  'env-aspects-register': {
    title: 'Environmental Aspects & Impacts Register',
    docNumber: 'IG-{{CODE}}-REG-ENV-001',
    revision: '01',
    sections: [
      {
        heading: 'Register Information',
        body: '| Field | Detail |\n|-------|--------|\n| Company | {{COMPANY}} |\n| Document Number | IG-{{CODE}}-REG-ENV-001 |\n| Standard | ISO 14001:2015 |\n| Revision | 01 |\n| Effective Date | {{DATE}} |\n| Reviewed By | {{PREPARED_BY}} |\n| Next Review | [12 months from effective date] |'
      },
      {
        heading: 'Aspects Register',
        body: '**Significance Criteria: S (Severity 1-5) \u00d7 F (Frequency 1-5) + L (Legal 1/3/5)**\n\n| Area/Activity | Aspect | Impact | Condition | S | F | L | Score | Sig. | Controls in Place | Objective/Target |\n|--------------|--------|--------|-----------|---|---|---|-------|------|------------------|----------------|\n| **Office Operations** | | | | | | | | | | |\n| General office | Electricity consumption | Resource depletion, GHG emissions | Normal | 3 | 5 | 1 | 16 | HIGH | Timer switches, LED lighting | Reduce by 5% YoY |\n| General office | Paper consumption | Resource depletion, waste | Normal | 2 | 5 | 1 | 11 | SIG | Duplex printing, digital documents | Reduce by 10% YoY |\n| General office | Municipal waste | Landfill burden | Normal | 2 | 5 | 3 | 13 | SIG | Recycling programme (paper, plastic, glass) | 50% diversion rate |\n| IT equipment | E-waste generation | Soil/water contamination | Abnormal | 4 | 1 | 5 | 9 | MOD | Licensed e-waste recycler | Zero to landfill |\n| **Workshop/Operations** | | | | | | | | | | |\n| Machinery | Waste oil/lubricants | Soil/water contamination | Normal | 4 | 4 | 5 | 21 | HIGH | Licensed waste removal, drip trays, bunding | Zero spills to ground |\n| Machinery | Noise emissions | Noise pollution, health effects | Normal | 3 | 4 | 3 | 15 | SIG | Hearing protection, noise barriers | Comply with SANS 10103 |\n| Painting/coating | VOC emissions | Air quality degradation | Normal | 3 | 3 | 5 | 14 | SIG | Ventilation, respirators, AEL compliance | Within permit limits |\n| Cleaning | Chemical use/disposal | Water/soil contamination | Normal | 3 | 4 | 3 | 15 | SIG | MSDS, spill kits, licensed disposal | Zero incidents |\n| **Transport** | | | | | | | | | | |\n| Vehicle fleet | Fuel consumption / CO\u2082 | Climate change, air pollution | Normal | 3 | 5 | 3 | 18 | HIGH | Vehicle maintenance, route optimisation | Reduce fuel by 5% YoY |\n| Vehicle fleet | Oil/fuel spill | Soil/water contamination | Emergency | 4 | 1 | 5 | 9 | MOD | Spill kits in vehicles, emergency procedure | Zero spills |\n| **Water** | | | | | | | | | | |\n| Facilities | Water consumption | Resource depletion | Normal | 2 | 5 | 3 | 13 | SIG | Low-flow fittings, leak repair programme | Reduce by 5% YoY |\n| Washbay | Contaminated effluent | Water pollution | Normal | 3 | 4 | 5 | 17 | HIGH | Oil-water separator, permit compliance | Within NWA limits |\n\n**SIG = Significant, MOD = Moderate, LOW = Low**'
      },
      {
        heading: 'Legal Register Summary',
        body: '| Legislation | Applicable Section | Aspect Affected | Compliance Status |\n|------------|-------------------|----------------|------------------|\n| NEMA (Act 107 of 1998) | S28 — Duty of care | All environmental aspects | \u2610 Compliant \u2610 Non-compliant |\n| NEM:WA (Act 59 of 2008) | Waste classification & disposal | Waste generation | \u2610 Compliant \u2610 Non-compliant |\n| NEM:AQA (Act 39 of 2004) | Listed activities, AELs | Air emissions | \u2610 Compliant \u2610 Non-compliant |\n| NWA (Act 36 of 1998) | Water use licence, effluent standards | Water consumption, effluent | \u2610 Compliant \u2610 Non-compliant |\n| OHSA (Act 85 of 1993) | HCS Regulations | Chemical handling | \u2610 Compliant \u2610 Non-compliant |\n| Municipal by-laws | Noise, trade effluent, waste | Various | \u2610 Compliant \u2610 Non-compliant |\n\nLegal compliance is reviewed at least annually and after any regulatory change.'
      },
    ],
  },

  'iso-9001-starter': {
    title: 'ISO 9001:2015 Complete Starter Pack',
    docNumber: 'IG-{{CODE}}-PACK-9001',
    revision: '01',
    sections: [
      {
        heading: 'Package Contents',
        body: 'This starter pack contains all the documentation you need to build a compliant ISO 9001:2015 Quality Management System:\n\n**Manuals (1):**\n1. Quality Management System Manual (Clauses 4\u201310)\n\n**Procedures (4):**\n2. Document Control Procedure (Clause 7.5)\n3. Internal Audit Procedure (Clause 9.2)\n4. Corrective Action & NCR Procedure (Clause 10.2)\n5. Management Review Procedure (Clause 9.3)\n\n**Forms (4):**\n6. Nonconformity Report (NCR) Form\n7. Internal Audit Checklist — ISO 9001:2015\n8. Training Record & Competence Matrix\n9. Supplier Evaluation Form\n\n**Registers (1):**\n10. Risk & Opportunity Register (Clause 6.1)\n\nAll documents are branded with your company name, logo, and document numbering convention. Download individually or as a complete package.'
      },
      {
        heading: 'Implementation Guide',
        body: '**Recommended implementation order:**\n\n| Phase | Duration | Documents | Activities |\n|-------|----------|-----------|----------|\n| **Phase 1: Foundation** | Weeks 1-2 | Quality Manual, Document Control Procedure | Define scope, establish document control, assign roles |\n| **Phase 2: Core Processes** | Weeks 3-6 | NCR Procedure, Risk Register, Supplier Evaluation | Map processes, identify risks, evaluate suppliers |\n| **Phase 3: Support Systems** | Weeks 7-8 | Training Records, Competence Matrix | Conduct training, build competence records |\n| **Phase 4: Check & Act** | Weeks 9-12 | Internal Audit Procedure, Audit Checklist, Management Review | Conduct first internal audit, hold management review |\n\n**Tips for Success:**\n- Start with what you already do — document existing processes first\n- Involve your team from day one — the QMS is everyone\'s responsibility\n- Don\'t overcomplicate it — the best QMS is one people actually use\n- Use ISOGuardian to manage your documents, NCRs, and audits digitally\n- Consider engaging an ISO consultant for gap analysis and audit preparation'
      },
    ],
  },
}
