/**
 * ISOGuardian Legal Document PDF Generator v2
 *
 * Generates branded legal PDFs with ISOGuardian styling:
 * - Terms of Service v1.1         (public)
 * - POPIA Compliance & Privacy    (public)
 * - Company Profile               (public - marketing)
 * - Client Subscription & SLA     (PRIVATE - serious buyers only)
 *
 * Usage: node scripts/generateLegalPDFs.js
 * Output:
 *   ./public/docs/   — public PDFs (served by Vercel)
 *   ./generated-pdfs/ — ALL PDFs including private ones
 */

import { jsPDF } from 'jspdf';
import { mkdirSync, existsSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(ROOT, 'generated-pdfs');
const PUBLIC_DOCS = join(ROOT, 'public', 'docs');

// ────────────────────────────────────────────────────────────
// Brand palette — professional, muted, confident
// ────────────────────────────────────────────────────────────
const NAVY    = [20, 25, 45];      // Primary text — deep navy
const ACCENT  = [79, 70, 160];     // Headings — muted indigo (toned-down purple)
const TEAL    = [20, 148, 156];    // Secondary accent — professional teal
const SLATE   = [100, 116, 139];   // Captions, meta text
const DARK    = [30, 41, 59];      // Body text
const WHITE   = [255, 255, 255];
const LIGHT   = [248, 250, 252];   // Light background fills
const BORDER  = [226, 232, 240];   // Subtle borders
const RED_BOX = [254, 226, 226];   // Important box bg
const RED_TXT = [185, 28, 28];     // Important text

const COMPANY = {
  name: 'ISOGuardian (Pty) Ltd',
  reg: '2026/082362/07',
  director: 'Tyreece Kruger',
  email: 'support@isoguardian.co.za',
  website: 'www.isoguardian.co.za',
  address: '1 Goodwood Avenue, Comet, Boksburg, Gauteng, 1459',
  phone: '+27 71 606 0250',
};

// ────────────────────────────────────────────────────────────
// Logo loader
// ────────────────────────────────────────────────────────────
let LOGO_DATA = null;
try {
  const logoPath = join(ROOT, 'public', 'isoguardian-logo.png');
  const buf = readFileSync(logoPath);
  LOGO_DATA = 'data:image/jpeg;base64,' + buf.toString('base64');
} catch (e) {
  console.warn('Logo not found, generating without logo');
}

// ────────────────────────────────────────────────────────────
// Core PDF helpers
// ────────────────────────────────────────────────────────────

function createDoc() {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = doc.internal.pageSize.getWidth();   // 210
  const ph = doc.internal.pageSize.getHeight();   // 297
  const m = 18;
  const cw = pw - m * 2;
  return { doc, pw, ph, m, cw };
}

function addHeader(doc, pw, m, title, version) {
  // Clean navy header bar
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pw, 24, 'F');

  // Thin teal accent stripe
  doc.setFillColor(...TEAL);
  doc.rect(0, 24, pw, 0.8, 'F');

  // Logo in header
  if (LOGO_DATA) {
    try {
      doc.addImage(LOGO_DATA, 'JPEG', m, 2, 14, 20);
    } catch (e) { /* skip */ }
  }

  const textX = LOGO_DATA ? m + 18 : m;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text('ISOGuardian', textX, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(180, 190, 210);
  doc.text('Enterprise ISO Compliance Management', textX, 16.5);
  doc.text(COMPANY.website, textX, 21);

  // Right side: doc title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text(title, pw - m, 11, { align: 'right' });
  if (version) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(180, 190, 210);
    doc.text(version, pw - m, 16, { align: 'right' });
  }
}

function addFooter(doc, pw, ph, m, pageNum, totalPages) {
  const y = ph - 8;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.line(m, y - 3, pw - m, y - 3);

  doc.setFontSize(6);
  doc.setTextColor(...SLATE);
  doc.setFont('helvetica', 'normal');
  doc.text(`${COMPANY.name}  |  Reg: ${COMPANY.reg}  |  ${COMPANY.email}`, m, y);
  const pageText = totalPages ? `Page ${pageNum} of ${totalPages}` : `Page ${pageNum}`;
  doc.text(`${pageText}  |  CONFIDENTIAL`, pw - m, y, { align: 'right' });
}

function addControlBlock(doc, m, cw, ref, ver, effective, updated) {
  const y = 28;
  doc.setFillColor(...LIGHT);
  doc.roundedRect(m, y, cw, 14, 1.5, 1.5, 'F');
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.roundedRect(m, y, cw, 14, 1.5, 1.5, 'S');

  const cols = [
    ['Document Ref', ref],
    ['Version', ver],
    ['Effective', effective],
    ['Updated', updated],
  ];
  const colW = cw / 4;
  cols.forEach(([label, value], i) => {
    const x = m + i * colW + 3;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...SLATE);
    doc.text(label, x, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...ACCENT);
    doc.text(value, x, y + 10);
    if (i < 3) {
      doc.setDrawColor(...BORDER);
      doc.line(m + (i + 1) * colW, y + 2, m + (i + 1) * colW, y + 12);
    }
  });
  return y + 18;
}

function addTitle(doc, text, y, m) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text(text, m, y);
  return y + 10;
}

function addSubtitle(doc, text, y, m) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...TEAL);
  doc.text(text, m, y);
  return y + 6;
}

function heading(doc, text, y, m, num) {
  const label = num ? `${num}. ${text}` : text;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...NAVY);
  doc.text(label, m, y);
  // Subtle teal underline
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.4);
  const w = Math.min(doc.getTextWidth(label), 80);
  doc.line(m, y + 1.5, m + w, y + 1.5);
  return y + 7;
}

