/**
 * ISOGuardian Branded PDF Export
 * 
 * Generates professional, document-controlled PDFs with:
 * - ISOGuardian logo header
 * - Document control block (number, revision, review date)
 * - Company branding
 * - Professional footer with page numbers
 * - Consistent styling for auditor readability
 * 
 * Uses jsPDF (install: npm install jspdf)
 */

import jsPDF from 'jspdf';
import { getCurrentRevision, getNextReviewDate } from './documentNumbering';

// Brand colours
const PURPLE = [124, 58, 237];
const DARK = [30, 27, 75];
const CYAN = [6, 182, 212];
const GREY = [107, 114, 128];
const WHITE = [255, 255, 255];
const LIGHT_BG = [249, 250, 251];

/**
 * Create a branded PDF document
 * @param {Object} options
 * @param {string} options.title - Document title
 * @param {string} options.docNumber - e.g. IG-SH-DOC-001
 * @param {string} options.revision - e.g. Rev 01
 * @param {string} options.reviewDate - e.g. 31 January 2027
 * @param {string} options.companyName - Client company name
 * @param {string} options.preparedBy - User who generated it
 * @param {string} options.type - document | ncr | audit | management_review
 * @param {Function} options.contentRenderer - function(doc, startY) that renders content, returns final Y
 */
export const createBrandedPDF = async (options) => {
  const {
    title = 'Document',
    docNumber = 'IG-XX-DOC-000',
    revision = getCurrentRevision(),
    reviewDate = getNextReviewDate(),
    companyName = 'ISOGuardian',
    preparedBy = '',
    type = 'document',
    contentRenderer = null,
  } = options;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let currentPage = 1;

  // Load logo as base64 (will be embedded)
  let logoLoaded = false;
  let logoImg = null;
  try {
    const response = await fetch('/isoguardian-logo.png');
    const blob = await response.blob();
    logoImg = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    logoLoaded = true;
  } catch (e) {
    console.warn('Logo not loaded, continuing without');
  }

  const addHeader = (pageNum) => {
    // Purple header bar
    doc.setFillColor(...PURPLE);
    doc.rect(0, 0, pageWidth, 32, 'F');

    // Logo
    if (logoLoaded && logoImg) {
      try {
        doc.addImage(logoImg, 'PNG', margin, 3, 26, 26);
      } catch (e) { /* skip logo */ }
    }

    // Title text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...WHITE);
    doc.text('ISOGuardian', logoLoaded ? margin + 30 : margin, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(220, 220, 255);
    doc.text('Enterprise ISO Compliance Management', logoLoaded ? margin + 30 : margin, 20);

    // Page number in header
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text(`Page ${pageNum}`, pageWidth - margin, 14, { align: 'right' });

    // Document control block
    doc.setFillColor(...LIGHT_BG);
    doc.rect(margin, 35, contentWidth, 18, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, 35, contentWidth, 18, 'S');

    doc.setFontSize(8);
    doc.setTextColor(...DARK);

    // Three columns in control block
    const colW = contentWidth / 3;
    doc.setFont('helvetica', 'bold');
    doc.text('Document No.', margin + 4, 41);
    doc.text('Revision', margin + colW + 4, 41);
    doc.text('Date of Review', margin + (colW * 2) + 4, 41);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PURPLE);
    doc.text(docNumber, margin + 4, 48);
    doc.text(revision, margin + colW + 4, 48);
    doc.text(reviewDate, margin + (colW * 2) + 4, 48);

    // Divider lines in control block
    doc.setDrawColor(200, 200, 200);
    doc.line(margin + colW, 35, margin + colW, 53);
    doc.line(margin + (colW * 2), 35, margin + (colW * 2), 53);
  };

  const addFooter = (pageNum) => {
    const y = pageHeight - 12;
    doc.setDrawColor(...GREY);
    doc.line(margin, y - 4, pageWidth - margin, y - 4);

    doc.setFontSize(7);
    doc.setTextColor(...GREY);
    doc.setFont('helvetica', 'normal');
    doc.text('ISOGuardian (Pty) Ltd | Reg: 2026/082362/07 | www.isoguardian.co.za', margin, y);
    doc.text(`Printed: ${new Date().toLocaleDateString('en-ZA')} | CONFIDENTIAL`, pageWidth - margin, y, { align: 'right' });
  };

  // Page 1
  addHeader(1);
  addFooter(1);

  // Document title
  let y = 60;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.text(title, margin, y);
  y += 8;

  // Meta info
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.setFont('helvetica', 'normal');
  if (companyName) {
    doc.text(`Company: ${companyName}`, margin, y);
    y += 5;
  }
  if (preparedBy) {
    doc.text(`Prepared by: ${preparedBy}`, margin, y);
    y += 5;
  }
  doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, y);
  y += 8;

  // Divider
  doc.setDrawColor(...PURPLE);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Content area
  if (contentRenderer) {
    y = contentRenderer(doc, y, margin, contentWidth, pageWidth, pageHeight, addHeader, addFooter);
  }

  return doc;
};

