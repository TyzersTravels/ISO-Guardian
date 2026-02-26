/**
 * ISOGuardian Legal Document PDF Generator
 *
 * Generates branded legal PDFs with ISOGuardian styling:
 * - Terms of Service v1.1
 * - POPIA Compliance & Privacy Policy
 * - Client Subscription & SLA v1.0
 * - Company Profile
 *
 * Usage: node scripts/generateLegalPDFs.js
 * Output: ./generated-pdfs/ directory
 *
 * Prerequisites: npm install jspdf
 */

import { jsPDF } from 'jspdf';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'generated-pdfs');

// Brand constants
const PURPLE = [124, 58, 237];
const DARK = [30, 27, 75];
const CYAN = [6, 182, 212];
const GREY = [107, 114, 128];
const WHITE = [255, 255, 255];
const LIGHT_BG = [249, 250, 251];
const RED = [220, 38, 38];

const COMPANY = {
  name: 'ISOGuardian (Pty) Ltd',
  reg: '2026/082362/07',
  director: 'Tyreece Kruger',
  email: 'support@isoguardian.co.za',
  website: 'www.isoguardian.co.za',
  address: '1 Goodwood Avenue, Comet, Boksburg, Gauteng, 1459',
  phone: '+27 71 606 0250',
};

// ============================================================
// PDF Builder helpers
// ============================================================

function createDoc() {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  return { doc, pageWidth, pageHeight, margin, contentWidth };
}

function addHeader(doc, pageWidth, margin, title, version) {
  // Purple header bar
  doc.setFillColor(...PURPLE);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Thin cyan accent line
  doc.setFillColor(...CYAN);
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text('ISOGuardian', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(220, 220, 255);
  doc.text('Enterprise ISO Compliance Management', margin, 18);
  doc.text(COMPANY.website, margin, 23);

  // Title + version right-aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text(title, pageWidth - margin, 12, { align: 'right' });
  if (version) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(version, pageWidth - margin, 18, { align: 'right' });
  }
}