function para(doc, text, y, m, cw, opts = {}) {
  const { bold = false, size = 8.5, color = DARK, indent = 0 } = opts;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(size);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, cw - indent);
  doc.text(lines, m + indent, y);
  return y + lines.length * (size * 0.4) + 2.5;
}

function bullet(doc, text, y, m, cw, opts = {}) {
  const { size = 8.5 } = opts;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(size);
  doc.setTextColor(...DARK);
  doc.setTextColor(...TEAL);
  doc.text('\u2022', m + 3, y);
  doc.setTextColor(...DARK);
  const lines = doc.splitTextToSize(text, cw - 10);
  doc.text(lines, m + 8, y);
  return y + lines.length * (size * 0.4) + 1.5;
}

function importantBox(doc, text, y, m, cw) {
  const lines = doc.splitTextToSize(text, cw - 10);
  const boxH = lines.length * 3.5 + 8;
  doc.setFillColor(...RED_BOX);
  doc.setDrawColor(252, 165, 165);
  doc.setLineWidth(0.3);
  doc.roundedRect(m, y - 1, cw, boxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...RED_TXT);
  doc.text('IMPORTANT', m + 4, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...DARK);
  doc.text(lines, m + 4, y + 9);
  return y + boxH + 3;
}

function featureCard(doc, title, desc, y, m, cw, iconText) {
  const cardW = cw;
  const descLines = doc.splitTextToSize(desc, cardW - 16);
  const cardH = descLines.length * 3.5 + 14;

  doc.setFillColor(...LIGHT);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.roundedRect(m, y, cardW, cardH, 2, 2, 'FD');

  // Left accent bar
  doc.setFillColor(...TEAL);
  doc.roundedRect(m, y, 2.5, cardH, 1, 1, 'F');

  // Icon circle
  doc.setFillColor(...ACCENT);
  doc.circle(m + 10, y + 7, 3.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text(iconText, m + 10, y + 8.5, { align: 'center' });

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(title, m + 17, y + 8.5);

  // Desc
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE);
  doc.text(descLines, m + 8, y + 14);

  return y + cardH + 3;
}

function statBlock(doc, value, label, x, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...TEAL);
  doc.text(value, x, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...SLATE);
  doc.text(label, x, y + 5, { align: 'center' });
}

function divider(doc, y, m, cw) {
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.15);
  doc.line(m, y, m + cw, y);
  return y + 4;
}

// ────────────────────────────────────────────────────────────
// Page break helper
// ────────────────────────────────────────────────────────────
function makePageManager(doc, pw, ph, m, headerTitle, headerVer) {
  let pageNum = 1;
  const render = () => {
    addHeader(doc, pw, m, headerTitle, headerVer);
    addFooter(doc, pw, ph, m, pageNum, null);
  };
  const newPage = () => {
    doc.addPage();
    pageNum++;
    render();
    return 32;
  };
  const bp = (y, need = 24) => (y + need > ph - 16) ? newPage() : y;
  const finalize = () => {
    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      if (i > 1) addHeader(doc, pw, m, headerTitle, headerVer);
      addFooter(doc, pw, ph, m, i, total);
    }
  };
  render();
  return { bp, newPage, finalize, getPage: () => pageNum };
}

