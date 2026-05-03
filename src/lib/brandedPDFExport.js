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
 * Add an image to a PDF preserving its natural aspect ratio inside a bounding box.
 * Used for client-uploaded logos which arrive in any shape (square, wide, tall).
 * Centres the image inside the box.
 */
export const fitImage = (doc, dataUrl, x, y, maxW, maxH) => {
  try {
    const props = doc.getImageProperties(dataUrl);
    const ratio = props.width / props.height;
    let w = maxW;
    let h = maxW / ratio;
    if (h > maxH) { h = maxH; w = maxH * ratio; }
    const offsetX = x + (maxW - w) / 2;
    const offsetY = y + (maxH - h) / 2;
    doc.addImage(dataUrl, 'PNG', offsetX, offsetY, w, h);
    return { x: offsetX, y: offsetY, w, h };
  } catch (e) {
    return { x, y, w: 0, h: 0 };
  }
};

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
 * @param {string} options.companyLogoUrl - Supabase Storage URL for client's company logo
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
    companyLogoUrl = null,
    contentRenderer = null,
  } = options;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let currentPage = 1;

  // Load company logo (client branding — hero image)
  let companyLogoLoaded = false;
  let companyLogoImg = null;
  if (companyLogoUrl) {
    try {
      const response = await fetch(companyLogoUrl);
      const blob = await response.blob();
      companyLogoImg = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      companyLogoLoaded = true;
    } catch (e) {
      console.warn('Company logo not loaded, continuing without');
    }
  }

  // Load ISOGuardian logo (subtle footer branding)
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
    console.warn('ISOGuardian logo not loaded, continuing without');
  }

  const addHeader = (pageNum) => {
    // Purple header bar
    doc.setFillColor(...PURPLE);
    doc.rect(0, 0, pageWidth, 32, 'F');

    // Client company logo (hero — left side, large)
    let logoX = margin;
    if (companyLogoLoaded && companyLogoImg) {
      try {
        fitImage(doc, companyLogoImg, margin, 3, 26, 26);
        logoX = margin + 30;
      } catch (e) { /* skip logo */ }
    }

    // Company name as header title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...WHITE);
    doc.text(companyName || 'ISOGuardian', logoX, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(220, 220, 255);
    doc.text('ISO Compliance Management', logoX, 20);

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

    // Footer is CLIENT-only branding. ISOGuardian attribution lives subtly in
    // the header ("Powered by ISOGuardian") so the document is unambiguously
    // owned by the client company, not the platform.
    doc.setFontSize(7);
    doc.setTextColor(...GREY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${companyName || 'Company'} — CONFIDENTIAL`, margin, y);
    doc.text(`Printed: ${new Date().toLocaleDateString('en-ZA')}`, pageWidth - margin, y, { align: 'right' });
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
 * Helper: Add ISO §7.5.3 / §9.2 signature blocks. Designed to be reused by
 * any document that requires accountable sign-off (audits, management reviews,
 * approved policies, etc.).
 *
 * @param {jsPDF} doc
 * @param {number} y       Current y-cursor position
 * @param {number} margin
 * @param {number} contentWidth
 * @param {Array<{label, name?, dateLabel, dateValue?}>} blocks  Signature definitions, rendered 2-up
 * @returns {number} new y-cursor
 */
export const addSignatureBlocks = (doc, y, margin, contentWidth, blocks) => {
  if (!blocks || blocks.length === 0) return y;

  const pageHeight = doc.internal.pageSize.getHeight();
  const blockHeight = 40; // each row of 2 blocks needs ~40mm
  const rows = Math.ceil(blocks.length / 2);
  const totalHeight = 12 + (rows * blockHeight);

  // Page break if not enough space
  if (y + totalHeight > pageHeight - 25) {
    doc.addPage();
    y = 20;
  } else {
    y += 4;
  }

  // Section header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PURPLE);
  doc.text('Signatures', margin, y);
  y += 7;

  const colW = (contentWidth - 6) / 2;

  blocks.forEach((b, i) => {
    const xCol = i % 2;
    const xStart = margin + (xCol === 0 ? 0 : colW + 6);

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(b.label, xStart, y);

    // Name printed below if known
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    if (b.name) doc.text(`Name: ${b.name}`, xStart, y + 5);

    // Signature line
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.3);
    doc.line(xStart, y + 18, xStart + colW, y + 18);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('Signature', xStart, y + 22);

    // Date line
    doc.line(xStart, y + 30, xStart + colW, y + 30);
    if (b.dateValue) {
      doc.setFontSize(8);
      doc.setTextColor(...DARK);
      doc.text(b.dateValue, xStart, y + 28);
    }
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(b.dateLabel || 'Date', xStart, y + 34);

    // Move to next row after every 2 blocks
    if (xCol === 1 || i === blocks.length - 1) {
      y += blockHeight;
    }
  });

  return y;
};

/**
 * Quick export functions for each module
 */

export const exportDocumentPDF = async (document, companyName, userName, companyCode, companyLogoUrl) => {
  const docNum = document.doc_number || `IG-${companyCode || 'XX'}-DOC-${String(document.id).slice(-3).toUpperCase()}`;

  const pdf = await createBrandedPDF({
    title: document.name || 'Document',
    docNumber: docNum,
    companyName,
    preparedBy: userName,
    type: 'document',
    companyLogoUrl,
    contentRenderer: (doc, y, margin, contentWidth) => {
      y = addSection(doc, 'Document Details', y, margin);
      y = addField(doc, 'Document Name', document.name, y, margin);
      y = addField(doc, 'Standard', document.standard?.replace('_', ' '), y, margin);
      y = addField(doc, 'Clause', document.clause_name || `Clause ${document.clause}`, y, margin);
      y = addField(doc, 'Type', document.type, y, margin);
      y = addField(doc, 'Version', document.version, y, margin);
      y = addField(doc, 'Status', document.status, y, margin);
      const lastUpdated = document.date_updated || document.updated_at?.split('T')[0] || document.created_at?.split('T')[0];
      y = addField(doc, 'Last Updated', lastUpdated, y, margin);

      // Retention policy (ISO 9001 §7.5.3)
      const retentionLabels = {
        standard_3y: '3 years after supersession (ISO §7.5.3)',
        standard_5y: '5 years after supersession (ISO §7.5.3 extended)',
        standard_7y: '7 years after supersession (SARS / Companies Act)',
        ohs_incident: '7 years after supersession (SA OHS Act s24)',
        employment_plus_5y: 'Employment + 5 years (BCEA + §7.2)',
        medical_40y: '40 years after supersession (SA OHS hazardous regs)',
        indefinite: 'Indefinite',
        no_retention: 'No retention (blank template)',
      };
      if (document.retention_policy) {
        y = addField(doc, 'Retention Policy', retentionLabels[document.retention_policy] || document.retention_policy, y, margin);
      }
      if (document.retention_until) {
        y = addField(doc, 'Retained Until', new Date(document.retention_until).toLocaleDateString('en-ZA'), y, margin);
      }

      // ISO 9001 §7.5.3 documented-information sign-off
      y = addSignatureBlocks(doc, y, margin, contentWidth, [
        { label: 'PREPARED BY', name: userName || '', dateLabel: 'Date', dateValue: lastUpdated || '' },
        { label: 'REVIEWED BY', name: '', dateLabel: 'Review Date', dateValue: '' },
        { label: 'APPROVED BY (Quality Manager)', name: '', dateLabel: 'Approval Date', dateValue: '' },
        { label: 'NEXT REVIEW DUE', name: '', dateLabel: 'Next Review', dateValue: document.next_review_date || '' },
      ]);

      return y;
    },
  });

  pdf.save(`${docNum}_${document.name?.replace(/\s+/g, '_')}.pdf`);
};

export const exportNCRPDF = async (ncr, companyName, userName, companyCode, companyLogoUrl) => {
  const docNum = ncr.doc_number || `IG-${companyCode || 'XX'}-NCR-${String(ncr.ncr_number || '').padStart(3, '0')}`;

  const pdf = await createBrandedPDF({
    title: `Non-Conformance Report: ${ncr.title || ncr.ncr_number}`,
    docNumber: docNum,
    companyName,
    preparedBy: userName,
    type: 'ncr',
    companyLogoUrl,
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

export const exportAuditPDF = async (audit, companyName, userName, companyCode, companyLogoUrl) => {
  const docNum = audit.doc_number || `IG-${companyCode || 'XX'}-AUD-${String(audit.id).slice(-3).toUpperCase()}`;

  const pdf = await createBrandedPDF({
    title: `Audit Report: ${audit.title || audit.audit_type}`,
    docNumber: docNum,
    companyName,
    preparedBy: userName,
    type: 'audit',
    companyLogoUrl,
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

      // ISO 19011 + ISO 9001 §9.2 signature blocks
      const completionDate = audit.completion_date || audit.audit_date || '';
      y = addSignatureBlocks(doc, y, margin, contentWidth, [
        { label: 'LEAD AUDITOR', name: audit.lead_auditor || audit.assigned_auditor_name || '', dateLabel: 'Date', dateValue: completionDate },
        { label: 'AUDITEE REPRESENTATIVE', name: '', dateLabel: 'Date', dateValue: '' },
        { label: 'APPROVED BY (Quality Manager)', name: '', dateLabel: 'Approval Date', dateValue: '' },
        { label: 'REPORT ISSUED TO', name: '', dateLabel: 'Issue Date', dateValue: '' },
      ]);

      return y;
    },
  });

  pdf.save(`${docNum}_Audit_Report.pdf`);
};

export const exportReviewPDF = async (review, companyName, userName, companyCode, companyLogoUrl) => {
  const docNum = review.doc_number || `IG-${companyCode || 'XX'}-MR-${String(review.review_number || '').padStart(3, '0')}`;

  const pdf = await createBrandedPDF({
    title: `Management Review: ${review.review_number || 'N/A'}`,
    docNumber: docNum,
    companyName,
    preparedBy: userName,
    type: 'management_review',
    companyLogoUrl,
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

      // ISO 9001 §9.3 management review sign-off
      y = addSignatureBlocks(doc, y, margin, contentWidth, [
        { label: 'CHAIRPERSON (Top Management)', name: review.chairperson || '', dateLabel: 'Date', dateValue: review.review_date || '' },
        { label: 'QUALITY MANAGER', name: '', dateLabel: 'Date', dateValue: '' },
        { label: 'RECORDED BY', name: userName || '', dateLabel: 'Date', dateValue: review.review_date || '' },
      ]);

      return y;
    },
  });

  pdf.save(`${docNum}_Management_Review.pdf`);
};