function addFooter(doc, pageWidth, pageHeight, margin, pageNum, totalPages) {
  const y = pageHeight - 10;
  doc.setDrawColor(...PURPLE);
  doc.setLineWidth(0.3);
  doc.line(margin, y - 4, pageWidth - margin, y - 4);

  doc.setFontSize(6.5);
  doc.setTextColor(...GREY);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${COMPANY.name} | Reg: ${COMPANY.reg} | ${COMPANY.email}`,
    margin, y
  );
  doc.text(
    `Page ${pageNum}${totalPages ? ' of ' + totalPages : ''} | CONFIDENTIAL`,
    pageWidth - margin, y, { align: 'right' }
  );
}

function addDocControlBlock(doc, margin, contentWidth, docRef, version, effectiveDate, lastUpdated) {
  const y = 33;
  doc.setFillColor(...LIGHT_BG);
  doc.rect(margin, y, contentWidth, 16, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, y, contentWidth, 16, 'S');

  const colW = contentWidth / 4;
  const labels = ['Document Ref', 'Version', 'Effective Date', 'Last Updated'];
  const values = [docRef, version, effectiveDate, lastUpdated];

  doc.setFontSize(7);
  labels.forEach((label, i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREY);
    doc.text(label, margin + i * colW + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PURPLE);
    doc.setFontSize(8);
    doc.text(values[i], margin + i * colW + 3, y + 11);
    doc.setFontSize(7);
    if (i < 3) {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin + (i + 1) * colW, y, margin + (i + 1) * colW, y + 16);
    }
  });

  return y + 20;
}

function addTitle(doc, title, y, margin) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.text(title, margin, y);
  return y + 10;
}

function addSectionHeading(doc, text, y, margin, num) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PURPLE);
  const label = num ? `${num}. ${text}` : text;
  doc.text(label, margin, y);

  // Underline
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 1.5, margin + doc.getTextWidth(label), y + 1.5);

  return y + 7;
}

function addParagraph(doc, text, y, margin, contentWidth, opts = {}) {
  const { bold = false, size = 9, color = DARK, indent = 0 } = opts;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(size);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, contentWidth - indent);
  doc.text(lines, margin + indent, y);
  return y + lines.length * (size * 0.42) + 3;
}

function addBullet(doc, text, y, margin, contentWidth) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text('\u2022', margin + 4, y);
  const lines = doc.splitTextToSize(text, contentWidth - 12);
  doc.text(lines, margin + 10, y);
  return y + lines.length * 3.8 + 1.5;
}

function addImportantBox(doc, text, y, margin, contentWidth) {
  const lines = doc.splitTextToSize(text, contentWidth - 12);
  const boxH = lines.length * 4 + 6;
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(...RED);
  doc.setLineWidth(0.4);
  doc.rect(margin, y - 2, contentWidth, boxH, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...RED);
  doc.text('IMPORTANT', margin + 4, y + 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text(lines, margin + 4, y + 8);
  return y + boxH + 4;
}

function checkPageBreak(doc, y, pageHeight, margin, needed = 30) {
  if (y + needed > pageHeight - 20) {
    doc.addPage();
    return margin + 10; // fresh Y after top margin
  }
  return y;
}

// ============================================================
// DOCUMENT 1: Terms of Service v1.1
// ============================================================
function generateTermsOfService() {
  const { doc, pageWidth, pageHeight, margin, contentWidth } = createDoc();
  let pageNum = 1;

  const renderPage = () => {
    addHeader(doc, pageWidth, margin, 'Terms of Service', 'Version 1.1');
    addFooter(doc, pageWidth, pageHeight, margin, pageNum, null);
  };

  const newPage = () => {
    doc.addPage();
    pageNum++;
    renderPage();
    return 38;
  };

  const bp = (y, need = 28) => {
    if (y + need > pageHeight - 20) {
      return newPage();
    }
    return y;
  };

  renderPage();
  let y = addDocControlBlock(doc, margin, contentWidth, 'IG-LEGAL-TOS', 'v1.1', 'January 2026', '20 February 2026');
  y = addTitle(doc, 'Terms of Service', y, margin);

  // 1. Acceptance
  y = bp(y);
  y = addSectionHeading(doc, 'Acceptance of Terms', y, margin, 1);
  y = addParagraph(doc, 'By accessing and using ISOGuardian (\u201Cthe Service\u201D), you accept and agree to be bound by these Terms of Service, our Privacy Policy, POPIA Compliance Policy, and PAIA Manual (collectively, \u201Cthe Terms\u201D). If you do not agree, do not use the Service. If acting for a company, you warrant authority to bind it.', y, margin, contentWidth);
  y = addParagraph(doc, 'These Terms are governed by the laws of the Republic of South Africa, including the Consumer Protection Act 68 of 2008 (CPA), the Protection of Personal Information Act 4 of 2013 (POPIA), and the Electronic Communications and Transactions Act 25 of 2002 (ECTA).', y, margin, contentWidth);

  // 2. Service Description
  y = bp(y);
  y = addSectionHeading(doc, 'Service Description', y, margin, 2);
  y = addParagraph(doc, 'ISOGuardian is a cloud-based ISO compliance management platform that provides:', y, margin, contentWidth);
  const features = [
    'ISO compliance management across ISO 9001:2015, ISO 14001:2015, and ISO 45001:2018',
    'Document management \u2014 upload, store, organise, and retrieve ISO documentation with automated numbering and Activity Trail logging',
    'Non-Conformance Report (NCR) tracking \u2014 full lifecycle management from creation through corrective action to closure',
    'Audit scheduling and management \u2014 internal and external audit scheduling with close-out documentation per ISO 19011:2018',
    'Management review scheduling and documentation per ISO 9001:9.3, including meeting minutes, decisions, and action items',
    'Compliance scoring and reporting across all supported standards, organised by clause',
    'Activity Trail \u2014 comprehensive audit logging for ISO 7.5.3 traceability',
    'Branded PDF document exports with company branding and signature blocks',
  ];
  features.forEach(f => {
    y = bp(y, 8);
    y = addBullet(doc, f, y, margin, contentWidth);
  });

  // 3. Platform Development
  y = bp(y);
  y = addSectionHeading(doc, 'Platform Development & Future Features', y, margin, 3);
  y = addParagraph(doc, 'ISOGuardian is an actively developed platform. We continuously enhance the Service by adding new features, improving existing functionality, and expanding standards coverage. Planned enhancements may include (without limitation): document generation, digital signatures, automated notifications, additional ISO standards (including ISO 27001), and AI-powered compliance advisory tools.', y, margin, contentWidth);
  y = addParagraph(doc, 'No Commitment: References to planned or future features do not constitute a commitment that such features will be delivered by any specific date. Your subscription covers all features available on the Platform at the time of use.', y, margin, contentWidth, { bold: true, size: 8 });
  y = addParagraph(doc, 'Feature Changes: We reserve the right to modify, enhance, or retire features with thirty (30) days\u2019 notice. Core functionality as described in your Client Subscription Agreement will not be removed during your subscription term without equivalent replacement.', y, margin, contentWidth, { bold: true, size: 8 });

  // 4. User Responsibilities
  y = bp(y);
  y = addSectionHeading(doc, 'User Responsibilities', y, margin, 4);
  y = addParagraph(doc, 'You agree to:', y, margin, contentWidth);
  const responsibilities = [
    'Provide accurate information and maintain its accuracy',
    'Keep credentials confidential and notify us of any suspected unauthorised access',
    'Use the Service in compliance with all applicable South African laws',
    'Ensure personal information uploaded has a lawful basis under POPIA',
    'Not reverse-engineer, decompile, or derive source code of the Platform',
    'Not upload malicious content or material infringing third-party IP rights',
    'Maintain your own backups of critical data',
  ];
  responsibilities.forEach(r => {
    y = bp(y, 8);
    y = addBullet(doc, r, y, margin, contentWidth);
  });

  // 5. Data Ownership
  y = bp(y);
  y = addSectionHeading(doc, 'Data Ownership & License', y, margin, 5);
  y = addParagraph(doc, 'Your Data: You retain all rights to data you upload to ISOGuardian.', y, margin, contentWidth, { bold: true });
  y = addParagraph(doc, 'License Grant: You grant us a limited licence to store, process, and display your data solely for providing the Service.', y, margin, contentWidth);
  y = addParagraph(doc, 'Our IP: The Platform, including software, design, templates, branded export formats, and documentation, is owned by ISOGuardian (Pty) Ltd. You are granted a non-exclusive, non-transferable licence for the duration of your subscription.', y, margin, contentWidth);

  // 6. Limitation of Liability
  y = bp(y);
  y = addSectionHeading(doc, 'Limitation of Liability', y, margin, 6);
  y = addImportantBox(doc, 'ISOGuardian is a management tool designed to assist with compliance management. It does not guarantee ISO certification, 100% compliance with any standard, elimination of all compliance risks, or that any feature will produce a particular regulatory outcome. You remain solely responsible for achieving and maintaining compliance. Consult qualified professionals for compliance decisions.', y, margin, contentWidth);
  y = addParagraph(doc, 'Exclusion: To the maximum extent permitted by law, we are not liable for indirect, incidental, special, or consequential damages, including loss of profits, data, or goodwill.', y, margin, contentWidth);
  y = addParagraph(doc, 'Maximum Liability: Our total aggregate liability shall not exceed fees paid by you in the 12 months preceding the claim.', y, margin, contentWidth);

  // 7. Service Availability
  y = bp(y);
  y = addSectionHeading(doc, 'Service Availability', y, margin, 7);
  y = addParagraph(doc, 'Uptime Target: We target 99% monthly uptime. This excludes scheduled maintenance, force majeure, and third-party outages.', y, margin, contentWidth);
  y = addParagraph(doc, 'Maintenance: Communicated at least 48 hours in advance where practicable.', y, margin, contentWidth);
  y = addParagraph(doc, 'Support: Email support during business hours (Monday\u2013Friday, 08:00\u201317:00 SAST, excl. SA public holidays).', y, margin, contentWidth);
  y = addParagraph(doc, 'Service Credits: Where a Client Subscription Agreement applies, service credits are specified therein.', y, margin, contentWidth);

  // 8. Payment
  y = bp(y);
  y = addSectionHeading(doc, 'Payment & Subscription', y, margin, 8);
  y = addParagraph(doc, 'Billing: Subscription-based. Plans detailed on the website or in your Client Subscription Agreement. All amounts in ZAR, exclusive of VAT.', y, margin, contentWidth);
  y = addParagraph(doc, 'Payment: Due in advance on the 1st of each month via EFT. Late payment beyond 7 days may restrict access; beyond 14 days, suspension.', y, margin, contentWidth);
  y = addParagraph(doc, 'Price Changes: Once per annum with 30 days\u2019 notice. Increases capped at 10% or CPI + 2%, whichever is greater.', y, margin, contentWidth);
  y = addParagraph(doc, 'Fixed-Term: Where a 12-month agreement applies, early cancellation is subject to early termination provisions in your Subscription Agreement.', y, margin, contentWidth);

  // 9. Cancellation
  y = bp(y);
  y = addSectionHeading(doc, 'Cancellation & Refunds', y, margin, 9);
  y = addParagraph(doc, 'CPA Cooling-Off: Where the CPA applies (distance selling), cancel within 5 business days of signup for a full refund less prorated usage.', y, margin, contentWidth);
  y = addParagraph(doc, 'Fixed-Term: Early cancellation subject to a reasonable termination fee per your Subscription Agreement, calculated per CPA Section 14.', y, margin, contentWidth);
  y = addParagraph(doc, 'Month-to-Month: Cancel with 30 days\u2019 written notice. Effective at end of billing cycle.', y, margin, contentWidth);
  y = addParagraph(doc, 'No Partial Refunds: No refunds for partial months or unused time, except where required by law.', y, margin, contentWidth);

  // 10. Account Termination
  y = bp(y);
  y = addSectionHeading(doc, 'Account Termination', y, margin, 10);
  y = addParagraph(doc, 'By You: Contact support to terminate your account.', y, margin, contentWidth);
  y = addParagraph(doc, 'By Us: We may suspend or terminate for breach, non-payment exceeding 30 days, fraud, or abuse. 14 days\u2019 notice and opportunity to remedy provided for breach.', y, margin, contentWidth);
  y = addParagraph(doc, 'Data Retention: Data retained for 30 days post-termination for export, then permanently deleted unless legal retention applies.', y, margin, contentWidth);

  // 11. Data Protection
  y = bp(y);
  y = addSectionHeading(doc, 'Data Protection & POPIA', y, margin, 11);
  y = addParagraph(doc, 'We process personal information under POPIA. You are the Responsible Party; ISOGuardian is the Operator.', y, margin, contentWidth);
  y = addParagraph(doc, 'Data Hosting: Supabase infrastructure in the EU (London), compliant under POPIA Section 72.', y, margin, contentWidth);
  y = addParagraph(doc, 'Security: AES-256 encryption at rest, TLS in transit, Row Level Security, role-based access, audit logging, CAPTCHA protection.', y, margin, contentWidth);
  y = addParagraph(doc, 'Breach Notification: Within 72 hours per POPIA Section 22.', y, margin, contentWidth);

  // 12. Security
  y = bp(y);
  y = addSectionHeading(doc, 'Security', y, margin, 12);
  y = addParagraph(doc, 'Commercially reasonable security measures including:', y, margin, contentWidth);
  const securityItems = [
    'AES-256 encryption at rest and TLS 1.2+ in transit',
    'Row Level Security (RLS) for multi-tenant data isolation',
    'Role-based access controls with company-scoped permissions',
    'Comprehensive audit logging of all actions',
    'Cloudflare Turnstile CAPTCHA',
    'Session management with automatic timeout',
  ];
  securityItems.forEach(s => {
    y = bp(y, 8);
    y = addBullet(doc, s, y, margin, contentWidth);
  });
  y = addParagraph(doc, 'No method of transmission or storage is 100% secure. We maintain commercially acceptable safeguards.', y, margin, contentWidth);

  // 13-16
  y = bp(y);
  y = addSectionHeading(doc, 'Changes to Terms', y, margin, 13);
  y = addParagraph(doc, 'We may update these Terms with 30 days\u2019 written notice per CPA Section 14(2)(b)(i)(bb). Material changes communicated via email. Continued use after the notice period constitutes acceptance. If you disagree, you may terminate per Clause 9.', y, margin, contentWidth);

  y = bp(y);
  y = addSectionHeading(doc, 'Force Majeure', y, margin, 14);
  y = addParagraph(doc, 'Not liable for failure or delay caused by events beyond reasonable control: acts of God, disasters, power outages, internet failures, government actions, pandemics, civil unrest, or third-party provider outages.', y, margin, contentWidth);

  y = bp(y);
  y = addSectionHeading(doc, 'Governing Law', y, margin, 15);
  y = addParagraph(doc, 'South African law applies. Disputes first to mediation in Gauteng; if unresolved within 30 days, to the courts of South Africa, Gauteng Division.', y, margin, contentWidth);

  y = bp(y);
  y = addSectionHeading(doc, 'Miscellaneous', y, margin, 16);
  y = addParagraph(doc, 'These Terms, together with your Client Subscription Agreement (if applicable), Privacy Policy, and PAIA Manual, constitute the entire agreement. Invalid provisions do not affect the remainder. No waiver effective unless written. We may assign to a successor; you may not assign without our consent. Electronic signatures recognised per ECTA.', y, margin, contentWidth);

  // Contact
  y = bp(y, 30);
  y = addSectionHeading(doc, 'Contact Information', y, margin);
  y = addParagraph(doc, `Information Officer & Director: ${COMPANY.director}`, y, margin, contentWidth, { bold: true });
  y = addParagraph(doc, `Support & Legal: ${COMPANY.email}`, y, margin, contentWidth);
  y = addParagraph(doc, `Address: ${COMPANY.address}`, y, margin, contentWidth);
  y += 4;
  y = addParagraph(doc, `${COMPANY.name} | Registration: ${COMPANY.reg} | VAT: Pending`, y, margin, contentWidth, { size: 7, color: GREY });

  // Renumber pages
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (i > 1) addHeader(doc, pageWidth, margin, 'Terms of Service', 'Version 1.1');
    addFooter(doc, pageWidth, pageHeight, margin, i, total);
  }

  return doc;
}

// ============================================================
// DOCUMENT 2: POPIA Compliance & Privacy Policy
// ============================================================
function generatePOPIA() {
  const { doc, pageWidth, pageHeight, margin, contentWidth } = createDoc();
  let pageNum = 1;

  const renderPage = () => {
    addHeader(doc, pageWidth, margin, 'POPIA & Privacy Policy', 'Version 1.0');
    addFooter(doc, pageWidth, pageHeight, margin, pageNum, null);
  };

  const newPage = () => {
    doc.addPage();
    pageNum++;
    renderPage();
    return 38;
  };

  const bp = (y, need = 28) => {
    if (y + need > pageHeight - 20) return newPage();
    return y;
  };

  renderPage();
  let y = addDocControlBlock(doc, margin, contentWidth, 'IG-LEGAL-POPIA', 'v1.0', 'January 2026', 'February 2026');
  y = addTitle(doc, 'POPIA Compliance & Data Protection', y, margin);

  y = addParagraph(doc, 'ISOGuardian is committed to protecting your personal information in accordance with the Protection of Personal Information Act (POPIA), 2013.', y, margin, contentWidth);

  y = bp(y);
  y = addSectionHeading(doc, 'Information We Collect', y, margin);
  y = addParagraph(doc, 'Account Information: Name, email, company name, role', y, margin, contentWidth, { bold: true });
  y = addParagraph(doc, 'Compliance Data: Documents, NCRs, audit records, compliance scores', y, margin, contentWidth, { bold: true });
  y = addParagraph(doc, 'Usage Data: Login times, feature usage (for service improvement)', y, margin, contentWidth, { bold: true });

  y = bp(y);
  y = addSectionHeading(doc, 'How We Protect Your Data', y, margin);
  const protections = [
    ['256-bit Encryption', 'All data transmitted and stored is encrypted using industry-standard AES-256 encryption.'],
    ['Multi-Tenant Isolation', 'Your company\u2019s data is completely isolated. Other companies cannot access your information.'],
    ['Secure Data Centres', 'Data hosted in EU (London) on Supabase infrastructure with SOC 2 Type II certification.'],
    ['Role-Based Access Control', 'Only authorised users within your company can access specific data based on their role.'],
  ];
  protections.forEach(([title, desc]) => {
    y = bp(y, 12);
    y = addParagraph(doc, title, y, margin, contentWidth, { bold: true, color: PURPLE });
    y = addParagraph(doc, desc, y, margin, contentWidth, { indent: 4 });
  });

  y = bp(y);
  y = addSectionHeading(doc, 'Your Rights Under POPIA', y, margin);
  const rights = [
    'Right to Access: Request a copy of all your data',
    'Right to Correction: Update incorrect information',
    'Right to Deletion: Request permanent deletion of your data',
    'Right to Data Portability: Export your data in machine-readable format',
    'Right to Object: Object to processing of your personal information',
  ];
  rights.forEach(r => {
    y = bp(y, 8);
    y = addBullet(doc, r, y, margin, contentWidth);
  });

  y = bp(y);
  y = addSectionHeading(doc, 'Data Retention', y, margin);
  y = addBullet(doc, 'Active accounts: Duration of subscription + 30 days', y, margin, contentWidth);
  y = addBullet(doc, 'Compliance records: As required by ISO standards (typically 3 years)', y, margin, contentWidth);
  y = addBullet(doc, 'After account closure: 30 days grace period, then permanent deletion', y, margin, contentWidth);

  y = bp(y);
  y = addSectionHeading(doc, 'Third-Party Services', y, margin);
  y = addParagraph(doc, 'Supabase (Database & Auth): EU servers, SOC 2 certified', y, margin, contentWidth, { bold: true });
  y = addParagraph(doc, 'Vercel (Hosting): Global CDN, ISO 27001 certified', y, margin, contentWidth, { bold: true });
  y = addParagraph(doc, 'We do not sell, rent, or share your data with third parties for marketing purposes.', y, margin, contentWidth, { size: 8, color: GREY });

  y = bp(y, 30);
  y = addSectionHeading(doc, 'Contact Information Officer', y, margin);
  y = addParagraph(doc, 'For any data protection queries or to exercise your rights:', y, margin, contentWidth);
  y = addParagraph(doc, `Information Officer: ${COMPANY.director}`, y, margin, contentWidth, { bold: true });
  y = addParagraph(doc, `Email: ${COMPANY.email}`, y, margin, contentWidth);
  y = addParagraph(doc, 'Response Time: Within 30 days as required by POPIA', y, margin, contentWidth);
  y += 4;
  y = addParagraph(doc, `Last Updated: February 2026 | Information Regulator Registration: Pending | ${COMPANY.name} | Reg: ${COMPANY.reg}`, y, margin, contentWidth, { size: 7, color: GREY });

  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (i > 1) addHeader(doc, pageWidth, margin, 'POPIA & Privacy Policy', 'Version 1.0');
    addFooter(doc, pageWidth, pageHeight, margin, i, total);
  }

  return doc;
}

// ============================================================
// DOCUMENT 3: Client Subscription & SLA v1.0
// ============================================================
function generateSLA() {
  const { doc, pageWidth, pageHeight, margin, contentWidth } = createDoc();
  let pageNum = 1;

  const renderPage = () => {
    addHeader(doc, pageWidth, margin, 'Client Subscription & SLA', 'Version 1.0');
    addFooter(doc, pageWidth, pageHeight, margin, pageNum, null);
  };

  const newPage = () => {
    doc.addPage();
    pageNum++;
    renderPage();
    return 38;
  };

  const bp = (y, need = 28) => {
    if (y + need > pageHeight - 20) return newPage();
    return y;
  };

  renderPage();
  let y = addDocControlBlock(doc, margin, contentWidth, 'IG-LEGAL-SLA', 'v1.0', 'January 2026', 'February 2026');
  y = addTitle(doc, 'Client Subscription & Service Level Agreement', y, margin);

  // Parties
  y = addSectionHeading(doc, 'Parties', y, margin, 1);
  y = addParagraph(doc, `Service Provider: ${COMPANY.name}, Registration: ${COMPANY.reg}, represented by ${COMPANY.director} (Director)`, y, margin, contentWidth);
  y = addParagraph(doc, 'Client: As specified in the signed Subscription Agreement', y, margin, contentWidth);

  // Service Description
  y = bp(y);
  y = addSectionHeading(doc, 'Service Description', y, margin, 2);
  y = addParagraph(doc, 'ISOGuardian provides a cloud-based ISO compliance management platform covering ISO 9001:2015, ISO 14001:2015, and ISO 45001:2018. The Service includes document management, NCR tracking, audit scheduling, management review documentation, compliance scoring, activity trail, and branded PDF exports.', y, margin, contentWidth);

  // Subscription Terms
  y = bp(y);
  y = addSectionHeading(doc, 'Subscription Terms', y, margin, 3);
  y = addParagraph(doc, 'Term: 12-month fixed term from the Commencement Date, renewing automatically unless terminated per Clause 8.', y, margin, contentWidth);
  y = addParagraph(doc, 'Billing: Monthly in advance on the 1st of each month via EFT. All amounts in ZAR, exclusive of VAT (15%).', y, margin, contentWidth);
  y = addParagraph(doc, 'Late Payment: Access restricted after 7 days; suspended after 14 days. Interest at the prescribed rate under the National Credit Act.', y, margin, contentWidth);
  y = addParagraph(doc, 'Price Adjustment: Once per annum with 30 days\u2019 notice. Capped at 10% or CPI + 2%, whichever is greater.', y, margin, contentWidth);

  // SLA
  y = bp(y);
  y = addSectionHeading(doc, 'Service Level Agreement', y, margin, 4);
  y = addParagraph(doc, 'Uptime Target: 99% monthly uptime, measured as total minutes minus downtime divided by total minutes.', y, margin, contentWidth, { bold: true });
  y = addParagraph(doc, 'Exclusions: Scheduled maintenance (48 hours\u2019 notice), force majeure, third-party outages (Supabase, Vercel, Cloudflare), and Client-caused issues.', y, margin, contentWidth);

  y = bp(y);
  y = addParagraph(doc, 'Response Times:', y, margin, contentWidth, { bold: true, color: PURPLE });
  const slaTable = [
    ['Critical (service down)', '4 business hours', 'Best effort same-day'],
    ['High (feature impaired)', '8 business hours', '2 business days'],
    ['Medium (workaround exists)', '2 business days', '5 business days'],
    ['Low (enhancement request)', '5 business days', 'Next release cycle'],
  ];
  slaTable.forEach(([severity, response, resolution]) => {
    y = bp(y, 8);
    y = addBullet(doc, `${severity}: Response \u2014 ${response} | Resolution \u2014 ${resolution}`, y, margin, contentWidth);
  });

  y = addParagraph(doc, 'Business Hours: Monday\u2013Friday, 08:00\u201317:00 SAST, excluding SA public holidays.', y, margin, contentWidth);

  // Service Credits
  y = bp(y);
  y = addSectionHeading(doc, 'Service Credits', y, margin, 5);
  y = addParagraph(doc, 'If monthly uptime falls below 99%, the Client is entitled to service credits:', y, margin, contentWidth);
  y = addBullet(doc, '95%\u201398.99% uptime: 10% credit on monthly fee', y, margin, contentWidth);
  y = addBullet(doc, '90%\u201394.99% uptime: 25% credit on monthly fee', y, margin, contentWidth);
  y = addBullet(doc, 'Below 90% uptime: 50% credit on monthly fee', y, margin, contentWidth);
  y = addParagraph(doc, 'Maximum aggregate service credits: 50% of monthly fee. Credits must be claimed within 30 days of the affected month. Credits are applied to subsequent invoices, not refunded.', y, margin, contentWidth, { size: 8, color: GREY });

  // Data & Security
  y = bp(y);
  y = addSectionHeading(doc, 'Data Protection & Security', y, margin, 6);
  y = addParagraph(doc, 'POPIA Roles: Client is the Responsible Party; ISOGuardian is the Operator.', y, margin, contentWidth);
  y = addParagraph(doc, 'Data Hosting: Supabase (EU \u2014 London), SOC 2 Type II certified.', y, margin, contentWidth);
  y = addParagraph(doc, 'Encryption: AES-256 at rest, TLS 1.2+ in transit.', y, margin, contentWidth);
  y = addParagraph(doc, 'Isolation: Row-Level Security (RLS) enforced at database level for multi-tenant data isolation.', y, margin, contentWidth);
  y = addParagraph(doc, 'Backups: Daily automated backups with 7-day retention.', y, margin, contentWidth);
  y = addParagraph(doc, 'Breach Notification: Within 72 hours per POPIA Section 22.', y, margin, contentWidth);

  // Liability
  y = bp(y);
  y = addSectionHeading(doc, 'Limitation of Liability', y, margin, 7);
  y = addImportantBox(doc, 'ISOGuardian is a compliance management tool. It does not guarantee ISO certification or audit success. The Client remains solely responsible for compliance outcomes. Maximum aggregate liability: fees paid in the 12 months preceding the claim.', y, margin, contentWidth);

  // Termination
  y = bp(y);
  y = addSectionHeading(doc, 'Termination', y, margin, 8);
  y = addParagraph(doc, 'CPA Cooling-Off: 5 business days from date of signing (distance selling). Full refund less prorated usage.', y, margin, contentWidth);
  y = addParagraph(doc, 'Early Termination (months 1\u20136): 50% of remaining term fees.', y, margin, contentWidth);
  y = addParagraph(doc, 'Early Termination (months 7\u201312): 25% of remaining term fees.', y, margin, contentWidth);
  y = addParagraph(doc, 'Renewal Cancellation: 30 days\u2019 written notice before renewal date.', y, margin, contentWidth);
  y = addParagraph(doc, 'Post-Termination: Data available for export for 30 days, then permanently deleted.', y, margin, contentWidth);

  // Governing Law
  y = bp(y);
  y = addSectionHeading(doc, 'Governing Law & Disputes', y, margin, 9);
  y = addParagraph(doc, 'South African law applies. Disputes referred to mediation in Gauteng. If unresolved within 30 days, to the courts of South Africa, Gauteng Division.', y, margin, contentWidth);

  // Signatures
  y = bp(y, 50);
  y = addSectionHeading(doc, 'Signatures', y, margin);
  y += 4;

  // Two-column signature block
  const colW = contentWidth / 2 - 5;
  doc.setDrawColor(...GREY);

  // Left: Service Provider
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PURPLE);
  doc.text('Service Provider', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text(COMPANY.name, margin, y); y += 12;
  doc.text('Signature: ___________________________', margin, y); y += 8;
  doc.text(`Name: ${COMPANY.director}`, margin, y); y += 5;
  doc.text('Title: Director', margin, y); y += 5;
  doc.text('Date: ___________________________', margin, y);

  // Right: Client
  let yRight = y - 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PURPLE);
  doc.text('Client', margin + colW + 10, yRight - 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text('Company: ___________________________', margin + colW + 10, yRight + 7); yRight += 12;
  doc.text('Signature: ___________________________', margin + colW + 10, yRight); yRight += 8;
  doc.text('Name: ___________________________', margin + colW + 10, yRight); yRight += 5;
  doc.text('Title: ___________________________', margin + colW + 10, yRight); yRight += 5;
  doc.text('Date: ___________________________', margin + colW + 10, yRight);

  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (i > 1) addHeader(doc, pageWidth, margin, 'Client Subscription & SLA', 'Version 1.0');
    addFooter(doc, pageWidth, pageHeight, margin, i, total);
  }

  return doc;
}

// ============================================================
// DOCUMENT 4: Company Profile
// ============================================================
function generateCompanyProfile() {
  const { doc, pageWidth, pageHeight, margin, contentWidth } = createDoc();

  addHeader(doc, pageWidth, margin, 'Company Profile', '2026');

  let y = addDocControlBlock(doc, margin, contentWidth, 'IG-CORP-PROFILE', 'v1.0', 'February 2026', 'February 2026');

  y = addTitle(doc, 'ISOGuardian (Pty) Ltd', y, margin);
  y = addParagraph(doc, 'Enterprise ISO Compliance Management', y, margin, contentWidth, { size: 11, color: PURPLE, bold: true });
  y += 2;

  y = addSectionHeading(doc, 'Company Overview', y, margin);
  y = addParagraph(doc, 'ISOGuardian is a South African technology company specialising in cloud-based ISO compliance management. Our platform enables organisations to manage their ISO 9001:2015 (Quality), ISO 14001:2015 (Environmental), and ISO 45001:2018 (Occupational Health & Safety) compliance requirements through a single, integrated digital platform.', y, margin, contentWidth);
  y = addParagraph(doc, 'Founded in 2026, ISOGuardian was born from the recognition that South African businesses deserve modern, affordable compliance tools that meet international standards while respecting local legislative requirements including POPIA, the CPA, and ECTA.', y, margin, contentWidth);

  y = addSectionHeading(doc, 'Company Details', y, margin);
  const details = [
    ['Registered Name', COMPANY.name],
    ['Registration Number', COMPANY.reg],
    ['VAT Number', 'Pending'],
    ['Director', COMPANY.director],
    ['Information Officer', COMPANY.director],
    ['Registered Address', COMPANY.address],
    ['Email', COMPANY.email],
    ['Website', COMPANY.website],
    ['Phone', COMPANY.phone],
  ];
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(label + ':', margin + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(value, margin + 50, y);
    y += 5;
  });
  y += 4;

  y = addSectionHeading(doc, 'Our Platform', y, margin);
  y = addParagraph(doc, 'ISOGuardian provides a comprehensive suite of compliance management tools:', y, margin, contentWidth);
  const platformFeatures = [
    'Document Management \u2014 Upload, store, organise, and retrieve ISO documentation with automated document numbering (IG-[CODE]-DOC-001) and full Activity Trail logging',
    'Non-Conformance Report (NCR) Tracking \u2014 Full lifecycle management from creation through root cause analysis, corrective action, to formal close-out',
    'Audit Scheduling & Management \u2014 Internal and external audit scheduling with close-out reports per ISO 19011:2018',
    'Management Review Documentation \u2014 Per ISO 9001:9.3, including meeting minutes, decisions, action items, and branded PDF export',
    'Compliance Scoring \u2014 Clause-by-clause tracking per standard, with aggregated scoring dashboards',
    'Activity Trail \u2014 Immutable audit log providing full traceability per ISO 7.5.3',
    'Branded PDF Exports \u2014 Professional document output with client company branding, signature blocks, and document control',
  ];
  platformFeatures.forEach(f => {
    y = checkPageBreak(doc, y, pageHeight, margin, 10);
    y = addBullet(doc, f, y, margin, contentWidth);
  });

  y = checkPageBreak(doc, y, pageHeight, margin, 30);
  y = addSectionHeading(doc, 'Standards Supported', y, margin);
  const standards = [
    ['ISO 9001:2015', 'Quality Management Systems'],
    ['ISO 14001:2015', 'Environmental Management Systems'],
    ['ISO 45001:2018', 'Occupational Health & Safety Management Systems'],
  ];
  standards.forEach(([std, name]) => {
    y = addParagraph(doc, `${std} \u2014 ${name}`, y, margin, contentWidth, { bold: true });
  });
  y += 2;
  y = addParagraph(doc, 'ISOGuardian (Pty) Ltd is currently working towards ISO 27001:2022 (Information Security) certification for our own operations.', y, margin, contentWidth, { size: 8, color: GREY });

  y = checkPageBreak(doc, y, pageHeight, margin, 30);
  y = addSectionHeading(doc, 'Security & Compliance', y, margin);
  y = addBullet(doc, 'AES-256 encryption at rest and TLS 1.2+ in transit', y, margin, contentWidth);
  y = addBullet(doc, 'Row-Level Security (RLS) for database-enforced multi-tenant data isolation', y, margin, contentWidth);
  y = addBullet(doc, 'POPIA compliant \u2014 Information Officer appointed, breach notification within 72 hours', y, margin, contentWidth);
  y = addBullet(doc, 'Data hosted in EU (London) on Supabase infrastructure with SOC 2 Type II certification', y, margin, contentWidth);
  y = addBullet(doc, 'Cloudflare Turnstile CAPTCHA for bot protection', y, margin, contentWidth);
  y = addBullet(doc, 'Role-based access controls with company-scoped permissions', y, margin, contentWidth);

  y = checkPageBreak(doc, y, pageHeight, margin, 20);
  y = addSectionHeading(doc, 'Contact Us', y, margin);
  y = addParagraph(doc, `Email: ${COMPANY.email}`, y, margin, contentWidth, { bold: true });
  y = addParagraph(doc, `Phone: ${COMPANY.phone}`, y, margin, contentWidth);
  y = addParagraph(doc, `Website: ${COMPANY.website}`, y, margin, contentWidth);
  y = addParagraph(doc, `Address: ${COMPANY.address}`, y, margin, contentWidth);

  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (i > 1) addHeader(doc, pageWidth, margin, 'Company Profile', '2026');
    addFooter(doc, pageWidth, pageHeight, margin, i, total);
  }

  return doc;
}

// ============================================================
// MAIN — Generate all PDFs
// ============================================================
async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Generating ISOGuardian Legal PDFs...\n');

  const documents = [
    { name: 'ISOGuardian_Terms_of_Service_v1.1', generator: generateTermsOfService },
    { name: 'ISOGuardian_POPIA_Privacy_Policy_v1.0', generator: generatePOPIA },
    { name: 'ISOGuardian_Client_Subscription_SLA_v1.0', generator: generateSLA },
    { name: 'ISOGuardian_Company_Profile_2026', generator: generateCompanyProfile },
  ];

  for (const { name, generator } of documents) {
    try {
      const doc = generator();
      const outputPath = join(OUTPUT_DIR, `${name}.pdf`);

      // jsPDF v4 output
      const arrayBuffer = doc.output('arraybuffer');
      const { writeFileSync } = await import('fs');
      writeFileSync(outputPath, Buffer.from(arrayBuffer));

      console.log(`  \u2713 ${name}.pdf`);
    } catch (err) {
      console.error(`  \u2717 ${name}: ${err.message}`);
    }
  }

  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
  console.log('Done.');
}

main().catch(console.error);