/**
 * Helper: Add a section heading
 */
export const addSection = (doc, text, y, margin) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PURPLE);
  doc.text(text, margin, y);
  return y + 7;
};

/**
 * Helper: Add body text with auto-wrap
 */
export const addText = (doc, text, y, margin, contentWidth, options = {}) => {
  const { bold = false, size = 9, color = DARK } = options;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(size);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, contentWidth);
  doc.text(lines, margin, y);
  return y + (lines.length * (size * 0.45)) + 3;
};

/**
 * Helper: Add a key-value row
 */
export const addField = (doc, label, value, y, margin) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text(label + ':', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  const labelWidth = doc.getTextWidth(label + ': ');
  doc.text(String(value || 'N/A'), margin + labelWidth + 2, y);
  return y + 5.5;
};

/**
 * Helper: Add a table
 */
export const addTable = (doc, headers, rows, y, margin, contentWidth) => {
  const colWidth = contentWidth / headers.length;
  
  // Header row
  doc.setFillColor(...PURPLE);
  doc.rect(margin, y - 4, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  headers.forEach((h, i) => {
    doc.text(h, margin + (i * colWidth) + 2, y);
  });
  y += 6;

  // Data rows
  rows.forEach((row, ri) => {
    if (ri % 2 === 0) {
      doc.setFillColor(...LIGHT_BG);
      doc.rect(margin, y - 4, contentWidth, 6, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    row.forEach((cell, ci) => {
      const text = String(cell || '');
      const truncated = text.length > 40 ? text.substring(0, 37) + '...' : text;
      doc.text(truncated, margin + (ci * colWidth) + 2, y);
    });
    y += 6;
  });

  return y + 4;
};

/**
 * Quick export functions for each module
 */

export const exportDocumentPDF = async (document, companyName, userName, companyCode) => {
  const docNum = document.doc_number || `IG-${companyCode || 'XX'}-DOC-${String(document.id).slice(-3).toUpperCase()}`;
  
  const pdf = await createBrandedPDF({
    title: document.name || 'Document',
    docNumber: docNum,
    companyName,
    preparedBy: userName,
    type: 'document',
    contentRenderer: (doc, y, margin, contentWidth) => {
      y = addSection(doc, 'Document Details', y, margin);
      y = addField(doc, 'Document Name', document.name, y, margin);
      y = addField(doc, 'Standard', document.standard?.replace('_', ' '), y, margin);
      y = addField(doc, 'Clause', document.clause_name || `Clause ${document.clause}`, y, margin);
      y = addField(doc, 'Type', document.type, y, margin);
      y = addField(doc, 'Version', document.version, y, margin);
      y = addField(doc, 'Status', document.status, y, margin);
      y = addField(doc, 'Last Updated', document.date_updated, y, margin);
      return y;
    },
  });

  pdf.save(`${docNum}_${document.name?.replace(/\s+/g, '_')}.pdf`);
};

export const exportNCRPDF = async (ncr, companyName, userName, companyCode) => {
  const docNum = ncr.doc_number || `IG-${companyCode || 'XX'}-NCR-${String(ncr.ncr_number || '').padStart(3, '0')}`;
  
  const pdf = await createBrandedPDF({
    title: `Non-Conformance Report: ${ncr.title || ncr.ncr_number}`,
    docNumber: docNum,
    companyName,
    preparedBy: userName,
    type: 'ncr',
    contentRenderer: (doc, y, margin, contentWidth) => {
      y = addSection(doc, 'NCR Details', y, margin);
      y = addField(doc, 'NCR Number', ncr.ncr_number, y, margin);
      y = addField(doc, 'Title', ncr.title, y, margin);
      y = addField(doc, 'Status', ncr.status, y, margin);
      y = addField(doc, 'Severity', ncr.severity, y, margin);
      y = addField(doc, 'Standard', ncr.standard?.replace('_', ' '), y, margin);
      y = addField(doc, 'Clause', ncr.clause, y, margin);
      y = addField(doc, 'Date Raised', ncr.date_raised || ncr.created_at?.split('T')[0], y, margin);
      y = addField(doc, 'Due Date', ncr.due_date, y, margin);
      y += 4;

      if (ncr.description) {
        y = addSection(doc, 'Description', y, margin);
        y = addText(doc, ncr.description, y, margin, contentWidth);
      }

      if (ncr.root_cause) {
        y = addSection(doc, 'Root Cause Analysis', y, margin);
        y = addText(doc, ncr.root_cause, y, margin, contentWidth);
      }

      if (ncr.corrective_action) {
        y = addSection(doc, 'Corrective Action', y, margin);
        y = addText(doc, ncr.corrective_action, y, margin, contentWidth);
      }

      return y;
    },
  });

  pdf.save(`${docNum}_NCR.pdf`);
};

export const exportAuditPDF = async (audit, companyName, userName, companyCode) => {
  const docNum = audit.doc_number || `IG-${companyCode || 'XX'}-AUD-${String(audit.id).slice(-3).toUpperCase()}`;
  
  const pdf = await createBrandedPDF({
    title: `Audit Report: ${audit.title || audit.audit_type}`,
    docNumber: docNum,
    companyName,
    preparedBy: userName,
    type: 'audit',
    contentRenderer: (doc, y, margin, contentWidth) => {
      y = addSection(doc, 'Audit Information', y, margin);
      y = addField(doc, 'Audit Type', audit.audit_type, y, margin);
      y = addField(doc, 'Title', audit.title, y, margin);
      y = addField(doc, 'Status', audit.status, y, margin);
      y = addField(doc, 'Lead Auditor', audit.lead_auditor, y, margin);
      y = addField(doc, 'Standard', audit.standard?.replace('_', ' '), y, margin);
      y = addField(doc, 'Scheduled Date', audit.scheduled_date, y, margin);
      y = addField(doc, 'Completion Date', audit.completion_date, y, margin);
      y += 4;

      if (audit.scope) {
        y = addSection(doc, 'Scope', y, margin);
        y = addText(doc, audit.scope, y, margin, contentWidth);
      }

      if (audit.findings) {
        y = addSection(doc, 'Findings', y, margin);
        y = addText(doc, audit.findings, y, margin, contentWidth);
      }

      if (audit.observations) {
        y = addSection(doc, 'Observations', y, margin);
        y = addText(doc, audit.observations, y, margin, contentWidth);
      }

      if (audit.evidence_reviewed) {
        y = addSection(doc, 'Evidence Reviewed', y, margin);
        y = addText(doc, audit.evidence_reviewed, y, margin, contentWidth);
      }

      if (audit.conclusion) {
        y = addSection(doc, 'Conclusion', y, margin);
        y = addText(doc, audit.conclusion, y, margin, contentWidth);
      }

      return y;
    },
  });

  pdf.save(`${docNum}_Audit_Report.pdf`);
};

export const exportReviewPDF = async (review, companyName, userName, companyCode) => {
  const docNum = review.doc_number || `IG-${companyCode || 'XX'}-MR-${String(review.review_number || '').padStart(3, '0')}`;
  
  const pdf = await createBrandedPDF({
    title: `Management Review: ${review.review_number || 'N/A'}`,
    docNumber: docNum,
    companyName,
    preparedBy: userName,
    type: 'management_review',
    contentRenderer: (doc, y, margin, contentWidth) => {
      y = addSection(doc, 'Review Details', y, margin);
      y = addField(doc, 'Review Number', review.review_number, y, margin);
      y = addField(doc, 'Review Date', review.review_date, y, margin);
      y = addField(doc, 'Chairperson', review.chairperson, y, margin);
      y = addField(doc, 'Status', review.status, y, margin);
      y += 4;

      if (review.attendees) {
        y = addSection(doc, 'Attendees', y, margin);
        y = addText(doc, review.attendees, y, margin, contentWidth);
      }

      if (review.agenda_items) {
        y = addSection(doc, 'Agenda Items', y, margin);
        y = addText(doc, review.agenda_items, y, margin, contentWidth);
      }

      if (review.minutes) {
        y = addSection(doc, 'Minutes', y, margin);
        y = addText(doc, review.minutes, y, margin, contentWidth);
      }

      if (review.decisions_made) {
        y = addSection(doc, 'Decisions Made', y, margin);
        y = addText(doc, review.decisions_made, y, margin, contentWidth);
      }

      if (review.action_items) {
        y = addSection(doc, 'Action Items', y, margin);
        y = addText(doc, review.action_items, y, margin, contentWidth);
      }

      if (review.improvement_opportunities) {
        y = addSection(doc, 'Improvement Opportunities', y, margin);
        y = addText(doc, review.improvement_opportunities, y, margin, contentWidth);
      }

      if (review.next_review_date) {
        y += 4;
        y = addField(doc, 'Next Review Date', review.next_review_date, y, margin);
      }

      return y;
    },
  });

  pdf.save(`${docNum}_Management_Review.pdf`);
};