// ============================================================
// DOCUMENT 1: Terms of Service v1.1
// ============================================================
function generateTermsOfService() {
  const { doc, pw, ph, m, cw } = createDoc();
  const pg = makePageManager(doc, pw, ph, m, 'Terms of Service', 'Version 1.1');

  let y = addControlBlock(doc, m, cw, 'IG-LEGAL-TOS', 'v1.1', 'January 2026', '20 February 2026');
  y = addTitle(doc, 'Terms of Service', y, m);

  // 1
  y = pg.bp(y);
  y = heading(doc, 'Acceptance of Terms', y, m, 1);
  y = para(doc, 'By accessing and using ISOGuardian (\u201Cthe Service\u201D), you accept and agree to be bound by these Terms of Service, our Privacy Policy, POPIA Compliance Policy, and PAIA Manual (collectively, \u201Cthe Terms\u201D). If you do not agree, do not use the Service. If acting for a company, you warrant authority to bind it.', y, m, cw);
  y = para(doc, 'These Terms are governed by the laws of the Republic of South Africa, including the Consumer Protection Act 68 of 2008 (CPA), the Protection of Personal Information Act 4 of 2013 (POPIA), and the Electronic Communications and Transactions Act 25 of 2002 (ECTA).', y, m, cw);

  // 2
  y = pg.bp(y);
  y = heading(doc, 'Service Description', y, m, 2);
  y = para(doc, 'ISOGuardian is a cloud-based ISO compliance management platform that provides:', y, m, cw);
  for (const f of [
    'ISO compliance management across ISO 9001:2015, ISO 14001:2015, and ISO 45001:2018',
    'Document management \u2014 upload, store, organise, and retrieve ISO documentation with automated numbering and Activity Trail logging',
    'Non-Conformance Report (NCR) tracking \u2014 full lifecycle management from creation through corrective action to closure',
    'Audit scheduling and management \u2014 internal and external audit scheduling with close-out documentation per ISO 19011:2018',
    'Management review scheduling and documentation per ISO 9001:9.3, including meeting minutes, decisions, and action items',
    'Compliance scoring and reporting across all supported standards, organised by clause',
    'Activity Trail \u2014 comprehensive audit logging for ISO 7.5.3 traceability',
    'Branded PDF document exports with company branding and signature blocks',
  ]) {
    y = pg.bp(y, 8);
    y = bullet(doc, f, y, m, cw);
  }

  // 3
  y = pg.bp(y);
  y = heading(doc, 'Platform Development & Future Features', y, m, 3);
  y = para(doc, 'ISOGuardian is an actively developed platform. We continuously enhance the Service by adding new features, improving existing functionality, and expanding standards coverage.', y, m, cw);
  y = para(doc, 'No Commitment: References to planned or future features do not constitute a commitment that such features will be delivered by any specific date.', y, m, cw, { bold: true, size: 7.5 });
  y = para(doc, 'Feature Changes: We reserve the right to modify, enhance, or retire features with thirty (30) days\u2019 notice. Core functionality will not be removed during your subscription term without equivalent replacement.', y, m, cw, { bold: true, size: 7.5 });

  // 4
  y = pg.bp(y);
  y = heading(doc, 'User Responsibilities', y, m, 4);
  y = para(doc, 'You agree to:', y, m, cw);
  for (const r of [
    'Provide accurate information and maintain its accuracy',
    'Keep credentials confidential and notify us of any suspected unauthorised access',
    'Use the Service in compliance with all applicable South African laws',
    'Ensure personal information uploaded has a lawful basis under POPIA',
    'Not reverse-engineer, decompile, or derive source code of the Platform',
    'Not upload malicious content or material infringing third-party IP rights',
    'Maintain your own backups of critical data',
  ]) {
    y = pg.bp(y, 6);
    y = bullet(doc, r, y, m, cw);
  }

  // 5
  y = pg.bp(y);
  y = heading(doc, 'Data Ownership & License', y, m, 5);
  y = para(doc, 'Your Data: You retain all rights to data you upload to ISOGuardian.', y, m, cw, { bold: true });
  y = para(doc, 'License Grant: You grant us a limited licence to store, process, and display your data solely for providing the Service.', y, m, cw);
  y = para(doc, 'Our IP: The Platform, including software, design, templates, branded export formats, and documentation, is owned by ISOGuardian (Pty) Ltd. You are granted a non-exclusive, non-transferable licence for the duration of your subscription.', y, m, cw);

  // 6
  y = pg.bp(y);
  y = heading(doc, 'Limitation of Liability', y, m, 6);
  y = importantBox(doc, 'ISOGuardian is a management tool designed to assist with compliance management. It does not guarantee ISO certification, 100% compliance with any standard, elimination of all compliance risks, or that any feature will produce a particular regulatory outcome. You remain solely responsible for achieving and maintaining compliance.', y, m, cw);
  y = para(doc, 'Exclusion: To the maximum extent permitted by law, we are not liable for indirect, incidental, special, or consequential damages, including loss of profits, data, or goodwill.', y, m, cw);
  y = para(doc, 'Maximum Liability: Our total aggregate liability shall not exceed fees paid by you in the 12 months preceding the claim.', y, m, cw);

  // 7
  y = pg.bp(y);
  y = heading(doc, 'Service Availability', y, m, 7);
  y = para(doc, 'Uptime Target: We target 99% monthly uptime. This excludes scheduled maintenance, force majeure, and third-party outages.', y, m, cw);
  y = para(doc, 'Maintenance: Communicated at least 48 hours in advance where practicable.', y, m, cw);
  y = para(doc, 'Support: Email support during business hours (Monday\u2013Friday, 08:00\u201317:00 SAST, excl. SA public holidays).', y, m, cw);

  // 8
  y = pg.bp(y);
  y = heading(doc, 'Payment & Subscription', y, m, 8);
  y = para(doc, 'Billing: Subscription-based. All amounts in ZAR, exclusive of VAT.', y, m, cw);
  y = para(doc, 'Payment: Due in advance on the 1st of each month via EFT. Late payment beyond 7 days may restrict access; beyond 14 days, suspension.', y, m, cw);
  y = para(doc, 'Price Changes: Once per annum with 30 days\u2019 notice. Increases capped at 10% or CPI + 2%, whichever is greater.', y, m, cw);

  // 9
  y = pg.bp(y);
  y = heading(doc, 'Cancellation & Refunds', y, m, 9);
  y = para(doc, 'CPA Cooling-Off: Where the CPA applies, cancel within 5 business days of signup for a full refund less prorated usage.', y, m, cw);
  y = para(doc, 'Month-to-Month: Cancel with 30 days\u2019 written notice. Effective at end of billing cycle.', y, m, cw);
  y = para(doc, 'Fixed-Term: Early cancellation subject to a reasonable termination fee calculated per CPA Section 14.', y, m, cw);

  // 10
  y = pg.bp(y);
  y = heading(doc, 'Account Termination', y, m, 10);
  y = para(doc, 'By You: Contact support to terminate your account.', y, m, cw);
  y = para(doc, 'By Us: We may suspend or terminate for breach, non-payment exceeding 30 days, fraud, or abuse. 14 days\u2019 notice and opportunity to remedy provided.', y, m, cw);
  y = para(doc, 'Data Retention: Data retained for 30 days post-termination for export, then permanently deleted.', y, m, cw);

  // 11
  y = pg.bp(y);
  y = heading(doc, 'Data Protection & POPIA', y, m, 11);
  y = para(doc, 'We process personal information under POPIA. You are the Responsible Party; ISOGuardian is the Operator.', y, m, cw);
  y = para(doc, 'Data Hosting: Supabase infrastructure in the EU (London), compliant under POPIA Section 72.', y, m, cw);
  y = para(doc, 'Security: AES-256 encryption at rest, TLS in transit, Row Level Security, role-based access, audit logging.', y, m, cw);
  y = para(doc, 'Breach Notification: Within 72 hours per POPIA Section 22.', y, m, cw);

  // 12
  y = pg.bp(y);
  y = heading(doc, 'Security', y, m, 12);
  for (const s of [
    'AES-256 encryption at rest and TLS 1.2+ in transit',
    'Row Level Security (RLS) for multi-tenant data isolation',
    'Role-based access controls with company-scoped permissions',
    'Comprehensive audit logging of all actions',
    'Cloudflare Turnstile CAPTCHA protection',
    'Session management with automatic timeout',
  ]) {
    y = pg.bp(y, 6);
    y = bullet(doc, s, y, m, cw);
  }

  // 13-16
  y = pg.bp(y);
  y = heading(doc, 'Changes to Terms', y, m, 13);
  y = para(doc, 'We may update these Terms with 30 days\u2019 written notice per CPA Section 14(2)(b)(i)(bb). Material changes communicated via email. Continued use constitutes acceptance.', y, m, cw);

  y = pg.bp(y);
  y = heading(doc, 'Force Majeure', y, m, 14);
  y = para(doc, 'Not liable for failure or delay caused by events beyond reasonable control: acts of God, disasters, power outages, internet failures, government actions, pandemics, or third-party provider outages.', y, m, cw);

  y = pg.bp(y);
  y = heading(doc, 'Governing Law', y, m, 15);
  y = para(doc, 'South African law applies. Disputes first to mediation in Gauteng; if unresolved within 30 days, to the courts of South Africa, Gauteng Division.', y, m, cw);

  y = pg.bp(y);
  y = heading(doc, 'Miscellaneous', y, m, 16);
  y = para(doc, 'These Terms, together with your Client Subscription Agreement (if applicable), Privacy Policy, and PAIA Manual, constitute the entire agreement. Invalid provisions do not affect the remainder. Electronic signatures recognised per ECTA.', y, m, cw);

  // Contact
  y = pg.bp(y, 24);
  y = divider(doc, y, m, cw);
  y = heading(doc, 'Contact Information', y, m);
  y = para(doc, `Information Officer & Director: ${COMPANY.director}`, y, m, cw, { bold: true });
  y = para(doc, `Email: ${COMPANY.email}  |  Address: ${COMPANY.address}`, y, m, cw);
  y += 3;
  y = para(doc, `${COMPANY.name}  |  Registration: ${COMPANY.reg}  |  VAT: Pending`, y, m, cw, { size: 6.5, color: SLATE });

  pg.finalize();
  return doc;
}

