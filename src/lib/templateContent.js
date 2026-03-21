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

}
