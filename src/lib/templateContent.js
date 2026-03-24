// ISOGuardian Template Content — Dynamically imported (IP protected)
// This file is code-split by Vite and only loaded when a subscriber downloads
// NEVER import this statically in the main bundle

export const TEMPLATE_CONTENT = {
  'qms-manual': {
      title: 'Quality Management System Manual',
      docNumber: 'IG-{{CODE}}-QMS-001',
      revision: '01',
      sections: [
        {
          heading: '1. Introduction',
          body: `This Quality Management System (QMS) Manual defines the quality management system of {{COMPANY}} in accordance with ISO 9001:2015. It describes the scope, processes, and framework that govern how {{COMPANY}} consistently delivers products and services that meet customer and regulatory requirements.

This manual serves as the top-level document of the QMS and provides a roadmap to the supporting procedures, work instructions, forms, and records that make up the complete system.

**Document Control:**
| Detail | Value |
|--------|-------|
| Document Number | IG-{{CODE}}-QMS-001 |
| Revision | 01 |
| Effective Date | {{DATE}} |
| Prepared By | {{PREPARED_BY}} |
| Approved By | {{MR_NAME}} ({{MR_TITLE}}) |
| Next Review Date | [12 months from effective date] |`
        },
        {
          heading: '2. Company Profile',
          body: `**Organisation:** {{COMPANY}}

**Products/Services:** {{PRODUCTS_SERVICES}}

**Organisational Structure:**
{{COMPANY}} operates under a defined organisational structure with clear lines of authority and responsibility. {{MR_NAME}} ({{MR_TITLE}}) has been appointed to oversee the QMS and report on its performance to top management ({{MD_NAME}}, {{MD_TITLE}}).

**Key Interested Parties:**
| Interested Party | Needs & Expectations |
|-----------------|---------------------|
| Customers | Quality products/services, on-time delivery, responsive support |
| Employees | Safe working environment, training, fair compensation |
| Regulatory Bodies | Compliance with applicable laws and regulations |
| Suppliers | Clear requirements, timely payment, fair dealings |
| Shareholders/Owners | Profitability, growth, risk management |`
        },
        {
          heading: '3. Scope of the QMS',
          body: `The QMS of {{COMPANY}} applies to the following:

**Scope Statement:** {{QMS_SCOPE}}

**Applicability of ISO 9001:2015 Clauses:**
All clauses of ISO 9001:2015 are applicable unless otherwise justified below.

**Exclusions:** [If any clause is not applicable, justify here. Note: only Clause 8.3 (Design and Development) may be excluded if the organisation does not design products/services]

**Normative References:**
- ISO 9001:2015 — Quality management systems — Requirements
- ISO 9000:2015 — Quality management systems — Fundamentals and vocabulary`
        },
        {
          heading: '4. Context of the Organisation (Clause 4)',
          body: `**4.1 Understanding the Organisation and its Context**

{{COMPANY}} determines external and internal issues relevant to its purpose and strategic direction that affect its ability to achieve the intended results of the QMS.

**External Issues:**
- Market conditions and competition
- Regulatory and legal requirements (including South African legislation)
- Technological changes
- Economic factors
- Customer expectations and trends

**Internal Issues:**
- Organisational culture and values
- Staff competence and capacity
- Infrastructure and technology
- Financial resources
- Knowledge and intellectual property

**4.2 Understanding the Needs and Expectations of Interested Parties**

Refer to the Interested Parties table in Section 2. These are reviewed at each Management Review meeting.

**4.3 Determining the Scope of the QMS**

Refer to Section 3 of this manual.

**4.4 QMS and its Processes**

{{COMPANY}} has identified the following core processes:

| Process | Owner | Key Inputs | Key Outputs |
|---------|-------|-----------|-------------|
| Sales & Customer Requirements | {{MD_NAME}} | Customer enquiries, RFQs | Quotations, orders, contracts |
| Operations / Service Delivery | {{MD_NAME}} | Customer orders, specifications | Completed products/services |
| Purchasing & Supplier Management | {{QM_NAME}} | Purchase requirements | Approved suppliers, materials |
| Quality Control & Inspection | {{QM_NAME}} | Products/services, standards | Inspection records, release |
| Customer Feedback & Satisfaction | {{MR_NAME}} | Complaints, surveys | Corrective actions, improvements |

Process interactions are documented in the Process Interaction Map (separate document).

**System Statistics (auto-populated from ISOGuardian):**
- Controlled Documents: {{LIVE:DOCUMENT_COUNT}}
- Active Users: {{LIVE:USER_COUNT}}
- ISO 9001 Compliance Score: {{LIVE:COMPLIANCE_SCORE:ISO_9001}}
- Open NCRs: {{LIVE:NCR_OPEN_COUNT}}
- Completed Audits: {{LIVE:AUDIT_NUMBER}}`
        },
        {
          heading: '5. Leadership (Clause 5)',
          body: `**5.1 Leadership and Commitment**

Top management of {{COMPANY}} demonstrates leadership and commitment to the QMS by:
- Taking accountability for the effectiveness of the QMS
- Ensuring the quality policy and objectives are established and compatible with the strategic direction
- Ensuring integration of the QMS into business processes
- Promoting the use of the process approach and risk-based thinking
- Ensuring the resources needed for the QMS are available
- Communicating the importance of effective quality management
- Ensuring the QMS achieves its intended results
- Engaging, directing, and supporting persons to contribute to QMS effectiveness
- Promoting continual improvement

**5.1.2 Customer Focus**

Top management ensures that customer requirements and applicable statutory/regulatory requirements are determined, understood, and consistently met. Risks and opportunities that can affect product/service conformity are determined and addressed.

**5.2 Quality Policy**

The Quality Policy of {{COMPANY}}:

> *{{QUALITY_POLICY}}*

The Quality Policy is:
- Available as documented information
- Communicated and understood within the organisation
- Available to relevant interested parties
- Reviewed for continuing suitability at Management Review

**5.3 Organisational Roles, Responsibilities, and Authorities**

| Role | Person | QMS Responsibility |
|------|--------|-------------------|
| {{MD_TITLE}} | {{MD_NAME}} | Overall accountability for QMS, resource provision |
| {{MR_TITLE}} | {{MR_NAME}} | Day-to-day QMS management, reporting to top management |
| {{QM_TITLE}} | {{QM_NAME}} | Document control, audit coordination, NCR management |
| {{IAL_TITLE}} | {{IAL_NAME}} | Internal audit programme, auditor assignment |
| {{HR_TITLE}} | {{HR_NAME}} | Training, competence, and awareness programmes |
| All Employees | — | Follow documented procedures, report nonconformities |`
        },
        {
          heading: '6. Planning (Clause 6)',
          body: `**6.1 Actions to Address Risks and Opportunities**

{{COMPANY}} applies risk-based thinking throughout the QMS. Risks and opportunities are identified considering:
- The context issues (Clause 4.1)
- Interested party requirements (Clause 4.2)
- Process performance data
- Customer feedback and complaints
- Audit findings

Risks are assessed using the Risk Register ({{REF:risk-register}}) and managed according to the Risk Management Procedure.

**Risk Assessment Matrix:**
| Likelihood → | Rare (1) | Unlikely (2) | Possible (3) | Likely (4) | Almost Certain (5) |
|---|---|---|---|---|---|
| **Catastrophic (5)** | 5 | 10 | 15 | 20 | 25 |
| **Major (4)** | 4 | 8 | 12 | 16 | 20 |
| **Moderate (3)** | 3 | 6 | 9 | 12 | 15 |
| **Minor (2)** | 2 | 4 | 6 | 8 | 10 |
| **Insignificant (1)** | 1 | 2 | 3 | 4 | 5 |

**Risk Treatment:** Scores ≥12 require documented mitigation actions.

**6.2 Quality Objectives and Planning to Achieve Them**

Quality objectives are established at relevant functions, levels, and processes. Objectives are SMART (Specific, Measurable, Achievable, Relevant, Time-bound).

| Objective | Target | Responsible | Timeframe | Measurement |
|-----------|--------|-------------|-----------|-------------|
| Customer satisfaction | ≥85% satisfaction score | Quality Manager | Annual | Customer survey |
| On-time delivery | ≥95% | Operations Manager | Monthly | Delivery records |
| NCR reduction | 10% year-on-year | Quality Coordinator | Annual | NCR register |
| Internal audit compliance | 0 major findings | Management Rep | Per audit | Audit reports |

**6.3 Planning of Changes**

Changes to the QMS are planned and implemented in a controlled manner, considering:
- The purpose of the change and potential consequences
- The integrity of the QMS
- Availability of resources
- Allocation or reallocation of responsibilities`
        },
        {
          heading: '7. Support (Clause 7)',
          body: `**7.1 Resources**

{{COMPANY}} determines and provides the resources needed for the QMS, including:
- **People:** Sufficient competent personnel for all QMS processes
- **Infrastructure:** Buildings, equipment, transport, IT systems, and communication technology
- **Environment:** Suitable working conditions (temperature, lighting, cleanliness, noise)
- **Monitoring and Measuring Resources:** Calibrated equipment where applicable
- **Organisational Knowledge:** Lessons learned, industry knowledge, standards, regulations

**7.2 Competence**

{{COMPANY}} ensures persons doing work under its control are competent based on education, training, or experience. The competence process includes:
1. Determining required competencies for QMS-affecting roles
2. Ensuring persons are competent (education, training, experience)
3. Taking actions to acquire necessary competence (training, mentoring, reassignment)
4. Retaining documented information as evidence of competence (Training Register)

**7.3 Awareness**

All persons working under {{COMPANY}}'s control are aware of:
- The Quality Policy
- Relevant quality objectives
- Their contribution to the QMS effectiveness
- Implications of not conforming to QMS requirements

**7.4 Communication**

| What | When | With Whom | How |
|------|------|-----------|-----|
| Quality Policy | Induction + annually | All staff | Notice boards, email, induction |
| Quality Objectives | Quarterly | All staff | Team meetings, reports |
| QMS Changes | As needed | Affected staff | Email, meetings, memos |
| Customer Feedback | Monthly | Management + relevant staff | Management meetings |
| Audit Results | Per audit | Management + auditees | Audit reports, meetings |

**7.5 Documented Information**

The QMS documentation hierarchy:
1. **Level 1:** Quality Manual (this document)
2. **Level 2:** Procedures (how processes are managed)
3. **Level 3:** Work instructions (step-by-step task instructions)
4. **Level 4:** Forms, records, and supporting documents

Document control is managed per the Document Control Procedure ({{REF:doc-control-proc}}).`
        },
        {
          heading: '8. Operation (Clause 8)',
          body: `**8.1 Operational Planning and Control**

{{COMPANY}} plans, implements, and controls the processes needed to meet requirements for the provision of products and services. Planning includes:
- Determining requirements for products/services
- Establishing criteria for processes and acceptance of products/services
- Determining resources needed
- Implementing control of processes in accordance with criteria
- Retaining documented information to demonstrate conformity

**8.2 Requirements for Products and Services**

**8.2.1 Customer Communication:** {{COMPANY}} communicates with customers regarding product/service information, enquiries, contracts, changes, customer feedback (including complaints), and handling of customer property.

**8.2.2 Determining Requirements:** Requirements include those stated by the customer, those not stated but necessary for intended use, statutory and regulatory requirements, and any additional requirements determined by {{COMPANY}}.

**8.2.3 Review of Requirements:** Before committing to supply, {{COMPANY}} reviews the ability to meet requirements. This includes contract review for formal orders and quotation review for ad-hoc requests.

**8.4 Control of Externally Provided Processes, Products, and Services**

{{COMPANY}} ensures externally provided products/services conform to requirements through:
- Supplier evaluation and approval (Approved Supplier List)
- Incoming inspection where applicable
- Supplier performance monitoring
- Re-evaluation at planned intervals

Refer to the Supplier Evaluation Form ({{REF:supplier-eval-form}}).

**8.5 Production and Service Provision**

Production/service delivery is carried out under controlled conditions including:
- Documented information defining product/service characteristics and activities
- Availability of monitoring and measuring resources
- Implementation of monitoring and measurement activities
- Use of suitable infrastructure and environment
- Appointment of competent persons
- Validation of processes where output cannot be verified by subsequent monitoring
- Actions to prevent human error
- Implementation of release, delivery, and post-delivery activities

**8.6 Release of Products and Services**

Products and services are not released until planned arrangements have been satisfactorily completed, unless approved by a relevant authority and by the customer where applicable.

**8.7 Control of Nonconforming Outputs**

Nonconforming outputs are identified and controlled to prevent unintended use or delivery. Actions include correction, segregation, containment, return, or informing the customer. Refer to the NCR Procedure ({{REF:corrective-action-proc}}).`
        },
        {
          heading: '9. Performance Evaluation (Clause 9)',
          body: `**9.1 Monitoring, Measurement, Analysis, and Evaluation**

{{COMPANY}} determines:
- What needs to be monitored and measured
- Methods for monitoring, measurement, analysis, and evaluation
- When monitoring and measuring shall be performed
- When results shall be analysed and evaluated

**Customer Satisfaction:** Monitored through customer surveys, feedback forms, repeat business rates, complaints, and delivery performance.

**Analysis and Evaluation:** Data is analysed to evaluate conformity, customer satisfaction, QMS effectiveness, planning effectiveness, risk action effectiveness, supplier performance, and improvement needs.

**9.2 Internal Audit**

{{COMPANY}} conducts internal audits at planned intervals (minimum annually) to provide information on whether the QMS:
- Conforms to {{COMPANY}}'s own requirements and ISO 9001:2015 requirements
- Is effectively implemented and maintained

Audits are conducted per the Internal Audit Procedure ({{REF:internal-audit-proc}}). Auditors do not audit their own work. Results are reported to relevant management and recorded in the audit report.

**9.3 Management Review**

Top management reviews the QMS at planned intervals (minimum annually) considering:

**Inputs:**
- Status of actions from previous reviews
- Changes in external/internal issues
- QMS performance and effectiveness (customer satisfaction, objectives, process performance, nonconformities, audit results, supplier performance)
- Adequacy of resources
- Effectiveness of risk/opportunity actions
- Opportunities for improvement

**Outputs:**
- Improvement opportunities
- Need for QMS changes
- Resource needs

Management review records are maintained per the Management Review Procedure.`
        },
        {
          heading: '10. Improvement (Clause 10)',
          body: `**10.1 General**

{{COMPANY}} determines and selects opportunities for improvement and implements necessary actions to meet customer requirements and enhance satisfaction. This includes:
- Improving products and services
- Correcting, preventing, or reducing undesired effects
- Improving QMS performance and effectiveness

**10.2 Nonconformity and Corrective Action**

When a nonconformity occurs (including complaints), {{COMPANY}}:
1. Reacts to the nonconformity (takes action to control and correct it)
2. Evaluates the need for action to eliminate the cause(s)
3. Implements any action needed
4. Reviews the effectiveness of corrective action taken
5. Updates risks and opportunities if necessary
6. Makes changes to the QMS if necessary

Nonconformities are managed through the NCR process. Root cause analysis uses appropriate tools (5 Why, Fishbone, etc.).

Refer to the Corrective Action Procedure ({{REF:corrective-action-proc}}).

**10.3 Continual Improvement**

{{COMPANY}} continually improves the suitability, adequacy, and effectiveness of the QMS through:
- Management Review outcomes
- Internal audit findings
- Data analysis results
- Corrective action outcomes
- Customer feedback
- Employee suggestions
- Benchmarking and best practices

Improvement projects are tracked and their effectiveness verified at subsequent Management Reviews.`
        },
        {
          heading: 'Appendix A: Document Register',
          body: `| Doc Number | Title | Type | Rev |
|-----------|-------|------|-----|
| IG-{{CODE}}-QMS-001 | Quality Management System Manual | Manual | 01 |
| IG-{{CODE}}-SOP-001 | Document Control Procedure | Procedure | 01 |
| IG-{{CODE}}-SOP-002 | Internal Audit Procedure | Procedure | 01 |
| IG-{{CODE}}-SOP-003 | Corrective Action & NCR Procedure | Procedure | 01 |
| IG-{{CODE}}-SOP-004 | Purchasing & Supplier Management | Procedure | 01 |
| IG-{{CODE}}-SOP-005 | Management Review Procedure | Procedure | 01 |
| IG-{{CODE}}-SOP-006 | Training & Competence Procedure | Procedure | 01 |
| IG-{{CODE}}-SOP-007 | Customer Feedback Procedure | Procedure | 01 |
| IG-{{CODE}}-REG-001 | Risk Register | Register | 01 |
| IG-{{CODE}}-FRM-001 | NCR Report Form | Form | 01 |
| IG-{{CODE}}-FRM-002 | Internal Audit Checklist | Form | 01 |
| IG-{{CODE}}-FRM-003 | Training Record Form | Form | 01 |
| IG-{{CODE}}-FRM-004 | Supplier Evaluation Form | Form | 01 |
| IG-{{CODE}}-FRM-005 | Management Review Minutes | Form | 01 |`
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
          body: `This procedure defines the controls for the creation, review, approval, distribution, revision, and disposal of documented information within the {{COMPANY}} management system, in accordance with ISO 9001:2015 Clause 7.5.`
        },
        {
          heading: '2. Scope',
          body: `This procedure applies to all documented information required by the management system, including:
- Policies, manuals, and procedures
- Work instructions and standard operating procedures
- Forms, checklists, and templates
- Records and evidence of conformity
- External documents (legislation, standards, customer specifications)`
        },
        {
          heading: '3. Responsibilities',
          body: `| Role | Responsibility |
|------|---------------|
| {{MR_NAME}} ({{MR_TITLE}}) | Oversee document control system, approve Level 1 & 2 documents |
| {{DC_NAME}} ({{DC_TITLE}}) | Maintain document register, issue/withdraw documents, manage archive |
| Document Authors | Draft and revise documents according to this procedure |
| Department Managers | Approve department-level documents, ensure compliance |
| All Staff | Use current approved versions only, return obsolete copies |`
        },
        {
          heading: '4. Document Hierarchy',
          body: `| Level | Document Type | Approval Authority | Examples |
|-------|--------------|-------------------|----------|
| 1 | Policies & Manuals | Managing Director | Quality Manual, Quality Policy |
| 2 | Procedures | {{MR_TITLE}} | SOPs, department procedures |
| 3 | Work Instructions | Department Manager | Step-by-step task instructions |
| 4 | Forms & Records | Quality Coordinator | Checklists, logs, forms |`
        },
        {
          heading: '5. Document Numbering',
          body: `Documents are numbered using the following convention:

**Format:** IG-[Company Code]-[Type]-[Sequential Number]

| Type Code | Document Type |
|-----------|--------------|
| QMS | Quality Management System Manual |
| SOP | Standard Operating Procedure |
| WI | Work Instruction |
| FRM | Form |
| REG | Register |
| POL | Policy |
| PLN | Plan |

**Example:** IG-{{CODE}}-SOP-001 = Document Control Procedure`
        },
        {
          heading: '6. Document Creation and Approval',
          body: `**6.1 Creation:**
1. Author drafts document using the appropriate template
2. Document includes: title, number, revision, date, author, approver
3. Draft is reviewed by relevant stakeholders

**6.2 Review and Approval:**
1. Reviewer checks technical accuracy, clarity, and compliance
2. Approver signs off (physical or electronic signature)
3. Quality Coordinator registers document and assigns number
4. Document is distributed to relevant personnel

**6.3 Distribution:**
- Controlled copies are distributed via the Document Management System (ISOGuardian)
- Uncontrolled copies are marked "UNCONTROLLED" and are for reference only
- Electronic distribution is the preferred method`
        },
        {
          heading: '7. Document Revision',
          body: `**7.1 Revision Process:**
1. Change request submitted to Quality Coordinator
2. Author revises document, highlighting changes
3. Reviewer and Approver sign off on revised version
4. Quality Coordinator updates document register, revision number, and effective date
5. Previous version is archived (retained for a minimum of 3 years)
6. Revised document is distributed; obsolete copies are withdrawn

**7.2 Revision Tracking:**
| Rev | Date | Description of Change | Author | Approved |
|-----|------|--------------------|--------|----------|
| 00 | [Date] | Initial issue | [Name] | [Name] |
| 01 | [Date] | [Description] | [Name] | [Name] |

**7.3 Emergency Changes:**
In urgent situations, verbal approval from the Approver is acceptable, followed by formal documentation within 5 working days.`
        },
        {
          heading: '8. External Documents',
          body: `External documents (legislation, standards, customer specifications, supplier documentation) are:
- Identified and recorded in the External Document Register
- Reviewed for applicability when received or updated
- Distributed to relevant personnel
- Checked for currency at least annually`
        },
        {
          heading: '9. Record Retention',
          body: `| Record Type | Minimum Retention Period |
|-------------|------------------------|
| Quality records | 5 years |
| Training records | Duration of employment + 3 years |
| Audit reports | 5 years |
| Management review minutes | 5 years |
| NCR records | 5 years |
| Customer complaints | 5 years |
| Supplier evaluations | 3 years |
| Calibration records | Life of equipment + 1 year |

Records are stored securely in ISOGuardian with access restricted to authorised personnel. Backup and disaster recovery are managed by the platform.

**Current Controlled Document Register ({{LIVE:DOCUMENT_COUNT}} documents):**

{{LIVE:DOCUMENT_REGISTER}}`
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
          body: `This procedure establishes the process for planning, conducting, reporting, and following up on internal audits of the {{COMPANY}} management system, in accordance with ISO 9001:2015 Clause 9.2 and ISO 19011 guidelines.`
        },
        {
          heading: '2. Scope',
          body: `This procedure applies to all internal audits of the management system, including:
- Full system audits (all clauses/processes)
- Process audits (specific processes)
- Compliance audits (regulatory/legal requirements)
- Follow-up audits (verification of corrective actions)`
        },
        {
          heading: '3. Responsibilities',
          body: `| Role | Responsibility |
|------|---------------|
| {{MR_NAME}} ({{MR_TITLE}}) | Approve annual audit programme, assign lead auditor, review results |
| Lead Auditor | Plan audits, assign audit team, prepare audit plan and checklist, conduct opening/closing meetings |
| Internal Auditors | Conduct audit activities, gather evidence, document findings |
| Auditees | Provide access, information, and cooperation during audits |
| Quality Coordinator | Maintain audit records, track corrective actions to closure |`
        },
        {
          heading: '4. Auditor Competence',
          body: `Internal auditors must:
- Have completed internal auditor training (ISO 19011 or equivalent)
- Understand the relevant ISO standard requirements
- Be independent of the area being audited (auditors do not audit their own work)
- Demonstrate objectivity and impartiality

**Auditor Register:**
A register of qualified internal auditors is maintained, recording:
- Name, qualifications, and training
- Audit experience
- Date of last audit conducted`
        },
        {
          heading: '5. Annual Audit Programme',
          body: `**5.1 Planning:**
The {{MR_TITLE}} ({{MR_NAME}}) prepares an annual audit programme considering:
- Importance and status of processes
- Results of previous audits
- Changes to the organisation or management system
- Customer complaints and NCR trends
- Risk assessment outcomes

All processes/clauses must be audited at least once per year. Higher-risk areas may be audited more frequently.

**5.2 Audit Programme Format:**
| Quarter | Process/Clause | Lead Auditor | Status |
|---------|---------------|-------------|--------|
| Q1 | Operations (Clause 8) | [Name] | Planned |
| Q1 | Document Control (Clause 7.5) | [Name] | Planned |
| Q2 | Purchasing (Clause 8.4) | [Name] | Planned |
| Q2 | Customer Focus (Clause 5.1.2) | [Name] | Planned |
| Q3 | Internal Audit (Clause 9.2) | [Name] | Planned |
| Q3 | Competence (Clause 7.2) | [Name] | Planned |
| Q4 | Management Review (Clause 9.3) | [Name] | Planned |
| Q4 | Improvement (Clause 10) | [Name] | Planned |

**Qualified Internal Auditors:** {{LIVE:AUDITOR_LIST}}

**Upcoming Scheduled Audits:**

{{LIVE:AUDIT_SCHEDULE}}`
        },
        {
          heading: '6. Conducting the Audit',
          body: `**6.1 Preparation:**
1. Lead auditor prepares audit plan (scope, criteria, schedule, team)
2. Audit plan communicated to auditees at least 5 working days in advance
3. Audit checklist prepared based on standard requirements and process documentation

**6.2 Opening Meeting:**
- Confirm scope, objectives, and schedule
- Introduce audit team
- Confirm communication channels and logistics
- Address any concerns from auditees

**6.3 Audit Execution:**
- Collect evidence through interviews, observation, and document review
- Record findings against audit criteria
- Classify findings as per Section 7

**6.4 Closing Meeting:**
- Present findings to auditees and management
- Agree on corrective action timelines
- Thank auditees for their cooperation`
        },
        {
          heading: '7. Classification of Findings',
          body: `| Classification | Definition | Required Action |
|---------------|-----------|----------------|
| **Major Nonconformity** | Total absence or breakdown of a system requirement; systematic failure | Corrective action within 30 days; root cause analysis required |
| **Minor Nonconformity** | Isolated lapse or partial non-fulfilment of a requirement | Corrective action within 60 days |
| **Observation** | Not a nonconformity but a potential risk or area for improvement | Action recommended but not mandatory |
| **Opportunity for Improvement (OFI)** | Suggestion that could enhance system effectiveness | Considered at management discretion |
| **Positive Finding** | Evidence of good practice or notable compliance | Recognised and shared as best practice |`
        },
        {
          heading: '8. Reporting and Follow-Up',
          body: `**8.1 Audit Report:**
The lead auditor completes the audit report within 5 working days, including:
- Audit objectives, scope, and criteria
- Audit team and auditees
- Summary of findings (by classification)
- Detail for each finding (evidence, clause reference, classification)
- Conclusion and recommendation

**8.2 Corrective Action Follow-Up:**
1. NCRs raised for all major and minor nonconformities
2. Auditee determines root cause and corrective action
3. Quality Coordinator tracks actions to agreed deadlines
4. Follow-up verification conducted to confirm effectiveness
5. NCR closed only when corrective action is verified effective

**8.3 Reporting to Management:**
Audit results are a required input to Management Review (Clause 9.3).`
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
          body: `This procedure defines the process for identifying, documenting, investigating, and resolving nonconformities (NCs) and implementing corrective actions to prevent recurrence, in accordance with ISO 9001:2015 Clause 10.2.`
        },
        {
          heading: '2. Scope',
          body: `This procedure applies to nonconformities arising from:
- Internal audits
- External audits (certification/surveillance)
- Customer complaints
- Process failures and product/service nonconformities
- Supplier nonconformities
- Management review actions
- Regulatory non-compliance
- Employee observations and near-misses`
        },
        {
          heading: '3. Definitions',
          body: `| Term | Definition |
|------|-----------|
| **Nonconformity (NC)** | Non-fulfilment of a requirement |
| **Correction** | Action to eliminate a detected nonconformity (immediate fix) |
| **Corrective Action** | Action to eliminate the cause of a nonconformity to prevent recurrence |
| **Root Cause** | The fundamental reason why the nonconformity occurred |
| **NCR** | Nonconformity Report — formal documented record of the NC and its resolution |`
        },
        {
          heading: '4. NCR Process Flow',
          body: `**Step 1: Identification & Reporting**
Anyone can raise an NCR. The initiator completes the NCR form with:
- Description of the nonconformity
- Where and when it was identified
- Clause/requirement not met
- Immediate containment action taken (if applicable)

**Step 2: Review & Assignment**
Quality Coordinator reviews, assigns NCR number (IG-{{CODE}}-NCR-XXX), classifies severity (Major/Minor), and assigns to responsible person.

**Step 3: Containment / Correction**
Responsible person takes immediate action to contain the nonconformity and prevent further impact. Record the correction taken.

**Step 4: Root Cause Analysis**
Responsible person determines root cause using appropriate tools:
- **5 Why Analysis** — Ask "Why?" repeatedly until fundamental cause is found
- **Fishbone (Ishikawa) Diagram** — Categorise causes: Man, Machine, Method, Material, Measurement, Environment
- **Fault Tree Analysis** — For complex or safety-related nonconformities

**Step 5: Corrective Action**
Define and implement corrective action(s) to eliminate the root cause. Actions must be proportionate to the effects of the nonconformity.

**Step 6: Verification of Effectiveness**
After implementation, verify that the corrective action has been effective and the nonconformity has not recurred. Minimum verification period: 30 days.

**Step 7: Closure**
Quality Coordinator reviews evidence of effectiveness, closes NCR, and updates the NCR Register.`
        },
        {
          heading: '5. NCR Classification',
          body: `| Classification | Criteria | Corrective Action Deadline | Verification |
|---------------|----------|--------------------------|--------------|
| **Major** | Significant impact on product/service quality, customer satisfaction, or regulatory compliance | 30 calendar days | Required within 60 days |
| **Minor** | Limited impact, isolated occurrence, no direct effect on product/service conformity | 60 calendar days | Required within 90 days |`
        },
        {
          heading: '6. Root Cause Analysis — 5 Why Example',
          body: `**Problem:** Customer received incorrect product.

| Why # | Question | Answer |
|-------|----------|--------|
| 1 | Why was the wrong product shipped? | The packer used the wrong picking slip |
| 2 | Why did the packer use the wrong picking slip? | Two orders were printed on the same page |
| 3 | Why were two orders on the same page? | The printing system merged orders with similar references |
| 4 | Why did the system merge orders? | The duplicate-check filter was disabled after a system update |
| 5 | Why was it not re-enabled? | No post-update verification checklist exists |

**Root Cause:** No post-update verification checklist for the order system.
**Corrective Action:** Implement a mandatory post-update verification checklist for all IT system changes, including confirmation of all active filters and business rules.`
        },
        {
          heading: '7. Escalation',
          body: `| Condition | Escalation |
|-----------|-----------|
| NCR not addressed within deadline | {{QM_NAME}} escalates to {{MR_NAME}} |
| Repeat NCR (same root cause within 12 months) | Escalated to Management Review as systemic issue |
| Customer-affecting NCR | Immediately notified to {{MR_NAME}} + customer liaison |
| Regulatory NCR | Immediately notified to Managing Director |`
        },
        {
          heading: '8. Records',
          body: `All NCR records are maintained in ISOGuardian, including:
- NCR report (description, classification, assignment)
- Root cause analysis documentation
- Corrective action plan and evidence of implementation
- Verification of effectiveness
- Closure sign-off

NCR records are retained for a minimum of 5 years. NCR trend data is reported at Management Review.`
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
          body: `This procedure defines the process for conducting management reviews of the {{COMPANY}} management system to ensure its continuing suitability, adequacy, effectiveness, and alignment with the strategic direction, in accordance with ISO 9001:2015 Clause 9.3.`
        },
        {
          heading: '2. Frequency and Attendance',
          body: `**Frequency:** Management reviews are conducted at least annually. Additional reviews may be called when significant changes occur.

**Required Attendees:**
| Role | Required/Optional |
|------|------------------|
| Managing Director | Required (Chair) |
| {{MR_NAME}} ({{MR_TITLE}}) | Required |
| Department Managers | Required |
| Quality Coordinator | Required (Minutes) |
| External Consultants | Optional (by invitation) |

A quorum of at least the {{MD_TITLE}} ({{MD_NAME}}) and {{MR_TITLE}} ({{MR_NAME}}) is required.`
        },
        {
          heading: '3. Required Inputs (Agenda)',
          body: `The following inputs must be prepared and presented at each management review:

1. **Status of actions from previous management reviews**
2. **Changes in external and internal issues** relevant to the QMS
3. **Information on QMS performance and effectiveness:**
   a. Customer satisfaction and feedback from interested parties
   b. Extent to which quality objectives have been met
   c. Process performance and conformity of products and services
   d. Nonconformities and corrective actions
   e. Monitoring and measurement results
   f. Audit results (internal and external)
   g. Supplier performance
4. **Adequacy of resources**
5. **Effectiveness of actions taken to address risks and opportunities** (Clause 6.1)
6. **Opportunities for improvement**`
        },
        {
          heading: '4. Required Outputs (Decisions)',
          body: `Management review outputs must include decisions and actions related to:

1. **Opportunities for improvement** — specific improvement projects or initiatives
2. **Any need for changes to the QMS** — policy changes, process changes, resource reallocation
3. **Resource needs** — people, infrastructure, budget, training

All decisions and actions must have:
- Clear description of the action
- Assigned responsible person
- Target completion date
- Follow-up mechanism`
        },
        {
          heading: '5. Preparation',
          body: `**5.1 Before the Review:**
1. {{MR_TITLE}} circulates agenda at least 10 working days before the meeting
2. Department Managers prepare input data for their areas
3. Quality Coordinator prepares:
   - NCR summary and trends
   - Audit results summary
   - Customer satisfaction data
   - Quality objectives scorecard
   - Previous review action status

**5.2 Data Presentation Format:**
Where possible, data should be presented as:
- Trend charts (showing performance over time)
- Dashboards (key metrics at a glance)
- Pareto analysis (for NCRs, complaints, etc.)
- RAG status (Red/Amber/Green) for objectives and actions`
        },
        {
          heading: '6. Conducting the Review',
          body: `1. Chair opens the meeting, confirms quorum, and approves agenda
2. Each input item is presented and discussed in sequence
3. Decisions are recorded against each agenda item
4. Actions are assigned with responsible persons and due dates
5. Chair summarises key decisions and closes the meeting
6. Minutes distributed within 5 working days`
        },
        {
          heading: '7. Minutes Template',
          body: `| Field | Detail |
|-------|--------|
| Meeting Date | {{LIVE:REVIEW_DATE}} |
| Attendees | {{LIVE:REVIEW_ATTENDEES}} |
| Apologies | [Names] |
| Chair | [Name] |
| Minutes By | [Name] |

**Agenda Item Discussion:**
For each item:
- Summary of presentation/data
- Discussion points
- Decision(s) made
- Action(s) raised

**Action Register:**
| # | Action | Responsible | Due Date | Status |
|---|--------|-------------|----------|--------|
| 1 | [Action description] | [Name] | [Date] | Open |

Minutes are stored in ISOGuardian under Management Reviews.`
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
          body: `This procedure defines the process for identifying environmental aspects, evaluating their associated impacts, and determining which are significant, in accordance with ISO 14001:2015 Clause 6.1.2. Significant aspects are managed through operational controls, objectives, and targets.`
        },
        {
          heading: '2. Definitions',
          body: `| Term | Definition |
|------|-----------|
| **Environmental Aspect** | Element of an organisation's activities, products, or services that interacts or can interact with the environment (e.g., emissions, waste, energy use) |
| **Environmental Impact** | Change to the environment, whether adverse or beneficial, resulting from an aspect (e.g., air pollution, resource depletion, habitat improvement) |
| **Significant Aspect** | An aspect that has or can have a significant environmental impact, determined through evaluation |
| **Life Cycle Perspective** | Consideration of environmental aspects from raw material acquisition through end-of-life |`
        },
        {
          heading: '3. Identification of Aspects',
          body: `**3.1 When to Identify:**
- During initial EMS implementation
- When new activities, products, or services are introduced
- When processes or operations change
- After environmental incidents
- At least annually during management review

**3.2 What to Consider:**
For each activity, product, or service, consider:
- Emissions to air (dust, fumes, gases, VOCs)
- Releases to water (effluent, stormwater contamination)
- Releases to land (spills, contamination)
- Use of raw materials and natural resources
- Energy use (electricity, fuel, gas)
- Water consumption
- Waste generation (hazardous and non-hazardous)
- Noise and vibration
- Visual impact
- Effects on biodiversity

**3.3 Conditions:**
Aspects must be identified under:
- **Normal** operating conditions
- **Abnormal** conditions (start-up, shutdown, maintenance)
- **Emergency** conditions (spills, fires, equipment failure)`
        },
        {
          heading: '4. Significance Evaluation',
          body: `Each aspect is evaluated using the following criteria:

**Severity of Impact (S):**
| Score | Description |
|-------|-----------|
| 1 | Negligible — no measurable impact |
| 2 | Minor — localised, short-term, reversible |
| 3 | Moderate — localised, medium-term impact |
| 4 | Major — widespread or long-term impact |
| 5 | Critical — irreversible, major environmental damage |

**Frequency/Likelihood (F):**
| Score | Description |
|-------|-----------|
| 1 | Rare — less than once per year |
| 2 | Unlikely — once per year |
| 3 | Possible — monthly |
| 4 | Likely — weekly |
| 5 | Almost certain — daily or continuous |

**Regulatory/Legal Requirement (L):**
| Score | Description |
|-------|-----------|
| 1 | No legal requirement |
| 3 | General legal requirement exists |
| 5 | Specific permit/licence condition or NEMA requirement |

**Significance Score = S × F + L**

| Score Range | Significance | Action Required |
|-------------|-------------|----------------|
| ≥16 | **Highly Significant** | Operational controls + objectives + targets required |
| 10–15 | **Significant** | Operational controls required |
| 5–9 | **Moderate** | Monitor and review |
| <5 | **Low** | No specific action, maintain awareness |`
        },
        {
          heading: '5. Environmental Aspects Register',
          body: `Results are recorded in the Environmental Aspects Register (IG-{{CODE}}-REG-ENV-001):

| Activity | Aspect | Impact | Condition | S | F | L | Score | Significance | Controls |
|----------|--------|--------|-----------|---|---|---|-------|-------------|----------|
| Workshop operations | Waste oil generation | Soil/water contamination | Normal | 4 | 4 | 5 | 21 | High | Licensed waste removal, drip trays |
| Office operations | Electricity use | Resource depletion, GHG | Normal | 3 | 5 | 1 | 16 | High | Energy reduction targets |
| Transport | Vehicle emissions | Air pollution | Normal | 3 | 5 | 3 | 18 | High | Vehicle maintenance, route optimisation |
| Painting | VOC emissions | Air quality | Normal | 3 | 3 | 5 | 14 | Significant | Ventilation, PPE, permit compliance |
| General | Municipal waste | Landfill | Normal | 2 | 5 | 1 | 11 | Significant | Recycling programme |

The register is reviewed at least annually and updated when changes occur.`
        },
        {
          heading: '6. South African Legal Context',
          body: `Key South African environmental legislation to consider:
- **NEMA** (National Environmental Management Act 107 of 1998)
- **NEM:AQA** (Air Quality Act 39 of 2004)
- **NEM:WA** (Waste Act 59 of 2008)
- **NWA** (National Water Act 36 of 1998)
- **MPRDA** (Mineral and Petroleum Resources Development Act) — if applicable
- **Local municipal by-laws** for waste, water, noise

**Compliance obligations** are maintained in the Legal Register and reviewed at management review.`
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
          body: `This procedure defines the process for proactive and ongoing identification of hazards, assessment of OH&S risks, and determination of controls in the workplace, in accordance with ISO 45001:2018 Clause 6.1.2 and the South African Occupational Health and Safety Act (OHSA) 85 of 1993.`
        },
        {
          heading: '2. Scope',
          body: `This procedure applies to:
- All activities, processes, and work areas under {{COMPANY}}'s control
- Routine and non-routine activities
- Activities of all persons (employees, contractors, visitors)
- Design of new work areas, processes, and equipment
- Workplace organisation, conditions, and social factors
- Past incidents and potential emergency situations`
        },
        {
          heading: '3. Definitions',
          body: `| Term | Definition |
|------|-----------|
| **Hazard** | Source with potential to cause injury or ill health |
| **Risk** | Effect of uncertainty, expressed as likelihood × consequence |
| **Risk Assessment** | Process of evaluating risk(s) arising from hazard(s) |
| **HIRA** | Hazard Identification and Risk Assessment |
| **Residual Risk** | Risk remaining after controls are applied |
| **Hierarchy of Controls** | Ordered approach to risk reduction (elimination → PPE) |`
        },
        {
          heading: '4. Hazard Categories',
          body: `When identifying hazards, consider the following categories:

| Category | Examples |
|----------|---------|
| **Physical** | Noise, vibration, radiation, temperature extremes, lighting |
| **Chemical** | Hazardous substances, dust, fumes, gases, solvents |
| **Biological** | Bacteria, viruses, mould, allergens |
| **Ergonomic** | Repetitive motion, manual handling, workstation design |
| **Mechanical** | Moving parts, sharp edges, pressure systems, vehicles |
| **Electrical** | Exposed wiring, faulty equipment, static electricity |
| **Working at Height** | Ladders, scaffolding, roofwork, fall hazards |
| **Fire** | Flammable materials, ignition sources, inadequate detection |
| **Psychosocial** | Workload, violence, harassment, shift work, fatigue |
| **Environmental** | Weather, flooding, ground conditions |`
        },
        {
          heading: '5. Risk Assessment Methodology',
          body: `**5.1 Risk Rating Matrix:**

**Consequence (C):**
| Score | Description | Examples |
|-------|-----------|---------|
| 1 | Insignificant | First aid, minor discomfort |
| 2 | Minor | Medical treatment, restricted work |
| 3 | Moderate | Lost time injury, temporary disability |
| 4 | Major | Permanent disability, hospitalisation |
| 5 | Catastrophic | Fatality, multiple casualties |

**Likelihood (L):**
| Score | Description |
|-------|-----------|
| 1 | Rare — only in exceptional circumstances |
| 2 | Unlikely — could happen but not expected |
| 3 | Possible — might happen at some time |
| 4 | Likely — will probably happen |
| 5 | Almost certain — expected to happen regularly |

**Risk Score = C × L**

| Risk Score | Risk Level | Action Required |
|-----------|-----------|----------------|
| 20–25 | **Critical** | Stop work. Immediate action. Cannot proceed until risk is reduced |
| 15–19 | **High** | Urgent controls required. Senior management attention |
| 10–14 | **Medium** | Controls required. Plan actions within defined timeframe |
| 5–9 | **Low** | Monitor. Controls may be applied for further reduction |
| 1–4 | **Very Low** | Acceptable. Maintain existing controls |`
        },
        {
          heading: '6. Hierarchy of Controls',
          body: `Controls must be applied in the following order of preference:

| Priority | Control Type | Description | Example |
|----------|-------------|-------------|---------|
| 1 | **Elimination** | Remove the hazard entirely | Discontinue use of hazardous chemical |
| 2 | **Substitution** | Replace with less hazardous alternative | Use water-based paint instead of solvent-based |
| 3 | **Engineering Controls** | Isolate people from the hazard | Machine guarding, ventilation, barriers |
| 4 | **Administrative Controls** | Change the way work is done | Procedures, training, job rotation, signage |
| 5 | **PPE** | Protect the worker | Safety glasses, gloves, hard hats, harnesses |

**Note:** PPE is always the last resort, not the first line of defence. Multiple controls may be applied in combination.`
        },
        {
          heading: '7. HIRA Register Format',
          body: `| Area | Activity | Hazard | Risk (C×L) | Existing Controls | Residual Risk | Additional Controls | Responsible | Due Date |
|------|----------|--------|-----------|-------------------|--------------|-------------------|-------------|----------|
| Workshop | Grinding | Flying particles, noise | 4×4=16 (High) | Machine guard, ear plugs | 4×2=8 (Low) | Safety glasses policy enforcement | Safety Officer | [Date] |
| Office | Computer work | Ergonomic strain | 2×4=8 (Low) | Adjustable chairs | 2×2=4 (V.Low) | Ergonomic assessment | HR | [Date] |
| Site | Working at height | Falls | 5×3=15 (High) | Harnesses, training | 5×1=5 (Low) | Fall arrest system, rescue plan | Site Manager | [Date] |`
        },
        {
          heading: '8. Review and Update',
          body: `The HIRA must be reviewed and updated:
- At least annually
- After any incident, near-miss, or injury
- When new equipment, processes, or materials are introduced
- When workplace layout changes
- When legislation changes
- After risk control measures are implemented (to verify effectiveness)

Workers must be consulted and have the opportunity to participate in the hazard identification and risk assessment process (ISO 45001 Clause 5.4).`
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
          body: `| Field | Detail |
|-------|--------|
| **NCR Number** | IG-{{CODE}}-NCR-[XXX] |
| **Date Raised** | {{DATE}} |
| **Raised By** | {{PREPARED_BY}} |
| **Department/Area** | [Department] |
| **Source** | [ ] Internal Audit  [ ] External Audit  [ ] Customer Complaint  [ ] Process Failure  [ ] Supplier  [ ] Other: _______ |
| **Classification** | [ ] Major  [ ] Minor |
| **ISO Clause Reference** | [Clause number] |`
        },
        {
          heading: 'Section B: Description of Nonconformity',
          body: `**What was found (describe the nonconformity with objective evidence):**

[Describe exactly what was observed, including specific details, evidence, dates, and quantities where applicable]

**Requirement not met (standard clause, procedure, specification, or customer requirement):**

[Reference the specific requirement that was not fulfilled]`
        },
        {
          heading: 'Section C: Immediate Containment / Correction',
          body: `**Immediate action taken to contain the nonconformity:**

| Field | Detail |
|-------|--------|
| Action taken | [Describe containment/correction] |
| Action by | [Name] |
| Date | [Date] |
| Product/service affected | [Describe what was affected] |
| Customer notified? | [ ] Yes  [ ] No  [ ] N/A |`
        },
        {
          heading: 'Section D: Root Cause Analysis',
          body: `**Method used:** [ ] 5 Why  [ ] Fishbone  [ ] Fault Tree  [ ] Other: _______

**Analysis:**

| Why # | Question | Answer |
|-------|----------|--------|
| 1 | Why did this happen? | [Answer] |
| 2 | Why? | [Answer] |
| 3 | Why? | [Answer] |
| 4 | Why? | [Answer] |
| 5 | Why? | [Answer] |

**Root Cause Statement:**
[Clear statement of the fundamental root cause]

| Analysed by | Date |
|------------|------|
| [Name] | [Date] |`
        },
        {
          heading: 'Section E: Corrective Action Plan',
          body: `| # | Corrective Action | Responsible | Target Date | Status |
|---|------------------|-------------|-------------|--------|
| 1 | [Action] | [Name] | [Date] | [ ] Open  [ ] In Progress  [ ] Complete |
| 2 | [Action] | [Name] | [Date] | [ ] Open  [ ] In Progress  [ ] Complete |
| 3 | [Action] | [Name] | [Date] | [ ] Open  [ ] In Progress  [ ] Complete |

**Similar risk elsewhere?** [ ] Yes → [Where? Actions taken?]  [ ] No

**QMS changes required?** [ ] Yes → [Which documents?]  [ ] No`
        },
        {
          heading: 'Section F: Verification of Effectiveness',
          body: `| Field | Detail |
|-------|--------|
| **Verification date** | [Date — minimum 30 days after implementation] |
| **Verified by** | [Name — must not be the person who implemented the action] |
| **Evidence of effectiveness** | [Describe how effectiveness was confirmed] |
| **Has the nonconformity recurred?** | [ ] Yes → [Reopen / escalate]  [ ] No |
| **Corrective action effective?** | [ ] Yes  [ ] No → [Further action required] |

**Signatures:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Closed by (Quality) | [Name] | _________ | [Date] |
| Accepted by (Management) | [Name] | _________ | [Date] |`
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
          body: `| Field | Detail |
|-------|--------|
| Audit Number | {{LIVE:AUDIT_NUMBER}} |
| Audit Date | {{DATE}} |
| Lead Auditor | {{PREPARED_BY}} |
| Audit Team | [Names] |
| Scope | [Processes/clauses being audited] |
| Auditee(s) | [Names and roles] |
| Standard | ISO 9001:2015 |`
        },
        {
          heading: 'Clause 4: Context of the Organisation',
          body: `| # | Audit Question | Evidence to Review | Conformity | Finding |
|---|---------------|-------------------|-----------|---------|
| 4.1 | Has the organisation determined external and internal issues relevant to its purpose? | Context analysis document, SWOT, PESTLE | {{LIVE:COMPLIANCE_STATUS:4.1}} | {{LIVE:COMPLIANCE_NOTES:4.1}} |
| 4.2 | Are interested parties and their requirements identified and monitored? | Interested parties register | {{LIVE:COMPLIANCE_STATUS:4.2}} | {{LIVE:COMPLIANCE_NOTES:4.2}} |
| 4.3 | Is the scope of the QMS defined, documented, and available? | Quality Manual, scope statement | {{LIVE:COMPLIANCE_STATUS:4.3}} | {{LIVE:COMPLIANCE_NOTES:4.3}} |
| 4.4 | Are QMS processes identified with inputs, outputs, sequence, and interactions? | Process map, turtle diagrams | {{LIVE:COMPLIANCE_STATUS:4.4}} | {{LIVE:COMPLIANCE_NOTES:4.4}} |

**C** = Conforming  **NC** = Nonconformity  **OFI** = Opportunity for Improvement`
        },
        {
          heading: 'Clause 5: Leadership',
          body: `| # | Audit Question | Evidence to Review | Conformity | Finding |
|---|---------------|-------------------|-----------|---------|
| 5.1.1 | Does top management demonstrate commitment to the QMS? | Interview, resource evidence, meeting minutes | {{LIVE:COMPLIANCE_STATUS:5.1}} | {{LIVE:COMPLIANCE_NOTES:5.1}} |
| 5.1.2 | Is customer focus maintained (requirements determined, risks addressed)? | Customer feedback, complaint records | {{LIVE:COMPLIANCE_STATUS:5.1}} | {{LIVE:COMPLIANCE_NOTES:5.1}} |
| 5.2 | Is the quality policy established, communicated, and available? | Policy document, display, awareness | {{LIVE:COMPLIANCE_STATUS:5.2}} | {{LIVE:COMPLIANCE_NOTES:5.2}} |
| 5.3 | Are roles, responsibilities, and authorities assigned and communicated? | Org chart, job descriptions, interviews | {{LIVE:COMPLIANCE_STATUS:5.3}} | {{LIVE:COMPLIANCE_NOTES:5.3}} |`
        },
        {
          heading: 'Clause 6: Planning',
          body: `| # | Audit Question | Evidence to Review | Conformity | Finding |
|---|---------------|-------------------|-----------|---------|
| 6.1 | Are risks and opportunities identified and actions taken? | Risk register, risk assessments | {{LIVE:COMPLIANCE_STATUS:6.1}} | {{LIVE:COMPLIANCE_NOTES:6.1}} |
| 6.2 | Are quality objectives established (SMART) at relevant functions? | Objectives document, KPI tracking | {{LIVE:COMPLIANCE_STATUS:6.2}} | {{LIVE:COMPLIANCE_NOTES:6.2}} |
| 6.3 | Are changes to the QMS planned and controlled? | Change records, management review minutes | {{LIVE:COMPLIANCE_STATUS:6.3}} | {{LIVE:COMPLIANCE_NOTES:6.3}} |`
        },
        {
          heading: 'Clause 7: Support',
          body: `| # | Audit Question | Evidence to Review | Conformity | Finding |
|---|---------------|-------------------|-----------|---------|
| 7.1 | Are adequate resources provided? | Budget, staff levels, equipment | {{LIVE:COMPLIANCE_STATUS:7.1}} | {{LIVE:COMPLIANCE_NOTES:7.1}} |
| 7.2 | Are persons competent (education, training, experience)? | Training records, competence matrix | {{LIVE:COMPLIANCE_STATUS:7.2}} | {{LIVE:COMPLIANCE_NOTES:7.2}} |
| 7.3 | Are persons aware of QMS policy, objectives, and their contribution? | Interviews, induction records | {{LIVE:COMPLIANCE_STATUS:7.3}} | {{LIVE:COMPLIANCE_NOTES:7.3}} |
| 7.4 | Are internal and external communications planned and effective? | Communication records, meeting minutes | {{LIVE:COMPLIANCE_STATUS:7.4}} | {{LIVE:COMPLIANCE_NOTES:7.4}} |
| 7.5 | Is documented information controlled (creation, approval, distribution, access)? | Document register, version control | {{LIVE:COMPLIANCE_STATUS:7.5}} | {{LIVE:COMPLIANCE_NOTES:7.5}} |`
        },
        {
          heading: 'Clause 8: Operation',
          body: `| # | Audit Question | Evidence to Review | Conformity | Finding |
|---|---------------|-------------------|-----------|---------|
| 8.1 | Is operational planning and control in place? | Process controls, work instructions | {{LIVE:COMPLIANCE_STATUS:8.1}} | {{LIVE:COMPLIANCE_NOTES:8.1}} |
| 8.2 | Are customer requirements determined and reviewed before acceptance? | Quotations, orders, contract review | {{LIVE:COMPLIANCE_STATUS:8.2}} | {{LIVE:COMPLIANCE_NOTES:8.2}} |
| 8.4 | Are external providers controlled and evaluated? | Approved supplier list, evaluations | {{LIVE:COMPLIANCE_STATUS:8.4}} | {{LIVE:COMPLIANCE_NOTES:8.4}} |
| 8.5 | Is production/service provision controlled? | Process records, inspection records | {{LIVE:COMPLIANCE_STATUS:8.5}} | {{LIVE:COMPLIANCE_NOTES:8.5}} |
| 8.6 | Are release activities completed before delivery? | Inspection/test records, release sign-off | {{LIVE:COMPLIANCE_STATUS:8.6}} | {{LIVE:COMPLIANCE_NOTES:8.6}} |
| 8.7 | Are nonconforming outputs identified and controlled? | NCR records, segregation evidence | {{LIVE:COMPLIANCE_STATUS:8.7}} | {{LIVE:COMPLIANCE_NOTES:8.7}} |`
        },
        {
          heading: 'Clause 9: Performance Evaluation',
          body: `| # | Audit Question | Evidence to Review | Conformity | Finding |
|---|---------------|-------------------|-----------|---------|
| 9.1 | Is monitoring, measurement, and analysis performed? | KPI data, trend analysis | {{LIVE:COMPLIANCE_STATUS:9.1}} | {{LIVE:COMPLIANCE_NOTES:9.1}} |
| 9.1.2 | Is customer satisfaction monitored? | Surveys, feedback, complaint trends | {{LIVE:COMPLIANCE_STATUS:9.1}} | {{LIVE:COMPLIANCE_NOTES:9.1}} |
| 9.2 | Are internal audits conducted per the programme? | Audit reports, programme, auditor qualifications | {{LIVE:COMPLIANCE_STATUS:9.2}} | {{LIVE:COMPLIANCE_NOTES:9.2}} |
| 9.3 | Are management reviews conducted with all required inputs/outputs? | MR minutes, action tracking | {{LIVE:COMPLIANCE_STATUS:9.3}} | {{LIVE:COMPLIANCE_NOTES:9.3}} |`
        },
        {
          heading: 'Clause 10: Improvement',
          body: `| # | Audit Question | Evidence to Review | Conformity | Finding |
|---|---------------|-------------------|-----------|---------|
| 10.1 | Are improvement opportunities determined and implemented? | Improvement projects, innovation records | {{LIVE:COMPLIANCE_STATUS:10.1}} | {{LIVE:COMPLIANCE_NOTES:10.1}} |
| 10.2 | Are nonconformities addressed with root cause analysis and corrective action? | NCR register, root cause analysis, effectiveness verification | {{LIVE:COMPLIANCE_STATUS:10.2}} | {{LIVE:COMPLIANCE_NOTES:10.2}} |
| 10.3 | Is continual improvement of the QMS pursued? | Trend data, management review outputs | {{LIVE:COMPLIANCE_STATUS:10.3}} | {{LIVE:COMPLIANCE_NOTES:10.3}} |`
        },
        {
          heading: 'Audit Summary',
          body: `| Category | Count |
|----------|-------|
| Conformities | {{LIVE:COMPLIANCE_SCORE:ISO_9001}} conforming |
| Open NCRs | {{LIVE:NCR_OPEN_COUNT}} |
| Overdue NCRs | {{LIVE:NCR_OVERDUE_COUNT}} |
| Closed NCRs | {{LIVE:NCR_CLOSED_COUNT}} |
| Total Documents | {{LIVE:DOCUMENT_COUNT}} |

**NCR Summary:** {{LIVE:NCR_SUMMARY}}

**Audit Conclusion:**
[Overall assessment of QMS conformity and effectiveness]

**Lead Auditor Signature:** _________________ Date: _________
**Auditee Acknowledgement:** _________________ Date: _________`
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
          body: `| Field | Detail |
|-------|--------|
| Employee Name | [Name] |
| Employee Number | [Number] |
| Department | [Department] |
| Position | [Position] |
| Date of Employment | [Date] |
| Line Manager | [Name] |

**Training History:**
| Date | Training/Course | Provider | Duration | Certificate? | Effectiveness Review |
|------|----------------|----------|----------|-------------|---------------------|
| [Date] | Induction Training | Internal | 1 day | N/A | [ ] Competent  [ ] Needs follow-up |
| [Date] | ISO 9001 Awareness | [Provider] | 2 hours | [ ] Yes [ ] No | [ ] Competent  [ ] Needs follow-up |
| [Date] | [Course] | [Provider] | [Duration] | [ ] Yes [ ] No | [ ] Competent  [ ] Needs follow-up |`
        },
        {
          heading: 'Competence Matrix',
          body: `**Department:** [Department Name]
**Date:** {{DATE}}
**Prepared By:** {{PREPARED_BY}}

**Competence Levels:**
- **4** = Can train others (Expert)
- **3** = Fully competent (Independent)
- **2** = Competent with supervision
- **1** = Awareness only / Under training
- **0** = Not applicable / Not trained

**Company Personnel (from ISOGuardian):**

{{LIVE:USER_LIST}}

| Competence Area | Employee A | Employee B | Employee C | Employee D | Min. Required |
|----------------|-----------|-----------|-----------|-----------|--------------|
| QMS Awareness (ISO 9001) | [0-4] | [0-4] | [0-4] | [0-4] | 1 |
| Document Control | [0-4] | [0-4] | [0-4] | [0-4] | 2 |
| Internal Auditing | [0-4] | [0-4] | [0-4] | [0-4] | 3 |
| NCR & Corrective Action | [0-4] | [0-4] | [0-4] | [0-4] | 2 |
| Customer Service | [0-4] | [0-4] | [0-4] | [0-4] | 3 |
| [Process-specific skill] | [0-4] | [0-4] | [0-4] | [0-4] | [Level] |
| Health & Safety | [0-4] | [0-4] | [0-4] | [0-4] | 1 |
| First Aid | [0-4] | [0-4] | [0-4] | [0-4] | 3 |
| Fire Fighting | [0-4] | [0-4] | [0-4] | [0-4] | 2 |

**Training Gaps Identified:**
| Employee | Competence Gap | Training Required | Target Date | Priority |
|----------|---------------|------------------|-------------|----------|
| [Name] | [Gap] | [Training] | [Date] | [ ] High  [ ] Medium  [ ] Low |`
        },
        {
          heading: 'Training Effectiveness Evaluation',
          body: `| Field | Detail |
|-------|--------|
| Employee | [Name] |
| Training | [Course/training name] |
| Date of Training | [Date] |
| Evaluation Date | [Date — 30-90 days after training] |
| Evaluated By | [Manager name] |

**Evaluation Criteria:**
| Criteria | Rating (1-5) | Comments |
|----------|-------------|----------|
| Can the employee demonstrate the new skills? | [1-5] | [Comment] |
| Has job performance improved in this area? | [1-5] | [Comment] |
| Can the employee explain the key concepts? | [1-5] | [Comment] |
| Has the training objective been met? | [1-5] | [Comment] |

**Overall Assessment:** [ ] Competent  [ ] Partially competent — further training required  [ ] Not competent — retraining required

**Manager Signature:** _________________ Date: _________`
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
          body: `| Field | Detail |
|-------|--------|
| Supplier Name | [Name] |
| Contact Person | [Name] |
| Phone / Email | [Contact details] |
| Address | [Physical address] |
| Products/Services Supplied | [Description] |
| B-BBEE Level | [Level] |
| ISO Certification(s) | [ ] ISO 9001  [ ] ISO 14001  [ ] ISO 45001  [ ] Other: _______ |
| Evaluation Type | [ ] Initial Evaluation  [ ] Re-evaluation (Annual) |
| Evaluation Date | {{DATE}} |
| Evaluated By | {{PREPARED_BY}} |`
        },
        {
          heading: 'Evaluation Criteria',
          body: `**Scoring: 1 = Poor, 2 = Below Average, 3 = Acceptable, 4 = Good, 5 = Excellent**

| # | Criteria | Weight | Score (1-5) | Weighted Score |
|---|---------|--------|------------|---------------|
| 1 | **Quality of Products/Services** — Conformity to specifications, defect rate, consistency | 30% | [1-5] | [Score × 0.30] |
| 2 | **Delivery Performance** — On-time delivery, lead times, flexibility | 25% | [1-5] | [Score × 0.25] |
| 3 | **Pricing & Value** — Competitiveness, price stability, total cost of ownership | 20% | [1-5] | [Score × 0.20] |
| 4 | **Communication & Responsiveness** — Response time, problem resolution, account management | 10% | [1-5] | [Score × 0.10] |
| 5 | **Compliance & Certification** — ISO certification, legal compliance, B-BBEE | 10% | [1-5] | [Score × 0.10] |
| 6 | **Capacity & Capability** — Technical capability, backup capacity, innovation | 5% | [1-5] | [Score × 0.05] |
| | **TOTAL WEIGHTED SCORE** | 100% | | **[Total]** |

**Rating Scale:**
| Score | Rating | Status |
|-------|--------|--------|
| 4.0 – 5.0 | **Preferred Supplier** | Approved — preferred for orders |
| 3.0 – 3.9 | **Approved Supplier** | Approved — monitored |
| 2.0 – 2.9 | **Conditional** | Approved with conditions — improvement plan required |
| Below 2.0 | **Not Approved** | Not recommended — find alternative |`
        },
        {
          heading: 'Evaluation Notes & Decision',
          body: `**Strengths:**
[List supplier strengths observed during evaluation]

**Weaknesses / Areas for Improvement:**
[List areas where supplier needs to improve]

**Conditions (if applicable):**
[List any conditions for approval, e.g., "Must provide ISO 9001 certificate by Q3"]

**Decision:** [ ] Approved (Preferred)  [ ] Approved  [ ] Approved with Conditions  [ ] Not Approved

**Approved By:**
| Role | Name | Signature | Date |
|------|------|-----------|------|
| Evaluator | [Name] | _________ | [Date] |
| Purchasing Manager | [Name] | _________ | [Date] |
| {{MR_TITLE}} | {{MR_NAME}} | _________ | [Date] |

**Next Re-evaluation Date:** [12 months from evaluation date]`
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
          body: `| Field | Detail |
|-------|--------|
| Company | {{COMPANY}} |
| Document Number | IG-{{CODE}}-REG-001 |
| Revision | 01 |
| Effective Date | {{DATE}} |
| Owner | {{MR_NAME}} ({{MR_TITLE}}) |
| Review Frequency | Quarterly (minimum) |
| Last Review | {{DATE}} |
| Next Review | [3 months from effective date] |`
        },
        {
          heading: 'Risk Assessment Matrix',
          body: `**Likelihood:**
| Score | Description | Frequency |
|-------|-----------|-----------|
| 1 | Rare | Less than once in 5 years |
| 2 | Unlikely | Once in 2-5 years |
| 3 | Possible | Once per year |
| 4 | Likely | Multiple times per year |
| 5 | Almost Certain | Monthly or more |

**Impact:**
| Score | Quality | Financial | Reputation | Safety |
|-------|---------|-----------|-----------|--------|
| 1 | Minor defect | <R10,000 | No external impact | First aid |
| 2 | Customer complaint | R10-50,000 | Local media | Medical treatment |
| 3 | Product recall/rework | R50-250,000 | Industry awareness | Lost time injury |
| 4 | Contract loss | R250K-1M | National media | Permanent disability |
| 5 | Certification loss | >R1M | Regulatory action | Fatality |`
        },
        {
          heading: 'Risk Register',
          body: `| ID | Risk Description | Source | Category | L | I | Score | Level | Treatment | Owner | Status |
|---|----------------|--------|----------|---|---|-------|-------|-----------|-------|--------|
| R01 | Loss of key personnel with critical QMS knowledge | Internal | People | 3 | 4 | 12 | Medium | Cross-training programme, documented procedures | HR Manager | Open |
| R02 | Supplier failure leading to production delays | External | Supply chain | 3 | 3 | 9 | Low | Dual sourcing for critical materials, approved supplier list | Purchasing | Open |
| R03 | Customer requirements misunderstood | Process | Quality | 3 | 4 | 12 | Medium | Contract review procedure, customer sign-off | Sales Manager | Open |
| R04 | Regulatory change affecting operations | External | Compliance | 2 | 4 | 8 | Low | Legal register, subscribe to regulatory updates | Management Rep | Open |
| R05 | IT system failure / data loss | Internal | Technology | 2 | 5 | 10 | Medium | Backup system, cloud storage, disaster recovery plan | IT / Admin | Open |
| R06 | [Add your risks] | | | | | | | | | |

**Auto-detected Compliance Gaps (from ISOGuardian):**

{{LIVE:RISK_GAPS}}`
        },
        {
          heading: 'Opportunity Register',
          body: `| ID | Opportunity Description | Source | Category | Benefit | Feasibility | Priority | Action Plan | Owner | Status |
|---|----------------------|--------|----------|---------|-------------|----------|------------|-------|--------|
| O01 | Expand into new geographic market | Market analysis | Growth | High | Medium | High | Market research, pilot project | MD | Open |
| O02 | Implement digital quality management system | Technology | Efficiency | High | High | High | Evaluate ISOGuardian platform, implement | Management Rep | In Progress |
| O03 | Achieve ISO 14001 certification | Customer demand | Compliance | Medium | Medium | Medium | Gap analysis, implementation plan | Quality Manager | Open |
| O04 | Develop employee suggestion scheme | Internal | Innovation | Medium | High | Medium | Design programme, launch communication | HR Manager | Open |
| O05 | [Add your opportunities] | | | | | | | | |`
        },
        {
          heading: 'Risk Treatment Plan',
          body: `For each risk scoring Medium or above, document:

| Risk ID | Treatment Option | Specific Actions | Resources Required | Target Date | Residual Risk (L×I) | Review Date |
|---------|-----------------|-----------------|-------------------|-------------|---------------------|------------|
| R01 | Mitigate | 1. Create competence matrix 2. Cross-train for all critical roles 3. Document tacit knowledge | 2 days per role, training budget | [Date] | 2×3=6 (Low) | [Date] |
| R03 | Mitigate | 1. Enhance contract review checklist 2. Customer sign-off on specifications 3. Post-delivery feedback | Updated forms, 1 day training | [Date] | 2×3=6 (Low) | [Date] |
| R05 | Mitigate | 1. Automated daily backups 2. Cloud-based document management 3. Annual DR test | Cloud subscription, IT time | [Date] | 1×4=4 (V.Low) | [Date] |

**Treatment Options:**
- **Avoid** — Eliminate the activity causing the risk
- **Mitigate** — Reduce likelihood or impact through controls
- **Transfer** — Share/transfer risk (insurance, outsourcing)
- **Accept** — Accept the risk with monitoring (low risks only)`
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
          body: `| Field | Detail |
|-------|--------|
| Company | {{COMPANY}} |
| Document Number | IG-{{CODE}}-REG-ENV-001 |
| Standard | ISO 14001:2015 |
| Revision | 01 |
| Effective Date | {{DATE}} |
| Reviewed By | {{PREPARED_BY}} |
| Next Review | [12 months from effective date] |`
        },
        {
          heading: 'Aspects Register',
          body: `**Significance Criteria: S (Severity 1-5) × F (Frequency 1-5) + L (Legal 1/3/5)**

| Area/Activity | Aspect | Impact | Condition | S | F | L | Score | Sig. | Controls in Place | Objective/Target |
|--------------|--------|--------|-----------|---|---|---|-------|------|------------------|-----------------|
| **Office Operations** | | | | | | | | | | |
| General office | Electricity consumption | Resource depletion, GHG emissions | Normal | 3 | 5 | 1 | 16 | HIGH | Timer switches, LED lighting | Reduce by 5% YoY |
| General office | Paper consumption | Resource depletion, waste | Normal | 2 | 5 | 1 | 11 | SIG | Duplex printing, digital documents | Reduce by 10% YoY |
| General office | Municipal waste | Landfill burden | Normal | 2 | 5 | 3 | 13 | SIG | Recycling programme (paper, plastic, glass) | 50% diversion rate |
| IT equipment | E-waste generation | Soil/water contamination | Abnormal | 4 | 1 | 5 | 9 | MOD | Licensed e-waste recycler | Zero to landfill |
| **Workshop/Operations** | | | | | | | | | | |
| Machinery | Waste oil/lubricants | Soil/water contamination | Normal | 4 | 4 | 5 | 21 | HIGH | Licensed waste removal, drip trays, bunding | Zero spills to ground |
| Machinery | Noise emissions | Noise pollution, health effects | Normal | 3 | 4 | 3 | 15 | SIG | Hearing protection, noise barriers | Comply with SANS 10103 |
| Painting/coating | VOC emissions | Air quality degradation | Normal | 3 | 3 | 5 | 14 | SIG | Ventilation, respirators, AEL compliance | Within permit limits |
| Cleaning | Chemical use/disposal | Water/soil contamination | Normal | 3 | 4 | 3 | 15 | SIG | MSDS, spill kits, licensed disposal | Zero incidents |
| **Transport** | | | | | | | | | | |
| Vehicle fleet | Fuel consumption / CO₂ | Climate change, air pollution | Normal | 3 | 5 | 3 | 18 | HIGH | Vehicle maintenance, route optimisation | Reduce fuel by 5% YoY |
| Vehicle fleet | Oil/fuel spill | Soil/water contamination | Emergency | 4 | 1 | 5 | 9 | MOD | Spill kits in vehicles, emergency procedure | Zero spills |
| **Water** | | | | | | | | | | |
| Facilities | Water consumption | Resource depletion | Normal | 2 | 5 | 3 | 13 | SIG | Low-flow fittings, leak repair programme | Reduce by 5% YoY |
| Washbay | Contaminated effluent | Water pollution | Normal | 3 | 4 | 5 | 17 | HIGH | Oil-water separator, permit compliance | Within NWA limits |

**SIG = Significant, MOD = Moderate, LOW = Low**`
        },
        {
          heading: 'Legal Register Summary',
          body: `| Legislation | Applicable Section | Aspect Affected | Compliance Status |
|------------|-------------------|----------------|------------------|
| NEMA (Act 107 of 1998) | S28 — Duty of care | All environmental aspects | [ ] Compliant [ ] Non-compliant |
| NEM:WA (Act 59 of 2008) | Waste classification & disposal | Waste generation | [ ] Compliant [ ] Non-compliant |
| NEM:AQA (Act 39 of 2004) | Listed activities, AELs | Air emissions | [ ] Compliant [ ] Non-compliant |
| NWA (Act 36 of 1998) | Water use licence, effluent standards | Water consumption, effluent | [ ] Compliant [ ] Non-compliant |
| OHSA (Act 85 of 1993) | HCS Regulations | Chemical handling | [ ] Compliant [ ] Non-compliant |
| Municipal by-laws | Noise, trade effluent, waste | Various | [ ] Compliant [ ] Non-compliant |

Legal compliance is reviewed at least annually and after any regulatory change.`
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
          body: `This starter pack contains all the documentation you need to build a compliant ISO 9001:2015 Quality Management System:

**Manuals (1):**
1. Quality Management System Manual (Clauses 4–10)

**Procedures (4):**
2. Document Control Procedure (Clause 7.5)
3. Internal Audit Procedure (Clause 9.2)
4. Corrective Action & NCR Procedure (Clause 10.2)
5. Management Review Procedure (Clause 9.3)

**Forms (4):**
6. Nonconformity Report (NCR) Form
7. Internal Audit Checklist — ISO 9001:2015
8. Training Record & Competence Matrix
9. Supplier Evaluation Form

**Registers (1):**
10. Risk & Opportunity Register (Clause 6.1)

All documents are branded with your company name, logo, and document numbering convention. Download individually or as a complete package.`
        },
        {
          heading: 'Implementation Guide',
          body: `**Recommended implementation order:**

| Phase | Duration | Documents | Activities |
|-------|----------|-----------|-----------|
| **Phase 1: Foundation** | Weeks 1-2 | Quality Manual, Document Control Procedure | Define scope, establish document control, assign roles |
| **Phase 2: Core Processes** | Weeks 3-6 | NCR Procedure, Risk Register, Supplier Evaluation | Map processes, identify risks, evaluate suppliers |
| **Phase 3: Support Systems** | Weeks 7-8 | Training Records, Competence Matrix | Conduct training, build competence records |
| **Phase 4: Check & Act** | Weeks 9-12 | Internal Audit Procedure, Audit Checklist, Management Review | Conduct first internal audit, hold management review |

**Tips for Success:**
- Start with what you already do — document existing processes first
- Involve your team from day one — the QMS is everyone's responsibility
- Don't overcomplicate it — the best QMS is one people actually use
- Use ISOGuardian to manage your documents, NCRs, and audits digitally
- Consider engaging an ISO consultant for gap analysis and audit preparation`
        },
      ],
    },

  // ═══════════════════════════════════════════════════════════
  // ISO 14001 TEMPLATES
  // ═══════════════════════════════════════════════════════════

  'env-policy': {
    title: 'Environmental Policy',
    docNumber: 'IG-{{CODE}}-POL-002',
    revision: '01',
    sections: [
      {
        heading: '1. Environmental Policy Statement',
        body: `**{{COMPANY}} — Environmental Policy**

{{COMPANY}} is committed to protecting the environment and preventing pollution in all our operations. We recognise that our activities, products, and services interact with the environment and we accept responsibility for managing these interactions responsibly.

**Our Commitments:**

{{COMPANY}}, through its leadership and all employees, commits to:

1. **Protection of the environment**, including prevention of pollution and reduction of our environmental footprint
2. **Compliance** with all applicable environmental legislation, regulations, and other requirements, including but not limited to NEMA, NEM:WA, NEM:AQA, and the National Water Act
3. **Continual improvement** of the Environmental Management System to enhance environmental performance
4. **Reduction** of waste generation, energy consumption, and water usage through efficient practices
5. **Awareness and competence** — ensuring all employees understand their environmental responsibilities
6. **Consultation** with interested parties on environmental matters affecting our operations

**Scope:**
This policy applies to all operations, sites, employees, contractors, and suppliers of {{COMPANY}}.

**Environmental Management System:**
This policy is implemented through our Environmental Management System, which conforms to ISO 14001:2015. The EMS is documented in the following procedures:
- Environmental Aspects & Impacts Procedure ({{REF:env-management-proc}})
- Waste Management Procedure ({{REF:waste-management-proc}})
- Emergency Preparedness & Response ({{REF:emergency-preparedness-env}})

**Compliance Score:** {{LIVE:COMPLIANCE_SCORE:ISO_14001}}

| Detail | Value |
|--------|-------|
| Document Number | IG-{{CODE}}-POL-002 |
| Prepared By | {{PREPARED_BY}} |
| Approved By | {{MD_NAME}}, {{MD_TITLE}} |
| Environmental Officer | {{EO_NAME}} |
| Date | {{DATE}} |`
      },
      {
        heading: '2. Communication & Review',
        body: `**Communication:**
This policy is:
- Communicated to all employees during induction and through awareness training
- Made available to interested parties on request
- Displayed in common areas at all operational sites
- Available on the company intranet

**Review:**
This policy is reviewed at least annually during management review, or when significant changes occur to:
- Legislation or regulatory requirements
- The nature, scale, or environmental impacts of our operations
- The context of the organisation

**Signed:**

Name: {{MD_NAME}}
Title: {{MD_TITLE}}
Date: {{DATE}}

___________________________
Signature`
      },
    ],
  },

  'env-legal-register': {
    title: 'Environmental Legal Register',
    docNumber: 'IG-{{CODE}}-REG-003',
    revision: '01',
    sections: [
      {
        heading: '1. Purpose',
        body: `This register identifies the environmental legal and other requirements applicable to {{COMPANY}}'s operations, in accordance with ISO 14001:2015 Clause 6.1.3. It is maintained by the Environmental Officer ({{EO_NAME}}) and reviewed at least annually.

**Related Documents:**
- Environmental Aspects & Impacts Procedure ({{REF:env-management-proc}})
- Environmental Aspects Register ({{REF:env-aspects-register}})`
      },
      {
        heading: '2. Applicable Environmental Legislation',
        body: `| Ref | Legislation | Key Requirements | Applicable Sections | Compliance Status | Review Date |
|-----|------------|-----------------|--------------------|--------------------|-------------|
| L-001 | **National Environmental Management Act (NEMA) 107 of 1998** | Duty of care, polluter pays, environmental impact assessment | Sections 2, 24, 28 | [EXAMPLE — verify compliance] | {{DATE}} |
| L-002 | **NEM: Air Quality Act (NEM:AQA) 39 of 2004** | Atmospheric emission licences, listed activities, minimum emission standards | Sections 21, 22, 37 | [EXAMPLE — verify compliance] | {{DATE}} |
| L-003 | **NEM: Waste Act (NEM:WA) 59 of 2008** | Waste classification, storage, transport, disposal, recycling obligations | Sections 16, 20, 21, 26 | [EXAMPLE — verify compliance] | {{DATE}} |
| L-004 | **National Water Act (NWA) 36 of 1998** | Water use licences, effluent discharge, protection of water resources | Sections 21, 39 | [EXAMPLE — verify compliance] | {{DATE}} |
| L-005 | **NEM: Biodiversity Act (NEM:BA) 10 of 2004** | Protected species, alien invasive species management | Sections 57, 65, 71 | [EXAMPLE — verify compliance] | {{DATE}} |
| L-006 | **Hazardous Substances Act 15 of 1973** | Control of hazardous chemical substances | Groups I-IV | [EXAMPLE — verify compliance] | {{DATE}} |
| L-007 | **Occupational Health & Safety Act 85 of 1993** | Environmental health in workplace | Sections 8, 13 | [EXAMPLE — verify compliance] | {{DATE}} |
| L-008 | **Municipal By-laws (Local)** | Noise, waste collection, water discharge, air quality | [Identify applicable municipality] | [EXAMPLE — verify compliance] | {{DATE}} |

> **[ACTION REQUIRED]:** Review each item above. Remove legislation that does not apply to your operations. Add any industry-specific legislation (e.g., mining, manufacturing, agriculture).`
      },
      {
        heading: '3. Other Requirements',
        body: `| Ref | Requirement | Source | Key Obligations | Status |
|-----|------------|--------|----------------|--------|
| O-001 | Environmental permits/licences | Provincial/local authority | Conditions of licence | [Verify] |
| O-002 | Industry codes of practice | Industry association | Voluntary commitments | [Verify] |
| O-003 | Client environmental requirements | Contract/SLA | Client-specific obligations | [Verify] |
| O-004 | ISO 14001:2015 | Certification body | Conformity to standard | Active |

**Evaluation of Compliance:**
Compliance is evaluated:
- At least annually during management review
- After any environmental incident
- When new legislation is enacted or amended
- During internal and external audits

**Responsible Person:** {{EO_NAME}} (Environmental Officer)
**Last Updated:** {{DATE}}`
      },
    ],
  },

  'waste-management-proc': {
    title: 'Waste Management Procedure',
    docNumber: 'IG-{{CODE}}-SOP-007',
    revision: '01',
    sections: [
      {
        heading: '1. Purpose & Scope',
        body: `This procedure defines the requirements for waste identification, classification, segregation, storage, transport, and disposal at {{COMPANY}}, in accordance with ISO 14001:2015 Clause 8.1 and the National Environmental Management: Waste Act 59 of 2008 (NEM:WA).

**Scope:** All waste generated by {{COMPANY}}'s operations, including hazardous and non-hazardous waste streams.

**Related Documents:**
- Environmental Aspects Register ({{REF:env-aspects-register}})
- Environmental Legal Register ({{REF:env-legal-register}})
- NCR Form ({{REF:ncr-form}})`
      },
      {
        heading: '2. Waste Classification',
        body: `All waste is classified per the NEM:WA Waste Classification Regulations (GNR 634):

**Waste Categories:**
| Category | Description | Examples | Storage Requirements |
|----------|-----------|---------|---------------------|
| **General Waste** | Non-hazardous, low risk | Paper, cardboard, food waste, wood | Covered bins, recycling stations |
| **Recyclable Waste** | Materials for recovery | Metals, plastics, glass, e-waste | Segregated bins, clean & dry |
| **Hazardous Waste** | Toxic, flammable, corrosive, reactive | Used oil, chemicals, batteries, asbestos | Bunded area, locked, labelled, SDS available |
| **Medical/Biological** | Infectious or pathological | First aid waste, sharps | Sharps containers, licensed removal |
| **Construction & Demolition** | Building materials | Rubble, soil, steel, timber | Designated skip, sorted on-site |

> **[EXAMPLE — adapt to your operations]:** The above categories are common across industries. Identify the specific waste streams generated by your operations and classify them accordingly.`
      },
      {
        heading: '3. Waste Handling & Segregation',
        body: `**3.1 Segregation at Source:**
All waste must be segregated at the point of generation into the appropriate containers:

| Bin Colour | Waste Type | Examples |
|-----------|-----------|---------|
| Green | General / organic | Food waste, garden waste |
| Blue | Paper & cardboard | Office paper, packaging |
| Yellow | Plastics & cans | Bottles, tins, plastic wrap |
| Red | Hazardous | Chemicals, contaminated materials |
| Black | Non-recyclable general | Mixed waste, contaminated packaging |

**3.2 Labelling:**
All waste containers must be clearly labelled with:
- Waste type and category
- Hazard symbols (where applicable)
- Responsible department

**3.3 Storage:**
- General waste: stored in designated waste area, collected at least weekly
- Hazardous waste: stored in bunded, locked, and ventilated area; maximum 90 days on-site
- Safety Data Sheets (SDS) available for all hazardous waste streams
- Spill kits available at all hazardous waste storage points`
      },
      {
        heading: '4. Waste Removal & Disposal',
        body: `**4.1 Licensed Waste Contractors:**
All waste removal contractors must:
- Hold a valid waste transport permit
- Provide safe disposal certificates / waste manifests
- Be evaluated per {{COMPANY}}'s supplier evaluation process

**4.2 Waste Manifest System:**
For hazardous waste:
- Complete a waste manifest for each collection
- Retain copies for minimum 5 years
- Verify that the disposal facility holds the correct licence

**4.3 Record Keeping:**
| Record | Retention Period | Responsible |
|--------|----------------|-------------|
| Waste manifests (hazardous) | 5 years | {{EO_NAME}} |
| Waste collection receipts | 3 years | {{EO_NAME}} |
| Contractor permits/licences | Current + 1 year | {{EO_NAME}} |
| Monthly waste volumes | 3 years | {{EO_NAME}} |

**4.4 Waste Reduction Targets:**
{{COMPANY}} targets a year-on-year reduction in waste to landfill. Current objectives are documented in the Environmental Objectives Register ({{REF:env-objectives-register}}).`
      },
      {
        heading: '5. Spill Response',
        body: `In the event of a spill:

1. **Contain** — use spill kit to prevent spread to drains, soil, or watercourses
2. **Report** — notify the Environmental Officer ({{EO_NAME}}) immediately
3. **Clean** — clean up using appropriate absorbent materials
4. **Dispose** — contaminated materials treated as hazardous waste
5. **Record** — complete an environmental incident form and raise an NCR ({{REF:ncr-form}})
6. **Notify** — if the spill is reportable under NEMA Section 30, notify the authorities within 24 hours

**Spill Kit Locations:**
[ACTION REQUIRED: List all spill kit locations at your site(s)]

**Emergency Contact:** {{EO_NAME}} | {{SO_NAME}}`
      },
    ],
  },

  'emergency-preparedness-env': {
    title: 'Environmental Emergency Preparedness & Response',
    docNumber: 'IG-{{CODE}}-SOP-008',
    revision: '01',
    sections: [
      {
        heading: '1. Purpose & Scope',
        body: `This procedure defines the process for identifying potential environmental emergency situations and planning response actions, in accordance with ISO 14001:2015 Clause 8.2.

**Scope:** All operations, sites, and activities of {{COMPANY}} where an emergency could result in environmental harm.

**Related Documents:**
- Environmental Aspects Register ({{REF:env-aspects-register}})
- Risk & Opportunity Register ({{REF:risk-register}})`
      },
      {
        heading: '2. Potential Environmental Emergencies',
        body: `The following potential emergencies have been identified. This list must be reviewed at least annually and after any environmental incident.

| Emergency Scenario | Potential Environmental Impact | Likelihood | Severity | Risk Rating |
|-------------------|-------------------------------|-----------|---------|-------------|
| Chemical/fuel spill | Soil and groundwater contamination | [EXAMPLE: 3] | [EXAMPLE: 4] | [EXAMPLE: High] |
| Fire | Air pollution (smoke, toxic fumes), water contamination (runoff) | [EXAMPLE: 2] | [EXAMPLE: 5] | [EXAMPLE: High] |
| Uncontrolled emissions | Air quality exceedance, community complaints | [EXAMPLE: 3] | [EXAMPLE: 3] | [EXAMPLE: Medium] |
| Flooding/stormwater | Contaminated runoff to watercourses | [EXAMPLE: 2] | [EXAMPLE: 4] | [EXAMPLE: Medium] |
| Equipment failure | Release of hazardous substances | [EXAMPLE: 2] | [EXAMPLE: 3] | [EXAMPLE: Medium] |
| Waste storage failure | Leakage of hazardous waste | [EXAMPLE: 2] | [EXAMPLE: 4] | [EXAMPLE: Medium] |

> **[ACTION REQUIRED]:** Assess each scenario for your specific operations. Add site-specific emergencies. Score likelihood and severity (1-5 scale).`
      },
      {
        heading: '3. Emergency Response Procedures',
        body: `**3.1 Chemical/Fuel Spill:**
1. Raise alarm, evacuate area if vapours present
2. Don appropriate PPE (chemical gloves, goggles, respirator if needed)
3. Contain spill using nearest spill kit — prevent entry to drains
4. Notify Environmental Officer ({{EO_NAME}}) and Safety Officer ({{SO_NAME}})
5. Clean up contaminated material and dispose as hazardous waste
6. If spill reaches a watercourse: notify DWS (Department of Water & Sanitation) per NEMA Section 30

**3.2 Fire with Environmental Impact:**
1. Activate fire alarm, evacuate per evacuation plan
2. Call emergency services (Fire: 10177 / Ambulance: 10177)
3. Once safe: contain firewater runoff to prevent contaminated water entering drains/rivers
4. Notify Environmental Officer for environmental impact assessment
5. Document all environmental impacts for regulatory reporting

**3.3 Uncontrolled Emissions:**
1. Shut down source of emission where safe to do
2. Evacuate downwind personnel
3. Notify Environmental Officer
4. Monitor air quality if instrumentation available
5. Report to Air Quality Officer (local municipality) if emission exceeds licence conditions`
      },
      {
        heading: '4. Emergency Resources & Contacts',
        body: `**Emergency Equipment:**
| Resource | Location | Quantity | Inspection Frequency |
|----------|----------|---------|---------------------|
| Spill kits (chemical) | [ACTION REQUIRED: specify] | [specify] | Monthly |
| Spill kits (oil) | [ACTION REQUIRED: specify] | [specify] | Monthly |
| Fire extinguishers | [ACTION REQUIRED: specify] | [specify] | Monthly visual, annual service |
| First aid kits | [ACTION REQUIRED: specify] | [specify] | Monthly |
| Emergency shower/eyewash | [ACTION REQUIRED: specify] | [specify] | Weekly test |

**Emergency Contacts:**
| Contact | Name | Phone |
|---------|------|-------|
| Environmental Officer | {{EO_NAME}} | [Phone] |
| Safety Officer | {{SO_NAME}} | [Phone] |
| Managing Director | {{MD_NAME}} | [Phone] |
| Fire Department | Emergency services | 10177 |
| Ambulance | Emergency services | 10177 |
| DWS Pollution Hotline | Department of Water & Sanitation | 0800 200 200 |
| SAPS | South African Police | 10111 |

**Post-Emergency Actions:**
1. Conduct environmental impact assessment
2. Raise NCR for the incident ({{REF:ncr-form}})
3. Determine root cause and implement corrective action
4. Regulatory notification within 24 hours if required (NEMA Section 30)
5. Review and update this procedure if necessary
6. Brief all affected employees`
      },
    ],
  },

  'env-objectives-register': {
    title: 'Environmental Objectives & Targets Register',
    docNumber: 'IG-{{CODE}}-REG-004',
    revision: '01',
    sections: [
      {
        heading: '1. Purpose',
        body: `This register documents the environmental objectives and targets established by {{COMPANY}} in accordance with ISO 14001:2015 Clause 6.2. Objectives are set to address significant environmental aspects, compliance obligations, and risks and opportunities.

**Related Documents:**
- Environmental Policy ({{REF:env-policy}})
- Environmental Aspects Register ({{REF:env-aspects-register}})
- Environmental Aspects & Impacts Procedure ({{REF:env-management-proc}})`
      },
      {
        heading: '2. Environmental Objectives & Targets',
        body: `| Obj ID | Objective | Target | KPI / Measure | Baseline | Deadline | Responsible | Status |
|--------|-----------|--------|---------------|----------|----------|-------------|--------|
| EO-001 | Reduce waste to landfill | 15% reduction year-on-year | kg waste to landfill / month | [EXAMPLE: establish baseline] | [End of year] | {{EO_NAME}} | In progress |
| EO-002 | Reduce electricity consumption | 10% reduction year-on-year | kWh / month | [EXAMPLE: establish baseline] | [End of year] | {{EO_NAME}} | In progress |
| EO-003 | Reduce water consumption | 10% reduction year-on-year | kL / month | [EXAMPLE: establish baseline] | [End of year] | {{EO_NAME}} | In progress |
| EO-004 | Increase recycling rate | Achieve 60% diversion from landfill | % waste recycled | [EXAMPLE: establish baseline] | [End of year] | {{EO_NAME}} | In progress |
| EO-005 | Maintain zero environmental incidents | Zero reportable incidents | Number of incidents | 0 | Ongoing | {{EO_NAME}} | Active |
| EO-006 | Achieve 100% legal compliance | No non-compliances at audit | Audit findings | N/A | Ongoing | {{EO_NAME}} | Active |

> **[ACTION REQUIRED]:** Replace examples with objectives specific to your operations. Set realistic baselines from your first 3 months of data collection.

**How Objectives Are Set:**
Objectives consider:
- Significant environmental aspects (from the Aspects Register)
- Legal and other requirements (from the Legal Register)
- Risks and opportunities
- Technological options and financial feasibility
- Views of interested parties`
      },
      {
        heading: '3. Action Plans',
        body: `For each objective, an action plan is documented:

| Action | Responsible | Resources Required | Timeline | Status |
|--------|-----------|-------------------|----------|--------|
| Install sub-metering for electricity | Facilities Manager | Electrician, meters (R[budget]) | [Date] | [Status] |
| Implement paper recycling programme | {{EO_NAME}} | Recycling bins, signage, contractor | [Date] | [Status] |
| Conduct water audit | {{EO_NAME}} | Plumber inspection | [Date] | [Status] |
| Environmental awareness training | {{EO_NAME}} + {{HR_NAME}} | Training materials, time allocation | [Date] | [Status] |

> **[ACTION REQUIRED]:** Complete action plans with specific resources, budgets, and timelines for your objectives.

**Review:**
Environmental objectives are reviewed:
- Quarterly by the Environmental Officer
- At each management review meeting
- After any significant environmental incident or change

**Current Environmental Compliance Score:** {{LIVE:COMPLIANCE_SCORE:ISO_14001}}
**Open Environmental NCRs:** {{LIVE:NCR_OPEN_COUNT}}`
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // ISO 45001 TEMPLATES
  // ═══════════════════════════════════════════════════════════

  'ohs-policy': {
    title: 'Occupational Health & Safety Policy',
    docNumber: 'IG-{{CODE}}-POL-003',
    revision: '01',
    sections: [
      {
        heading: '1. OH&S Policy Statement',
        body: `**{{COMPANY}} — Occupational Health & Safety Policy**

{{COMPANY}} is committed to providing a safe and healthy workplace for all workers, contractors, and visitors. We believe that all injuries, illnesses, and incidents are preventable, and we strive for zero harm in everything we do.

**Our Commitments:**

{{COMPANY}}, through its leadership and all workers, commits to:

1. **Elimination of hazards and reduction of OH&S risks** through the hierarchy of controls
2. **Safe and healthy working conditions** for the prevention of work-related injury and ill health
3. **Compliance** with all applicable OH&S legislation, including the Occupational Health and Safety Act 85 of 1993 (OHS Act), COIDA, and associated regulations
4. **Consultation and participation** of workers and worker representatives in OH&S matters
5. **Continual improvement** of the OH&S management system
6. **Competence** — ensuring all workers are trained and competent for their tasks
7. **Provision of adequate resources** for the effective implementation of the OH&S system

**Scope:**
This policy applies to all operations, sites, workers, contractors, visitors, and other persons under the control of {{COMPANY}}.

**OH&S Management System:**
This policy is implemented through our OH&S Management System, which conforms to ISO 45001:2018. Key documents include:
- HIRA Procedure ({{REF:hazard-identification-proc}})
- Incident Investigation Procedure ({{REF:incident-investigation-proc}})
- Emergency Response Plan ({{REF:emergency-response-ohs}})
- PPE Register ({{REF:ppe-register}})
- Legal Appointments Register ({{REF:legal-appointments-register}})

**Compliance Score:** {{LIVE:COMPLIANCE_SCORE:ISO_45001}}

| Detail | Value |
|--------|-------|
| Document Number | IG-{{CODE}}-POL-003 |
| Prepared By | {{PREPARED_BY}} |
| Approved By | {{MD_NAME}}, {{MD_TITLE}} |
| Safety Officer | {{SO_NAME}} |
| Date | {{DATE}} |`
      },
      {
        heading: '2. Worker Participation & Communication',
        body: `**Worker Participation:**
{{COMPANY}} ensures worker participation in OH&S through:
- Safety Health & Environment (SHE) Committee meetings (at least quarterly)
- Safety representative consultations per OHS Act Section 17
- Toolbox talks and safety briefings
- Incident reporting without fear of reprisal
- Hazard identification by all workers

**Communication:**
This policy is:
- Communicated to all workers during induction and through ongoing awareness
- Displayed prominently at all worksites
- Included in contractor induction packs
- Available to interested parties on request
- Communicated in languages understood by the workforce

**Review:**
This policy is reviewed at least annually during management review, or when:
- Significant incidents occur
- Legislation changes
- The nature of operations changes
- Worker or SHE Committee feedback warrants review

**Signed:**

Name: {{MD_NAME}}
Title: {{MD_TITLE}}
Date: {{DATE}}

___________________________
Signature`
      },
    ],
  },

  'incident-investigation-proc': {
    title: 'Incident Investigation Procedure',
    docNumber: 'IG-{{CODE}}-SOP-009',
    revision: '01',
    sections: [
      {
        heading: '1. Purpose & Scope',
        body: `This procedure defines the process for reporting, investigating, and learning from workplace incidents, near-misses, and occupational diseases, in accordance with ISO 45001:2018 Clause 10.2 and the OHS Act Section 24.

**Scope:** All workplace incidents including injuries, illnesses, property damage, near-misses, and environmental releases at {{COMPANY}}.

**Related Documents:**
- HIRA Procedure ({{REF:hazard-identification-proc}})
- NCR Form ({{REF:ncr-form}})
- Corrective Action Procedure ({{REF:corrective-action-proc}})`
      },
      {
        heading: '2. Definitions & Classification',
        body: `| Term | Definition |
|------|-----------|
| **Incident** | Event arising out of or during work that could or does result in injury, ill health, or damage |
| **Near-miss** | Event that did not result in injury or damage but had the potential to do so |
| **Lost Time Injury (LTI)** | Injury resulting in the worker being unable to perform their duties for one or more days |
| **Medical Treatment Case (MTC)** | Injury requiring treatment by a medical professional beyond first aid |
| **First Aid Case (FAC)** | Minor injury treated on-site with first aid |
| **Fatal** | Incident resulting in death of a worker |
| **Dangerous occurrence** | Near-miss or event requiring notification under the OHS Act General Safety Regulation 8 |

**Classification Matrix:**
| Category | Severity | Investigation Lead | Report To | Timeline |
|----------|---------|-------------------|-----------|----------|
| Fatal | Critical | External investigator + {{SO_NAME}} | DOL, SAPS, {{MD_NAME}} | Immediate |
| LTI | Major | {{SO_NAME}} | DOL (if >3 days), {{MD_NAME}} | Within 24 hours |
| MTC | Moderate | {{SO_NAME}} | {{MD_NAME}}, SHE Committee | Within 48 hours |
| FAC | Minor | Supervisor + {{SO_NAME}} | {{SO_NAME}} | Within 48 hours |
| Near-miss | Variable | Supervisor + {{SO_NAME}} | SHE Committee | Within 72 hours |
| Property damage | Variable | {{SO_NAME}} | {{MD_NAME}} | Within 48 hours |`
      },
      {
        heading: '3. Incident Reporting',
        body: `**Immediate Actions (all incidents):**
1. **Make the area safe** — prevent further injury or damage
2. **Administer first aid** — attend to injured person(s)
3. **Call emergency services** if required (Ambulance: 10177)
4. **Preserve the scene** — do not disturb evidence until investigation begins
5. **Notify supervisor** immediately
6. **Notify Safety Officer** ({{SO_NAME}}) within 1 hour

**Statutory Reporting (OHS Act):**
| Incident Type | Report To | Timeframe | Form |
|--------------|-----------|-----------|------|
| Fatal injury | DOL Inspector | Immediately (phone), then WCL.2 within 7 days | WCL.2 |
| Injury with >3 days absence | DOL Inspector | Within 7 days | WCL.2 |
| Dangerous occurrence | DOL Inspector | Immediately | Annexure 1 (GSR 8) |
| Occupational disease | DOL Inspector | When diagnosed | WCL.14 |

> DOL = Department of Labour (now Department of Employment and Labour)`
      },
      {
        heading: '4. Investigation Process',
        body: `**Step 1: Gather Information (within 24 hours)**
- Interview the injured person (if possible), witnesses, and supervisors
- Photograph the scene, equipment, and conditions
- Collect physical evidence (damaged equipment, substances)
- Review CCTV footage if available
- Obtain medical reports

**Step 2: Root Cause Analysis**
Use the **5 Whys** technique or **Fishbone (Ishikawa) Diagram**:

| Category | Possible Contributing Factors |
|----------|------------------------------|
| People | Training, experience, fatigue, behaviour, medical fitness |
| Equipment | Maintenance, guards, condition, design, suitability |
| Environment | Lighting, ventilation, noise, housekeeping, weather |
| Process | Procedures, risk assessment, supervision, communication |
| Management | Resources, leadership, culture, compliance monitoring |

**Step 3: Determine Corrective Actions**
Apply the **hierarchy of controls:**
1. **Elimination** — remove the hazard entirely
2. **Substitution** — replace with something less hazardous
3. **Engineering controls** — guards, barriers, ventilation
4. **Administrative controls** — procedures, training, signage
5. **PPE** — last resort, personal protective equipment

**Step 4: Record & Follow Up**
- Complete investigation report
- Raise NCR in ISOGuardian ({{REF:ncr-form}})
- Update HIRA if new hazards or changed risk ratings identified
- Communicate lessons learned to all affected workers
- Verify corrective action effectiveness within 30 days`
      },
      {
        heading: '5. Incident Register',
        body: `All incidents are logged in the Incident Register:

| Date | Time | Location | Description | Classification | Injured Person | Root Cause | Corrective Action | NCR No. | Status |
|------|------|----------|------------|---------------|---------------|-----------|-------------------|---------|--------|
| [EXAMPLE] | [Time] | Workshop | Worker struck by falling object | MTC | [Name] | Unsecured load on shelf | Secure all stored materials, shelf inspection | NCR-XX-2026-001 | Closed |
| [EXAMPLE] | [Time] | Yard | Forklift near-miss with pedestrian | Near-miss | N/A | No segregation of traffic routes | Install barriers, paint walkways | NCR-XX-2026-002 | Open |

> **[ACTION REQUIRED]:** Replace examples with actual incidents. All incidents must be logged regardless of severity.

**Current Open NCRs:** {{LIVE:NCR_OPEN_COUNT}}
**NCR Summary:** {{LIVE:NCR_SUMMARY}}`
      },
    ],
  },

  'safety-inspection-checklist': {
    title: 'Workplace Safety Inspection Checklist',
    docNumber: 'IG-{{CODE}}-FRM-005',
    revision: '01',
    sections: [
      {
        heading: '1. Inspection Details',
        body: `| Detail | Value |
|--------|-------|
| Inspection Date | {{DATE}} |
| Inspector Name | {{SO_NAME}} |
| Area / Department | ________________ |
| Accompanied By | ________________ |
| Inspection Type | [ ] Routine Monthly  [ ] Ad Hoc  [ ] Follow-Up |
| Weather Conditions | [ ] Clear  [ ] Rain  [ ] Wind  [ ] Extreme Heat |

**Related Documents:**
- HIRA Procedure ({{REF:hazard-identification-proc}})
- PPE Register ({{REF:ppe-register}})
- NCR Form ({{REF:ncr-form}})`
      },
      {
        heading: '2. Housekeeping & General',
        body: `| # | Item | C | NC | N/A | Comments |
|---|------|---|----|----|----------|
| 1.1 | Work areas clean and tidy | [ ] | [ ] | [ ] | |
| 1.2 | Walkways and exits clear and unobstructed | [ ] | [ ] | [ ] | |
| 1.3 | Floor surfaces clean, dry, non-slip | [ ] | [ ] | [ ] | |
| 1.4 | Waste bins available and not overflowing | [ ] | [ ] | [ ] | |
| 1.5 | Storage areas organised, materials stacked safely | [ ] | [ ] | [ ] | |
| 1.6 | Lighting adequate for tasks | [ ] | [ ] | [ ] | |
| 1.7 | Ventilation adequate | [ ] | [ ] | [ ] | |
| 1.8 | Temperature within acceptable range | [ ] | [ ] | [ ] | |
| 1.9 | No trip hazards (cables, materials, uneven surfaces) | [ ] | [ ] | [ ] | |
| 1.10 | Signage visible and in good condition | [ ] | [ ] | [ ] | |

*C = Compliant, NC = Non-Compliant, N/A = Not Applicable*`
      },
      {
        heading: '3. Fire Safety',
        body: `| # | Item | C | NC | N/A | Comments |
|---|------|---|----|----|----------|
| 2.1 | Fire extinguishers accessible and inspected (tag current) | [ ] | [ ] | [ ] | |
| 2.2 | Fire hose reels accessible and functional | [ ] | [ ] | [ ] | |
| 2.3 | Emergency exits clearly marked and illuminated | [ ] | [ ] | [ ] | |
| 2.4 | Fire escape routes clear and unobstructed | [ ] | [ ] | [ ] | |
| 2.5 | Fire alarm system tested and functional | [ ] | [ ] | [ ] | |
| 2.6 | Evacuation plan displayed | [ ] | [ ] | [ ] | |
| 2.7 | Assembly point clearly marked | [ ] | [ ] | [ ] | |
| 2.8 | No smoking in prohibited areas | [ ] | [ ] | [ ] | |
| 2.9 | Flammable materials stored correctly | [ ] | [ ] | [ ] | |
| 2.10 | Fire marshals appointed and trained | [ ] | [ ] | [ ] | |`
      },
      {
        heading: '4. Electrical Safety',
        body: `| # | Item | C | NC | N/A | Comments |
|---|------|---|----|----|----------|
| 3.1 | Electrical panels accessible, not blocked | [ ] | [ ] | [ ] | |
| 3.2 | No damaged plugs, sockets, or cables | [ ] | [ ] | [ ] | |
| 3.3 | Extension leads in good condition, not daisy-chained | [ ] | [ ] | [ ] | |
| 3.4 | Portable appliances tested (PAT) | [ ] | [ ] | [ ] | |
| 3.5 | Earth leakage protection functional | [ ] | [ ] | [ ] | |
| 3.6 | Lockout/tagout procedures in place for maintenance | [ ] | [ ] | [ ] | |
| 3.7 | No unauthorised electrical work | [ ] | [ ] | [ ] | |`
      },
      {
        heading: '5. PPE & Chemical Safety',
        body: `| # | Item | C | NC | N/A | Comments |
|---|------|---|----|----|----------|
| 4.1 | Workers wearing required PPE for their tasks | [ ] | [ ] | [ ] | |
| 4.2 | PPE in good condition (no damage, clean) | [ ] | [ ] | [ ] | |
| 4.3 | Chemicals stored in designated area | [ ] | [ ] | [ ] | |
| 4.4 | Safety Data Sheets (SDS) accessible | [ ] | [ ] | [ ] | |
| 4.5 | Chemical containers labelled correctly | [ ] | [ ] | [ ] | |
| 4.6 | Spill kits available and stocked | [ ] | [ ] | [ ] | |
| 4.7 | Eye wash stations functional and accessible | [ ] | [ ] | [ ] | |
| 4.8 | Hazardous waste segregated and labelled | [ ] | [ ] | [ ] | |`
      },
      {
        heading: '6. Machinery & Equipment',
        body: `| # | Item | C | NC | N/A | Comments |
|---|------|---|----|----|----------|
| 5.1 | Machine guards in place and functional | [ ] | [ ] | [ ] | |
| 5.2 | Emergency stop buttons accessible and working | [ ] | [ ] | [ ] | |
| 5.3 | Equipment maintenance up to date | [ ] | [ ] | [ ] | |
| 5.4 | Lifting equipment inspected and certified | [ ] | [ ] | [ ] | |
| 5.5 | Vehicles in safe operating condition | [ ] | [ ] | [ ] | |
| 5.6 | Operators trained and authorised | [ ] | [ ] | [ ] | |
| 5.7 | Noise levels within acceptable limits | [ ] | [ ] | [ ] | |`
      },
      {
        heading: '7. Summary & Actions',
        body: `**Inspection Summary:**
| Total Items | Compliant | Non-Compliant | N/A |
|------------|-----------|---------------|-----|
| | | | |

**Non-Conformances Identified:**
| NC # | Item | Finding | Priority | Corrective Action | Responsible | Due Date | NCR Ref |
|------|------|---------|---------|-------------------|-------------|----------|---------|
| 1 | | | [ ] High [ ] Medium [ ] Low | | | | |
| 2 | | | [ ] High [ ] Medium [ ] Low | | | | |
| 3 | | | [ ] High [ ] Medium [ ] Low | | | | |

**Inspector Sign-Off:**
Name: {{SO_NAME}}  |  Signature: _______________  |  Date: {{DATE}}

**Area Manager Sign-Off:**
Name: ________________  |  Signature: _______________  |  Date: ________________

> All High priority non-conformances must be raised as NCRs in ISOGuardian ({{REF:ncr-form}}).`
      },
    ],
  },

  'emergency-response-ohs': {
    title: 'OH&S Emergency Response Plan',
    docNumber: 'IG-{{CODE}}-SOP-010',
    revision: '01',
    sections: [
      {
        heading: '1. Purpose & Scope',
        body: `This plan defines the emergency response procedures for workplace emergencies at {{COMPANY}}, in accordance with ISO 45001:2018 Clause 8.2 and the OHS Act Sections 8 and 17.

**Scope:** All sites, operations, workers, contractors, and visitors of {{COMPANY}}.

**Related Documents:**
- HIRA Procedure ({{REF:hazard-identification-proc}})
- Risk & Opportunity Register ({{REF:risk-register}})
- Training Record ({{REF:training-record-form}})`
      },
      {
        heading: '2. Emergency Types & Response',
        body: `**2.1 Fire / Explosion:**
1. Raise the alarm (break glass / shout "FIRE")
2. Call emergency services: **10177**
3. Evacuate via nearest safe exit — do NOT use lifts
4. Assemble at designated assembly point
5. Fire marshals conduct headcount
6. Do NOT re-enter until "all clear" from Emergency Coordinator

**2.2 Medical Emergency / Serious Injury:**
1. Make the area safe
2. Call first aider immediately
3. Administer first aid (do NOT move spinal injury victims)
4. Call ambulance: **10177** (or company emergency number)
5. Notify Safety Officer ({{SO_NAME}})
6. Preserve the scene for investigation

**2.3 Chemical Spill / Hazardous Material Release:**
1. Evacuate the area if vapours/fumes present
2. Don PPE (chemical suit, respirator, gloves)
3. Contain the spill — use spill kit, block drains
4. Notify Safety Officer and Environmental Officer
5. Clean up contaminated materials, dispose as hazardous waste
6. Ventilate area before allowing re-entry

**2.4 Structural Collapse / Confined Space Emergency:**
1. Evacuate the immediate area
2. Call emergency services: **10177**
3. Do NOT attempt rescue without proper training and equipment
4. Account for all persons in the area
5. Notify {{MD_NAME}} and {{SO_NAME}}

**2.5 Severe Weather (storm, lightning, flooding):**
1. Cease outdoor work during lightning (30/30 rule)
2. Secure loose materials and equipment
3. Move to safe shelter
4. Resume work only when conditions are safe

**2.6 Security Threat / Armed Robbery:**
1. Cooperate with perpetrators — do NOT resist
2. Observe details for later identification
3. Call SAPS: **10111** when safe
4. Do not touch anything at the crime scene
5. Notify {{MD_NAME}}`
      },
      {
        heading: '3. Emergency Contacts & Resources',
        body: `**Emergency Contacts:**
| Contact | Name/Organisation | Phone |
|---------|------------------|-------|
| Emergency Coordinator | {{SO_NAME}} | [Phone] |
| Deputy Coordinator | {{MR_NAME}} | [Phone] |
| Managing Director | {{MD_NAME}} | [Phone] |
| Ambulance / Fire | Emergency services | 10177 |
| SAPS | South African Police | 10111 |
| Poison Centre | Tygerberg | 0861 555 777 |
| Hospital / ER | [ACTION REQUIRED: nearest hospital] | [Phone] |
| Electricity (Eskom) | Eskom emergency | 0860 037 566 |
| Gas supplier | [ACTION REQUIRED: if applicable] | [Phone] |

**Emergency Equipment:**
| Equipment | Location | Last Inspected |
|-----------|----------|---------------|
| First aid kit(s) | [ACTION REQUIRED] | [Date] |
| AED (defibrillator) | [ACTION REQUIRED] | [Date] |
| Fire extinguishers | [ACTION REQUIRED] | [Date] |
| Spill kits | [ACTION REQUIRED] | [Date] |
| Stretcher / spine board | [ACTION REQUIRED] | [Date] |
| Emergency lighting | [ACTION REQUIRED] | [Date] |

**Assembly Points:**
| Site / Area | Assembly Point | Fire Marshal |
|------------|---------------|-------------|
| [ACTION REQUIRED] | [Location] | [Name] |

> **[ACTION REQUIRED]:** Complete all contact details, equipment locations, and assembly points for your specific site(s).`
      },
      {
        heading: '4. Evacuation Plan',
        body: `**Evacuation Procedure:**
1. On hearing the alarm, stop all work immediately
2. Shut down equipment and processes where safe to do so
3. Leave via the nearest safe exit route
4. Assist persons with disabilities
5. Proceed to your designated assembly point
6. Fire marshals take roll call and report to Emergency Coordinator
7. Remain at assembly point until "all clear" is given

**Evacuation Roles:**
| Role | Name | Responsibility |
|------|------|---------------|
| Emergency Coordinator | {{SO_NAME}} | Overall emergency management, liaise with services |
| Fire Marshals | [ACTION REQUIRED: list names] | Floor/area sweep, headcount at assembly |
| First Aiders | [ACTION REQUIRED: list names] | Medical assistance, triage |

**Drills:**
- Fire evacuation drills conducted at least **every 6 months**
- Records kept in the Training Record ({{REF:training-record-form}})
- Drill results reviewed and emergency plan updated accordingly

**Post-Emergency:**
1. Investigate the incident per the Incident Investigation Procedure ({{REF:incident-investigation-proc}})
2. Report to authorities if required (OHS Act Section 24)
3. Raise NCR for corrective actions ({{REF:ncr-form}})
4. Communicate lessons learned
5. Update emergency plan if deficiencies identified`
      },
    ],
  },

  'ppe-register': {
    title: 'PPE Issue & Compliance Register',
    docNumber: 'IG-{{CODE}}-REG-005',
    revision: '01',
    sections: [
      {
        heading: '1. Purpose',
        body: `This register tracks the issue, condition, and replacement of Personal Protective Equipment (PPE) at {{COMPANY}}, in accordance with ISO 45001:2018 Clause 8.1.2 and the OHS Act General Safety Regulation 2.

PPE is the **last line of defence** in the hierarchy of controls. Elimination, substitution, engineering, and administrative controls must be considered first.

**Related Documents:**
- HIRA Procedure ({{REF:hazard-identification-proc}})
- Safety Inspection Checklist ({{REF:safety-inspection-checklist}})`
      },
      {
        heading: '2. PPE Requirements by Job Category',
        body: `| Job Category | Hard Hat | Safety Glasses | Hearing Protection | Safety Boots | Gloves | High-Vis Vest | Respirator | Fall Harness | Other |
|-------------|---------|---------------|-------------------|-------------|--------|-------------|-----------|-------------|-------|
| Office Staff | | | | | | | | | |
| Workshop / Manufacturing | X | X | X | X | X | X | [If needed] | | |
| Warehouse / Stores | X | | | X | X | X | | | |
| Drivers / Yard | X | | | X | | X | | | |
| Welding | X | X (auto-dark) | X | X | X (leather) | | X | | Welding apron |
| Working at Heights | X | X | | X | X | X | | X | |
| Chemical Handling | | X (splash) | | X (chem) | X (chem) | | X | | Chemical suit |
| Electrical Work | X (Class E) | X | | X (insulated) | X (insulated) | | | | |
| Visitors | X | X | [If needed] | X | | X | | | |

> **[ACTION REQUIRED]:** Customise the above matrix for your specific operations and job categories. Conduct a PPE risk assessment per the HIRA to determine requirements.`
      },
      {
        heading: '3. PPE Issue Register',
        body: `| Employee Name | Employee No. | Job Category | PPE Item | Size | Issue Date | Condition | Next Replacement | Signature |
|-------------|-------------|-------------|---------|------|-----------|-----------|-----------------|-----------|
| [EXAMPLE: J. Nkosi] | [EMP001] | Workshop | Hard hat | M | [Date] | Good | [+12 months] | _________ |
| [EXAMPLE: J. Nkosi] | [EMP001] | Workshop | Safety boots | 9 | [Date] | Good | [+6 months] | _________ |
| [EXAMPLE: J. Nkosi] | [EMP001] | Workshop | Safety glasses | Std | [Date] | Good | [When damaged] | _________ |
| [EXAMPLE: J. Nkosi] | [EMP001] | Workshop | Hearing protection | Std | [Date] | Good | [+3 months] | _________ |
| [EXAMPLE: T. van Wyk] | [EMP002] | Welding | Auto-dark helmet | Std | [Date] | Good | [+24 months] | _________ |

> **[ACTION REQUIRED]:** Replace examples with your actual employees and their PPE requirements.

**Active Users:** {{LIVE:USER_LIST}}

**PPE Issue Rules:**
- PPE issued free of charge to employees (OHS Act GSR 2(1))
- Employee must sign for receipt
- Damaged or worn PPE replaced immediately — report to supervisor
- PPE must not be taken off-site without permission
- Employee responsible for care and proper use of issued PPE`
      },
      {
        heading: '4. PPE Inspection & Replacement Schedule',
        body: `| PPE Item | Inspection Frequency | Replacement Criteria | Typical Lifespan |
|---------|---------------------|---------------------|-----------------|
| Hard hat | Monthly visual | Cracked, dented, >5 years, after impact | 3-5 years |
| Safety glasses | Daily before use | Scratched, cracked, loose fit | Replace when damaged |
| Hearing protection (earmuffs) | Monthly | Worn cushions, broken headband | 6-12 months |
| Hearing protection (plugs) | Per use (disposable) | N/A | Single use |
| Safety boots | Monthly | Sole separation, toe cap exposed, worn tread | 6-12 months |
| Gloves (general) | Before each use | Torn, worn through, chemical breakthrough | Replace when damaged |
| High-vis vest | Monthly | Faded reflective strips, torn | 6-12 months |
| Respirator | Before each use + monthly cartridge | Cartridge expiry, damaged seal | Per manufacturer spec |
| Fall harness | Before each use + 6-monthly formal | Stitching damage, buckle wear, after a fall | After a fall / per manufacturer |

**Responsible Person:** {{SO_NAME}} (Safety Officer)
**Last Updated:** {{DATE}}`
      },
    ],
  },

  'legal-appointments-register': {
    title: 'Legal Appointments Register (OHS Act)',
    docNumber: 'IG-{{CODE}}-REG-006',
    revision: '01',
    sections: [
      {
        heading: '1. Purpose',
        body: `This register documents all statutory appointments required under the Occupational Health and Safety Act 85 of 1993 (OHS Act) and related regulations for {{COMPANY}}.

These appointments are a legal requirement. Failure to make and maintain these appointments is an offence under the OHS Act.

**Related Documents:**
- OH&S Policy ({{REF:ohs-policy}})
- HIRA Procedure ({{REF:hazard-identification-proc}})`
      },
      {
        heading: '2. Section 16(2) Appointment',
        body: `**OHS Act Section 16(2):** The CEO/Managing Director must appoint a person to ensure compliance with the OHS Act.

| Detail | Value |
|--------|-------|
| **Appointor (CEO/MD)** | {{MD_NAME}} |
| **Appointee (16(2) Designee)** | ________________ |
| **Appointment Date** | ________________ |
| **Scope of Authority** | Full authority over all OHS matters at {{COMPANY}} |
| **Letter of Appointment** | On file: Yes / No |
| **Acceptance Signed** | Yes / No |

> **IMPORTANT:** The 16(2) appointee must have the authority and resources to fulfil this role. The appointment does not relieve the CEO of overall accountability.

**Section 16(1) — CEO Accountability:**
The CEO ({{MD_NAME}}) remains ultimately accountable for the health and safety of all persons at {{COMPANY}} workplaces.`
      },
      {
        heading: '3. Safety Appointments',
        body: `| # | Appointment | Section/Regulation | Appointee | Qualification/Training | Date Appointed | Letter on File | Review Date |
|---|-----------|-------------------|-----------|----------------------|---------------|---------------|-------------|
| 1 | **Safety Officer** | OHSA Sec 17(1) / GSR 6 | {{SO_NAME}} | [SAMTRAC / NEBOSH / equivalent] | [Date] | [ ] Yes [ ] No | [Annual] |
| 2 | **Safety Representative(s)** | OHSA Sec 17(1) | [ACTION REQUIRED: nominate/elect] | OHS Act training | [Date] | [ ] Yes [ ] No | [2 years] |
| 3 | **First Aider(s)** | GSR 3 | [ACTION REQUIRED] | Level 1 First Aid (valid) | [Date] | [ ] Yes [ ] No | [3 years] |
| 4 | **Fire Marshal(s)** | Fire Brigade Services Act | [ACTION REQUIRED] | Fire fighting training | [Date] | [ ] Yes [ ] No | [Annual] |
| 5 | **Incident Investigator** | OHSA Sec 24 | {{SO_NAME}} | Investigation training | [Date] | [ ] Yes [ ] No | [Annual] |

**Minimum First Aiders Required (GSR 3):**
| Number of Workers | First Aiders Required |
|-------------------|----------------------|
| 1-10 | 1 |
| 11-50 | 2 |
| 51-100 | 3 (with one per shift) |
| 100+ | 1 per 50 workers |

> **[ACTION REQUIRED]:** Complete all appointment details. Ensure each appointee has a signed letter of appointment on file.`
      },
      {
        heading: '4. SHE Committee',
        body: `**OHS Act Section 19:** Where an employer has two or more safety representatives, a SHE Committee must be established.

| Detail | Value |
|--------|-------|
| Committee Established | [ ] Yes [ ] No |
| Meeting Frequency | At least quarterly (Section 19(4)) |
| Chairperson | ________________ |
| Secretary | ________________ |

**SHE Committee Members:**
| Name | Role | Representing | Term |
|------|------|-------------|------|
| {{MD_NAME}} | Chairperson (employer) | Management | Permanent |
| {{SO_NAME}} | Safety Officer | Management | Permanent |
| [ACTION REQUIRED] | Safety Representative | Workers | 2 years |
| [ACTION REQUIRED] | Safety Representative | Workers | 2 years |
| [ACTION REQUIRED] | Member | [Department] | 2 years |

**Committee Functions (Section 19(5)):**
- Review health and safety conditions
- Discuss audit and inspection results
- Review incident reports and corrective actions
- Make recommendations to management
- Review effectiveness of safety measures`
      },
      {
        heading: '5. Specialised Appointments',
        body: `| # | Appointment | Regulation | Appointee | Qualification | Date | Review |
|---|-----------|-----------|-----------|-------------|------|--------|
| 1 | Construction Supervisor | CR 8(1) | [If applicable] | Construction safety training | | [Annual] |
| 2 | Lifting Machine Operator | DMR 18 | [If applicable] | Crane/forklift certificate | | [2 years] |
| 3 | Stacking Supervisor | GSR 8A | [If applicable] | Stacking training | | [Annual] |
| 4 | Electrical Installations | EIR 9 | [If applicable] | Licensed electrician | | [Annual] |
| 5 | Hazardous Chemical Substances | HCS Reg 5 | [If applicable] | HCS training | | [Annual] |
| 6 | Confined Space Entry Supervisor | GSR 5 | [If applicable] | Confined space training | | [Annual] |

> **[ACTION REQUIRED]:** Only include appointments relevant to your operations. Delete rows that don't apply.

**Register Maintained By:** {{SO_NAME}} (Safety Officer)
**Last Updated:** {{DATE}}
**Next Review Date:** [12 months from {{DATE}}]`
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // STARTER PACKS (14001 & 45001)
  // ═══════════════════════════════════════════════════════════

  'iso-14001-starter': {
    title: 'ISO 14001 Complete Starter Pack',
    docNumber: 'IG-{{CODE}}-BUNDLE-14001',
    revision: '01',
    sections: [
      {
        heading: 'Package Contents',
        body: `The **ISO 14001 Complete Starter Pack** contains everything you need to build an Environmental Management System from scratch. All documents are cross-referenced and auto-populated with your company information.

**Included Documents:**
| # | Document | Doc Number | Clause | Purpose |
|---|---------|-----------|--------|---------|
| 1 | Environmental Policy | {{REF:env-policy}} | 5.2 | Top management commitment to the environment |
| 2 | Environmental Aspects & Impacts Procedure | {{REF:env-management-proc}} | 6.1.2 | Identify and evaluate environmental aspects |
| 3 | Waste Management Procedure | {{REF:waste-management-proc}} | 8.1 | Operational control for waste streams |
| 4 | Environmental Emergency Preparedness | {{REF:emergency-preparedness-env}} | 8.2 | Emergency planning and response |
| 5 | Environmental Aspects Register | {{REF:env-aspects-register}} | 6.1.2 | Log of all aspects, impacts, and controls |
| 6 | Environmental Legal Register | {{REF:env-legal-register}} | 6.1.3 | Applicable SA environmental legislation |
| 7 | Environmental Objectives Register | {{REF:env-objectives-register}} | 6.2 | Objectives, targets, and action plans |
| 8 | Risk & Opportunity Register | {{REF:risk-register}} | 6.1 | Risks and opportunities across the EMS |
| 9 | NCR Form | {{REF:ncr-form}} | 10.2 | Nonconformity and corrective action tracking |`
      },
      {
        heading: 'Implementation Guide',
        body: `**Recommended implementation order:**

| Phase | Duration | Documents | Activities |
|-------|----------|-----------|-----------|
| **Phase 1: Policy & Context** | Weeks 1-2 | Environmental Policy, Legal Register | Establish policy, identify legal requirements, assign Environmental Officer |
| **Phase 2: Planning** | Weeks 3-5 | Aspects Procedure, Aspects Register, Risk Register, Objectives Register | Identify aspects, evaluate significance, set objectives |
| **Phase 3: Operations** | Weeks 6-8 | Waste Management Procedure, Emergency Preparedness | Implement operational controls, test emergency procedures |
| **Phase 4: Check & Act** | Weeks 9-12 | NCR Form, use existing audit tools | Conduct first internal audit, hold management review |

**Key South African Legislation to Know:**
- NEMA (National Environmental Management Act)
- NEM:WA (Waste Act)
- NEM:AQA (Air Quality Act)
- NWA (National Water Act)

**Tips for Success:**
- Start with a thorough aspects identification — this drives everything else
- Engage with your municipality for local by-law requirements
- Set measurable objectives from day one (energy, water, waste)
- Use ISOGuardian to manage your environmental documents and NCRs digitally
- Consider engaging a consultant for your initial aspects assessment`
      },
    ],
  },

  'iso-45001-starter': {
    title: 'ISO 45001 Complete Starter Pack',
    docNumber: 'IG-{{CODE}}-BUNDLE-45001',
    revision: '01',
    sections: [
      {
        heading: 'Package Contents',
        body: `The **ISO 45001 Complete Starter Pack** contains everything you need to build an OH&S Management System from scratch. All documents are cross-referenced and auto-populated with your company information.

**Included Documents:**
| # | Document | Doc Number | Clause | Purpose |
|---|---------|-----------|--------|---------|
| 1 | OH&S Policy | {{REF:ohs-policy}} | 5.2 | Top management commitment to worker safety |
| 2 | HIRA Procedure | {{REF:hazard-identification-proc}} | 6.1.2 | Hazard identification and risk assessment |
| 3 | Incident Investigation Procedure | {{REF:incident-investigation-proc}} | 10.2 | Incident reporting, investigation, corrective action |
| 4 | OH&S Emergency Response Plan | {{REF:emergency-response-ohs}} | 8.2 | Emergency procedures for all scenarios |
| 5 | Safety Inspection Checklist | {{REF:safety-inspection-checklist}} | 9.1.1 | Workplace inspection form |
| 6 | PPE Issue & Compliance Register | {{REF:ppe-register}} | 8.1.2 | PPE tracking and compliance |
| 7 | Legal Appointments Register | {{REF:legal-appointments-register}} | 5.3 | OHS Act statutory appointments |
| 8 | Risk & Opportunity Register | {{REF:risk-register}} | 6.1 | Risks and opportunities across the OHSMS |
| 9 | NCR Form | {{REF:ncr-form}} | 10.2 | Nonconformity and corrective action tracking |
| 10 | Training Record | {{REF:training-record-form}} | 7.2 | Training and competence management |`
      },
      {
        heading: 'Implementation Guide',
        body: `**Recommended implementation order:**

| Phase | Duration | Documents | Activities |
|-------|----------|-----------|-----------|
| **Phase 1: Policy & Leadership** | Weeks 1-2 | OH&S Policy, Legal Appointments Register | Establish policy, make statutory appointments, assign Safety Officer |
| **Phase 2: Planning** | Weeks 3-5 | HIRA Procedure, Risk Register, PPE Register | Identify hazards, assess risks, determine PPE requirements |
| **Phase 3: Operations** | Weeks 6-8 | Emergency Response Plan, Safety Inspection Checklist, Training Record | Implement controls, train workers, conduct first inspections |
| **Phase 4: Check & Act** | Weeks 9-12 | Incident Investigation Procedure, NCR Form | Conduct first internal audit, establish incident reporting culture |

**Key South African Legislation to Know:**
- OHS Act 85 of 1993 + General Safety Regulations
- COIDA (Compensation for Occupational Injuries and Diseases Act)
- Construction Regulations (if applicable)
- Driven Machinery Regulations, Electrical Installation Regulations
- Hazardous Chemical Substances Regulations (if applicable)

**Tips for Success:**
- The HIRA is the foundation — invest time in getting it right
- Make statutory appointments first (Section 16(2), safety reps, first aiders)
- Involve workers from day one — ISO 45001 requires worker participation
- Conduct emergency drills within the first month
- Use ISOGuardian to manage your safety NCRs and inspections digitally
- Consider engaging a SHEQ consultant for your baseline risk assessment`
      },
    ],
  },

}