// ============================================================
// DOCUMENT 2: POPIA & Privacy Policy
// ============================================================
function generatePOPIA() {
  const { doc, pw, ph, m, cw } = createDoc();
  const pg = makePageManager(doc, pw, ph, m, 'POPIA & Privacy Policy', 'Version 1.0');

  let y = addControlBlock(doc, m, cw, 'IG-LEGAL-POPIA', 'v1.0', 'January 2026', 'February 2026');
  y = addTitle(doc, 'POPIA Compliance & Data Protection', y, m);
  y = para(doc, 'ISOGuardian is committed to protecting your personal information in accordance with the Protection of Personal Information Act (POPIA), 2013.', y, m, cw);

  y = pg.bp(y);
  y = heading(doc, 'Information We Collect', y, m);
  y = para(doc, 'Account Information: Name, email, company name, role', y, m, cw, { bold: true });
  y = para(doc, 'Compliance Data: Documents, NCRs, audit records, compliance scores', y, m, cw, { bold: true });
  y = para(doc, 'Usage Data: Login times, feature usage (for service improvement)', y, m, cw, { bold: true });

  y = pg.bp(y);
  y = heading(doc, 'How We Protect Your Data', y, m);
  for (const [title, desc] of [
    ['256-bit Encryption', 'All data transmitted and stored is encrypted using industry-standard AES-256 encryption.'],
    ['Multi-Tenant Isolation', 'Your company\u2019s data is completely isolated through database-enforced Row Level Security. Other companies cannot access your information.'],
    ['Secure Data Centres', 'Data hosted in EU (London) on Supabase infrastructure with SOC 2 Type II certification.'],
    ['Role-Based Access Control', 'Only authorised users within your company can access specific data based on their assigned role.'],
  ]) {
    y = pg.bp(y, 12);
    y = para(doc, title, y, m, cw, { bold: true, color: ACCENT });
    y = para(doc, desc, y, m, cw, { indent: 4 });
  }

  y = pg.bp(y);
  y = heading(doc, 'Your Rights Under POPIA', y, m);
  for (const r of [
    'Right to Access \u2014 Request a copy of all your personal data',
    'Right to Correction \u2014 Update or correct inaccurate information',
    'Right to Deletion \u2014 Request permanent deletion of your data',
    'Right to Data Portability \u2014 Export your data in machine-readable format',
    'Right to Object \u2014 Object to processing of your personal information',
  ]) {
    y = pg.bp(y, 6);
    y = bullet(doc, r, y, m, cw);
  }

  y = pg.bp(y);
  y = heading(doc, 'Data Retention', y, m);
  y = bullet(doc, 'Active accounts: Duration of subscription + 30 days', y, m, cw);
  y = bullet(doc, 'Compliance records: As required by ISO standards (typically 3 years)', y, m, cw);
  y = bullet(doc, 'After account closure: 30 days grace period, then permanent deletion', y, m, cw);

  y = pg.bp(y);
  y = heading(doc, 'Third-Party Services', y, m);
  y = para(doc, 'Supabase (Database & Auth): EU servers, SOC 2 Type II certified', y, m, cw, { bold: true });
  y = para(doc, 'Vercel (Hosting): Global CDN, ISO 27001 certified', y, m, cw, { bold: true });
  y = para(doc, 'We do not sell, rent, or share your data with third parties for marketing purposes.', y, m, cw, { size: 7.5, color: SLATE });

  y = pg.bp(y, 22);
  y = divider(doc, y, m, cw);
  y = heading(doc, 'Contact Information Officer', y, m);
  y = para(doc, `Information Officer: ${COMPANY.director}`, y, m, cw, { bold: true });
  y = para(doc, `Email: ${COMPANY.email}  |  Response Time: Within 30 days as required by POPIA`, y, m, cw);
  y += 3;
  y = para(doc, `Last Updated: February 2026  |  Information Regulator Registration: Pending  |  ${COMPANY.name}  |  Reg: ${COMPANY.reg}`, y, m, cw, { size: 6, color: SLATE });

  pg.finalize();
  return doc;
}

// ============================================================
// DOCUMENT 3: Client Subscription & SLA v1.0 (PRIVATE)
// ============================================================
function generateSLA() {
  const { doc, pw, ph, m, cw } = createDoc();
  const pg = makePageManager(doc, pw, ph, m, 'Client Subscription & SLA', 'Version 1.0');

  let y = addControlBlock(doc, m, cw, 'IG-LEGAL-SLA', 'v1.0', 'January 2026', 'February 2026');
  y = addTitle(doc, 'Client Subscription & Service Level Agreement', y, m);

  y = heading(doc, 'Parties', y, m, 1);
  y = para(doc, `Service Provider: ${COMPANY.name}, Registration: ${COMPANY.reg}, represented by ${COMPANY.director} (Director)`, y, m, cw);
  y = para(doc, 'Client: As specified in the signed Subscription Agreement', y, m, cw);

  y = pg.bp(y);
  y = heading(doc, 'Service Description', y, m, 2);
  y = para(doc, 'ISOGuardian provides a cloud-based ISO compliance management platform covering ISO 9001:2015, ISO 14001:2015, and ISO 45001:2018. The Service includes document management, NCR tracking, audit scheduling, management review documentation, compliance scoring, activity trail, and branded PDF exports.', y, m, cw);

  y = pg.bp(y);
  y = heading(doc, 'Subscription Terms', y, m, 3);
  y = para(doc, 'Term: 12-month fixed term from the Commencement Date, renewing automatically unless terminated per Clause 8.', y, m, cw);
  y = para(doc, 'Billing: Monthly in advance on the 1st of each month via EFT. All amounts in ZAR, exclusive of VAT (15%).', y, m, cw);
  y = para(doc, 'Late Payment: Access restricted after 7 days; suspended after 14 days.', y, m, cw);
  y = para(doc, 'Price Adjustment: Once per annum with 30 days\u2019 notice. Capped at 10% or CPI + 2%, whichever is greater.', y, m, cw);

  y = pg.bp(y);
  y = heading(doc, 'Service Level Agreement', y, m, 4);
  y = para(doc, 'Uptime Target: 99% monthly uptime, measured as total minutes minus downtime divided by total minutes.', y, m, cw, { bold: true });
  y = para(doc, 'Exclusions: Scheduled maintenance (48 hours\u2019 notice), force majeure, third-party outages (Supabase, Vercel, Cloudflare), and Client-caused issues.', y, m, cw);

  y = pg.bp(y);
  y = para(doc, 'Response Times:', y, m, cw, { bold: true, color: ACCENT });
  for (const [sev, resp, res] of [
    ['Critical (service down)', '4 business hours', 'Best effort same-day'],
    ['High (feature impaired)', '8 business hours', '2 business days'],
    ['Medium (workaround exists)', '2 business days', '5 business days'],
    ['Low (enhancement request)', '5 business days', 'Next release cycle'],
  ]) {
    y = pg.bp(y, 6);
    y = bullet(doc, `${sev}: Response \u2014 ${resp}  |  Resolution \u2014 ${res}`, y, m, cw);
  }
  y = para(doc, 'Business Hours: Monday\u2013Friday, 08:00\u201317:00 SAST, excluding SA public holidays.', y, m, cw);

  y = pg.bp(y);
  y = heading(doc, 'Service Credits', y, m, 5);
  y = para(doc, 'If monthly uptime falls below 99%, the Client is entitled to service credits:', y, m, cw);
  y = bullet(doc, '95%\u201398.99% uptime: 10% credit on monthly fee', y, m, cw);
  y = bullet(doc, '90%\u201394.99% uptime: 25% credit on monthly fee', y, m, cw);
  y = bullet(doc, 'Below 90% uptime: 50% credit on monthly fee', y, m, cw);
  y = para(doc, 'Maximum aggregate credits: 50% of monthly fee. Credits applied to subsequent invoices.', y, m, cw, { size: 7.5, color: SLATE });

  y = pg.bp(y);
  y = heading(doc, 'Data Protection & Security', y, m, 6);
  y = para(doc, 'POPIA Roles: Client is the Responsible Party; ISOGuardian is the Operator.', y, m, cw);
  y = para(doc, 'Data Hosting: Supabase (EU \u2014 London), SOC 2 Type II certified.', y, m, cw);
  y = para(doc, 'Encryption: AES-256 at rest, TLS 1.2+ in transit.', y, m, cw);
  y = para(doc, 'Isolation: Row-Level Security (RLS) enforced at database level.', y, m, cw);
  y = para(doc, 'Breach Notification: Within 72 hours per POPIA Section 22.', y, m, cw);

  y = pg.bp(y);
  y = heading(doc, 'Limitation of Liability', y, m, 7);
  y = importantBox(doc, 'ISOGuardian is a compliance management tool. It does not guarantee ISO certification or audit success. The Client remains solely responsible for compliance outcomes. Maximum aggregate liability: fees paid in the 12 months preceding the claim.', y, m, cw);

  y = pg.bp(y);
  y = heading(doc, 'Termination', y, m, 8);
  y = para(doc, 'CPA Cooling-Off: 5 business days from date of signing (distance selling).', y, m, cw);
  y = para(doc, 'Early Termination (months 1\u20136): 50% of remaining term fees.', y, m, cw);
  y = para(doc, 'Early Termination (months 7\u201312): 25% of remaining term fees.', y, m, cw);
  y = para(doc, 'Renewal Cancellation: 30 days\u2019 written notice before renewal date.', y, m, cw);
  y = para(doc, 'Post-Termination: Data available for export for 30 days, then permanently deleted.', y, m, cw);

  y = pg.bp(y);
  y = heading(doc, 'Governing Law & Disputes', y, m, 9);
  y = para(doc, 'South African law applies. Disputes referred to mediation in Gauteng. If unresolved within 30 days, to the courts of South Africa, Gauteng Division.', y, m, cw);

  // Signature block
  y = pg.bp(y, 55);
  y = divider(doc, y, m, cw);
  y = heading(doc, 'Signatures', y, m);
  y += 2;

  const colW = cw / 2 - 5;

  // Service Provider
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...ACCENT);
  doc.text('Service Provider', m, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...DARK);
  doc.text(COMPANY.name, m, y + 5);
  doc.text('Signature: ___________________________', m, y + 16);
  doc.text(`Name: ${COMPANY.director}`, m, y + 23);
  doc.text('Title: Director', m, y + 28);
  doc.text('Date: ___________________________', m, y + 33);

  // Client
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...ACCENT);
  doc.text('Client', m + colW + 10, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...DARK);
  doc.text('Company: ___________________________', m + colW + 10, y + 5);
  doc.text('Signature: ___________________________', m + colW + 10, y + 16);
  doc.text('Name: ___________________________', m + colW + 10, y + 23);
  doc.text('Title: ___________________________', m + colW + 10, y + 28);
  doc.text('Date: ___________________________', m + colW + 10, y + 33);

  pg.finalize();
  return doc;
}

// ============================================================
// DOCUMENT 4: Company Profile (THE SHOWSTOPPER)
// ============================================================
function generateCompanyProfile() {
  const { doc, pw, ph, m, cw } = createDoc();
  const pg = makePageManager(doc, pw, ph, m, 'Company Profile', '2026');

  // ── PAGE 1: COVER ──
  // Full-page navy background with centred branding
  doc.setFillColor(...NAVY);
  doc.rect(0, 24.8, pw, ph - 24.8, 'F');

  // Decorative teal accent shapes
  doc.setFillColor(20, 148, 156, 0.15);
  doc.circle(pw * 0.8, ph * 0.3, 60, 'F');
  doc.setFillColor(79, 70, 160, 0.1);
  doc.circle(pw * 0.2, ph * 0.7, 45, 'F');

  // Large centred logo
  if (LOGO_DATA) {
    try {
      doc.addImage(LOGO_DATA, 'JPEG', pw / 2 - 18, 55, 36, 52);
    } catch (e) { /* skip */ }
  }

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...WHITE);
  doc.text('ISOGuardian', pw / 2, 125, { align: 'center' });

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...TEAL);
  doc.text('Your Shield Against Non-Compliance', pw / 2, 135, { align: 'center' });

  // Horizontal rule
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.5);
  doc.line(pw / 2 - 30, 142, pw / 2 + 30, 142);

  // Sub-info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 190, 210);
  doc.text('Enterprise ISO Compliance Management', pw / 2, 150, { align: 'center' });
  doc.text('South Africa', pw / 2, 157, { align: 'center' });

  // Stats row on cover
  const statsY = 180;
  doc.setFillColor(30, 35, 60);
  doc.roundedRect(m + 5, statsY - 8, cw - 10, 28, 3, 3, 'F');

  const statPositions = [
    { value: '3', label: 'ISO Standards', x: m + cw * 0.17 },
    { value: '99%', label: 'Uptime Target', x: m + cw * 0.39 },
    { value: 'AES-256', label: 'Encryption', x: m + cw * 0.61 },
    { value: 'SOC 2', label: 'Certified Infra', x: m + cw * 0.83 },
  ];
  statPositions.forEach(({ value, label, x }) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...TEAL);
    doc.text(value, x, statsY + 4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(150, 160, 180);
    doc.text(label, x, statsY + 10, { align: 'center' });
  });

  // Bottom of cover
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 130, 150);
  doc.text(`${COMPANY.name}  |  Reg: ${COMPANY.reg}`, pw / 2, ph - 30, { align: 'center' });
  doc.text(`${COMPANY.email}  |  ${COMPANY.website}`, pw / 2, ph - 25, { align: 'center' });
  doc.text('CONFIDENTIAL', pw / 2, ph - 18, { align: 'center' });

  // ── PAGE 2: WHO WE ARE ──
  doc.addPage();
  addHeader(doc, pw, m, 'Company Profile', '2026');

  let y = 32;
  y = addTitle(doc, 'Who We Are', y, m);
  y = addSubtitle(doc, 'Built in South Africa. Built for compliance.', y, m);
  y += 2;

  y = para(doc, 'ISOGuardian is a South African technology company on a mission to make ISO compliance accessible, affordable, and effortless for businesses of all sizes.', y, m, cw, { size: 9 });
  y += 1;
  y = para(doc, 'We believe that compliance shouldn\u2019t be a burden. It should be a competitive advantage. Our platform replaces the spreadsheets, filing cabinets, and manual processes that cost businesses thousands of hours each year \u2014 with a single, intelligent system that does the heavy lifting for you.', y, m, cw);
  y += 1;
  y = para(doc, 'Founded in 2026 by Tyreece Kruger, ISOGuardian was born from first-hand experience of the pain points that South African businesses face when pursuing and maintaining ISO certification. We\u2019re not just building software \u2014 we\u2019re building the future of compliance in Africa.', y, m, cw);

  y += 4;
  y = divider(doc, y, m, cw);

  // Company details in clean two-column layout
  y = heading(doc, 'Company Details', y, m);
  const details = [
    ['Registered Name', COMPANY.name],
    ['Registration', COMPANY.reg],
    ['Director', COMPANY.director],
    ['Information Officer', COMPANY.director],
    ['Email', COMPANY.email],
    ['Website', COMPANY.website],
    ['Phone', COMPANY.phone],
    ['Address', COMPANY.address],
    ['VAT', 'Pending'],
  ];
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    doc.text(label, m + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...NAVY);
    doc.text(value, m + 42, y);
    y += 4.5;
  });

  // ── PAGE 3: THE PLATFORM ──
  doc.addPage();
  addHeader(doc, pw, m, 'Company Profile', '2026');

  y = 32;
  y = addTitle(doc, 'The Platform', y, m);
  y = addSubtitle(doc, 'Everything you need. Nothing you don\u2019t.', y, m);
  y += 2;

  y = para(doc, 'ISOGuardian replaces fragmented tools with one unified platform. Every feature is purpose-built for ISO compliance \u2014 designed by people who understand what auditors expect and what quality managers need.', y, m, cw);
  y += 2;

  const features = [
    ['01', 'Document Management', 'Upload, organise, and retrieve ISO documentation with automated document numbering (IG-[CODE]-DOC-001), version control, and full Activity Trail logging. Never lose a document again.'],
    ['02', 'NCR Tracking', 'Full lifecycle management from creation through root cause analysis and corrective action to formal close-out. Track every non-conformance from discovery to resolution.'],
    ['03', 'Audit Scheduling', 'Internal and external audit scheduling with close-out reports compliant with ISO 19011:2018. Automated reminders ensure nothing falls through the cracks.'],
    ['04', 'Management Reviews', 'Per ISO 9001:9.3 \u2014 meeting minutes, decisions, action items, and branded PDF export. Management reviews become effortless, not dreaded.'],
    ['05', 'Compliance Scoring', 'Clause-by-clause tracking per standard with aggregated scoring dashboards. Know exactly where you stand at a glance \u2014 and where you need to focus.'],
    ['06', 'Activity Trail', 'Immutable audit log providing full traceability per ISO 7.5.3. Every action recorded, every change tracked, every export logged.'],
  ];

  for (const [num, title, desc] of features) {
    y = pg.bp(y, 20);
    y = featureCard(doc, title, desc, y, m, cw, num);
  }

  // ── PAGE 4: STANDARDS + SECURITY ──
  doc.addPage();
  addHeader(doc, pw, m, 'Company Profile', '2026');

  y = 32;
  y = addTitle(doc, 'Standards We Support', y, m);
  y = addSubtitle(doc, 'Built for the standards that matter most.', y, m);
  y += 2;

  const standards = [
    ['ISO 9001:2015', 'Quality Management Systems', 'The international benchmark for quality. We cover every clause from Context of the Organisation (4) through Improvement (10).'],
    ['ISO 14001:2015', 'Environmental Management Systems', 'Manage your environmental obligations with the same rigour as quality. Full clause coverage with environmental-specific compliance tracking.'],
    ['ISO 45001:2018', 'Occupational Health & Safety', 'Protect your people. Full OH&S management with hazard identification, risk assessment tracking, and incident management.'],
  ];

  for (const [std, name, desc] of standards) {
    y = pg.bp(y, 22);
    // Standard card
    doc.setFillColor(...LIGHT);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(m, y, cw, 18, 2, 2, 'FD');

    // Teal badge
    doc.setFillColor(...TEAL);
    doc.roundedRect(m + 3, y + 3, 30, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...WHITE);
    doc.text('INCLUDED', m + 18, y + 7.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...NAVY);
    doc.text(std, m + 36, y + 7.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...SLATE);
    doc.text(name, m + 36, y + 12);

    doc.setFontSize(7);
    const descLines = doc.splitTextToSize(desc, cw - 10);
    doc.text(descLines[0] || '', m + 5, y + 17);

    y += 22;
  }

  y += 2;
  y = para(doc, 'ISOGuardian (Pty) Ltd is currently working towards ISO 27001:2022 (Information Security) certification for our own operations \u2014 because we hold ourselves to the same standards we help you achieve.', y, m, cw, { size: 7.5, color: SLATE });

  y += 4;
  y = divider(doc, y, m, cw);

  // Security section
  y = addTitle(doc, 'Enterprise Security', y, m);
  y = addSubtitle(doc, 'Your data is our responsibility. We take it seriously.', y, m);
  y += 2;

  const securityItems = [
    ['AES-256 Encryption', 'Data encrypted at rest and in transit via TLS 1.2+. Industry-standard cryptographic protection.'],
    ['Row-Level Security', 'Database-enforced multi-tenant isolation. No company can ever access another company\u2019s data. Not through the UI, not through the API, not ever.'],
    ['POPIA Compliant', 'Information Officer appointed. Breach notification within 72 hours. Full data export rights. Your data, your control.'],
    ['Immutable Audit Trail', 'Every action logged and tamper-proof. Full POPIA-compliant access records for complete accountability.'],
    ['SOC 2 Infrastructure', 'Hosted on Supabase (EU \u2014 London) with SOC 2 Type II certification. Enterprise-grade infrastructure.'],
    ['Bot Protection', 'Cloudflare Turnstile CAPTCHA prevents automated attacks. Session management with automatic timeout.'],
  ];
  for (const [title, desc] of securityItems) {
    y = pg.bp(y, 12);
    y = para(doc, title, y, m, cw, { bold: true, color: NAVY, size: 8.5 });
    y = para(doc, desc, y, m, cw, { size: 7.5, indent: 4, color: SLATE });
  }

  // ── PAGE 5: WHY ISOGUARDIAN + CONTACT ──
  doc.addPage();
  addHeader(doc, pw, m, 'Company Profile', '2026');

  y = 32;
  y = addTitle(doc, 'Why ISOGuardian?', y, m);
  y += 2;

  const whyItems = [
    ['Stop wasting time on spreadsheets', 'The average quality manager spends 15+ hours per week on manual compliance tracking. ISOGuardian reduces that to minutes.'],
    ['Be audit-ready, always', 'No more last-minute scrambles before an audit. Your documentation, NCRs, and records are always up to date, always accessible, always organised.'],
    ['Built for South Africa', 'POPIA-compliant from day one. ZAR pricing. South African support. We understand the local regulatory landscape because we operate in it.'],
    ['One platform, three standards', 'Manage ISO 9001, 14001, and 45001 from a single dashboard. No more juggling multiple systems, spreadsheets, or consultants.'],
    ['Professional exports that impress', 'Generate branded PDF reports with your company logo, signature blocks, and document control \u2014 the kind of documentation that makes auditors smile.'],
    ['Your data stays yours', 'Full data export at any time. 30-day post-termination access. We don\u2019t hold your data hostage.'],
  ];
  for (const [title, desc] of whyItems) {
    y = pg.bp(y, 14);
    y = para(doc, title, y, m, cw, { bold: true, color: NAVY });
    y = para(doc, desc, y, m, cw, { size: 7.5, indent: 4, color: SLATE });
  }

  y += 4;
  y = pg.bp(y, 45);
  y = divider(doc, y, m, cw);

  // Final CTA box
  doc.setFillColor(25, 30, 52);
  doc.roundedRect(m, y, cw, 38, 3, 3, 'F');
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.4);
  doc.roundedRect(m, y, cw, 38, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text('Ready to get compliant?', pw / 2, y + 10, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 190, 210);
  doc.text('Book a free 30-minute demo. No commitment. No credit card required.', pw / 2, y + 17, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...TEAL);
  doc.text(COMPANY.email, pw / 2, y + 25, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 160, 180);
  doc.text(`${COMPANY.website}  |  ${COMPANY.phone}  |  ${COMPANY.address}`, pw / 2, y + 31, { align: 'center' });

  // Finalize all page headers/footers
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (i > 1) addHeader(doc, pw, m, 'Company Profile', '2026');
    addFooter(doc, pw, ph, m, i, total);
  }

  return doc;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  for (const dir of [OUTPUT_DIR, PUBLIC_DOCS]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  console.log('Generating ISOGuardian Legal PDFs v2...\n');

  const documents = [
    { name: 'ISOGuardian_Terms_of_Service_v1.1', gen: generateTermsOfService, public: true },
    { name: 'ISOGuardian_POPIA_Privacy_Policy_v1.0', gen: generatePOPIA, public: true },
    { name: 'ISOGuardian_Company_Profile_2026', gen: generateCompanyProfile, public: true },
    { name: 'ISOGuardian_Client_Subscription_SLA_v1.0', gen: generateSLA, public: false },
  ];

  for (const { name, gen, public: isPublic } of documents) {
    try {
      const d = gen();
      const buf = Buffer.from(d.output('arraybuffer'));

      // Always save to generated-pdfs/
      const outPath = join(OUTPUT_DIR, `${name}.pdf`);
      writeFileSync(outPath, buf);

      // Copy public ones to public/docs/
      if (isPublic) {
        copyFileSync(outPath, join(PUBLIC_DOCS, `${name}.pdf`));
        console.log(`  \u2713 ${name}.pdf  (public)`);
      } else {
        console.log(`  \u2713 ${name}.pdf  (private \u2014 generated-pdfs/ only)`);
      }
    } catch (err) {
      console.error(`  \u2717 ${name}: ${err.message}`);
    }
  }

  console.log(`\nPublic docs:  ${PUBLIC_DOCS}`);
  console.log(`All docs:     ${OUTPUT_DIR}`);
  console.log('Done.');
}

main().catch(console.error);
