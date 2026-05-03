/**
 * ISOGuardian Template PDF Export — v2.0
 *
 * Renders structured template content into branded PDFs with:
 * - Company personnel auto-population
 * - Cross-referenced document numbering
 * - Colour-coded clause headers
 * - Fill-in field styling
 * - Conservative, professional spacing
 * - Multi-line table support
 */

import jsPDF from 'jspdf'
import { resolveAllPlaceholders, CROSS_REFERENCES, DOC_NUMBER_MAP, TEMPLATES } from './templateData'
import { fitImage } from './brandedPDFExport'

// ─── Brand Palette ───
const PURPLE = [124, 58, 237]
const DARK = [30, 27, 75]
const CYAN = [6, 182, 212]
const GREY = [107, 114, 128]
const WHITE = [255, 255, 255]
const LIGHT_BG = [249, 250, 251]
const LIGHT_PURPLE = [248, 245, 255]
const LIGHT_CYAN = [236, 254, 255]

// Clause colour coding — adds visual hierarchy to ISO sections
const CLAUSE_COLOURS = {
  '4': [99, 102, 241],    // Indigo — Context
  '5': [124, 58, 237],    // Purple — Leadership
  '6': [236, 72, 153],    // Pink — Planning
  '7': [6, 182, 212],     // Cyan — Support
  '8': [34, 197, 94],     // Green — Operation
  '9': [245, 158, 11],    // Amber — Performance Evaluation
  '10': [239, 68, 68],    // Red — Improvement
}

function getClauseColour(heading) {
  const match = heading.match(/\(?\s*Clause\s+(\d+)/i) || heading.match(/^(\d+)\.\s/)
  if (match) return CLAUSE_COLOURS[match[1]] || PURPLE
  return PURPLE
}

/**
 * Generate a branded PDF from a template
 */
export async function generateTemplatePDF(template, options = {}) {
  const {
    companyName = 'Your Company',
    companyCode = 'XX',
    preparedBy = 'System Generated',
    companyLogoUrl = null,
    personnel = {},
    productsServices = '',
    qmsScope = '',
    qualityPolicy = '',
    liveData = null,
  } = options

  const companyData = { companyName, companyCode, preparedBy, personnel, productsServices, qmsScope, qualityPolicy }
  const content = template.content
  const docNumber = resolveAllPlaceholders(content.docNumber || '', companyData, liveData)
  const title = resolveAllPlaceholders(content.title || template.title, companyData, liveData)
  const today = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
  const reviewDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 18
  const contentWidth = pageWidth - margin * 2
  const bottomLimit = pageHeight - 20
  let currentPage = 1

  // ─── LOAD ASSETS ───
  let companyLogoImg = null
  if (companyLogoUrl) {
    try {
      const response = await fetch(companyLogoUrl)
      const blob = await response.blob()
      companyLogoImg = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.readAsDataURL(blob)
      })
    } catch (_e) { /* continue without */ }
  }

  let isoLogo = null
  try {
    const response = await fetch('/isoguardian-logo.png')
    const blob = await response.blob()
    isoLogo = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch (_e) { /* continue without */ }

  // ─── PAGE FURNITURE ───
  function addHeader(pageNum) {
    // Compact purple header
    doc.setFillColor(...PURPLE)
    doc.rect(0, 0, pageWidth, 14, 'F')

    let logoX = margin
    if (companyLogoImg) {
      try {
        fitImage(doc, companyLogoImg, margin, 1.5, 11, 11)
        logoX = margin + 13
      } catch (_e) { /* skip */ }
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...WHITE)
    doc.text(companyName, logoX, 7)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(220, 220, 255)
    doc.text(docNumber, logoX, 11.5)

    doc.setFontSize(7)
    doc.setTextColor(...WHITE)
    doc.text(`Page ${pageNum}`, pageWidth - margin, 8, { align: 'right' })
  }

  function addFooter(pageNum) {
    const y = pageHeight - 8
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y - 2, pageWidth - margin, y - 2)

    if (isoLogo) {
      try { doc.addImage(isoLogo, 'PNG', margin, y - 1.5, 4, 4) } catch (_e) { /* skip */ }
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(...GREY)
    doc.text('Powered by ISOGuardian', margin + 5.5, y + 1)
    doc.text(`${docNumber} | Rev ${content.revision || '01'} | ${today}`, pageWidth / 2, y + 1, { align: 'center' })
    doc.text(`Page ${pageNum}`, pageWidth - margin, y + 1, { align: 'right' })
  }

  function addWatermark() {
    doc.saveGraphicsState()
    doc.setGState(new doc.GState({ opacity: 0.04 }))
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(40)
    doc.setTextColor(124, 58, 237)
    // Visually center on the content area (between header and footer)
    const centerX = pageWidth / 2
    const centerY = (14 + pageHeight - 8) / 2 // midpoint between header bottom and footer top
    doc.text(`Licensed to ${companyName}`, centerX, centerY, { align: 'center', angle: 45 })
    doc.restoreGraphicsState()
  }

  function newPage() {
    doc.addPage()
    currentPage++
    addHeader(currentPage)
    addFooter(currentPage)
    addWatermark()
    return 20 // content starts right below compact header
  }

  function checkPageBreak(y, needed = 12) {
    if (y + needed > bottomLimit) return newPage()
    return y
  }

  // ─── PDF METADATA ───
  doc.setProperties({
    title: `${title} — ${companyName}`,
    subject: `ISO compliance template generated by ISOGuardian for ${companyName}`,
    author: 'ISOGuardian (Pty) Ltd',
    creator: 'ISOGuardian Template Marketplace — https://isoguardian.co.za',
    keywords: `ISO, compliance, ${companyName}, ISOGuardian, controlled document`,
  })

  // ═══════════════════════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════════════════════
  addHeader(1)
  addFooter(1)
  addWatermark()

  let y = 30

  // Company logo large on cover
  if (companyLogoImg) {
    try {
      fitImage(doc, companyLogoImg, pageWidth / 2 - 20, y, 40, 40)
      y += 46
    } catch (_e) { y += 6 }
  } else {
    y += 10
  }

  // Title block
  const titleLines = doc.splitTextToSize(title, contentWidth - 16)
  const titleBlockH = titleLines.length * 9 + 18
  doc.setFillColor(...LIGHT_PURPLE)
  doc.roundedRect(margin, y, contentWidth, titleBlockH, 2, 2, 'F')
  doc.setDrawColor(...PURPLE)
  doc.setLineWidth(0.4)
  doc.roundedRect(margin, y, contentWidth, titleBlockH, 2, 2, 'S')
  doc.setLineWidth(0.2)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...PURPLE)
  doc.text(titleLines, pageWidth / 2, y + 10, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...GREY)
  doc.text(companyName, pageWidth / 2, y + titleBlockH - 6, { align: 'center' })

  y += titleBlockH + 8

  // Cover metadata — 2-column grid for compact layout
  const approvedBy = personnel?.management_rep?.name
    ? `${personnel.management_rep.name} (${personnel.management_rep.title || 'Management Representative'})`
    : '________________'

  const coverFields = [
    ['Document Number', docNumber],
    ['Revision', content.revision || '01'],
    ['Effective Date', today],
    ['Next Review', reviewDate],
    ['Prepared By', preparedBy],
    ['Approved By', approvedBy],
    ['Classification', 'CONTROLLED DOCUMENT'],
    ['Standard', template.standard?.replace('_', ' ') || 'ISO 9001:2015'],
  ]

  const colW = contentWidth / 2
  const rowH = 7.5
  const labelW = 38

  coverFields.forEach(([label, value], idx) => {
    const col = idx % 2
    const row = Math.floor(idx / 2)
    const cx = margin + col * colW
    const cy = y + row * rowH

    // Label cell
    doc.setFillColor(...LIGHT_BG)
    doc.setDrawColor(220, 220, 220)
    doc.rect(cx, cy, labelW, rowH, 'FD')

    // Value cell
    doc.rect(cx + labelW, cy, colW - labelW, rowH, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...DARK)
    doc.text(label, cx + 2, cy + 5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...PURPLE)
    // Detect fill-in fields
    if (value.includes('____')) {
      doc.setFillColor(255, 250, 240)
      doc.rect(cx + labelW + 1, cy + 1, colW - labelW - 2, rowH - 2, 'F')
      doc.setTextColor(200, 150, 80)
    }
    const clipped = doc.splitTextToSize(value, colW - labelW - 4)
    doc.text(clipped[0] || '', cx + labelW + 2, cy + 5)
  })

  // ═══════════════════════════════════════════════════════════
  // CONTENT PAGES — continuous flow (no wasteful page-per-section)
  // ═══════════════════════════════════════════════════════════
  if (content.sections && content.sections.length > 0) {
    y = newPage()

    content.sections.forEach((section, sectionIdx) => {
      const heading = resolveAllPlaceholders(section.heading, companyData, liveData)
      const body = resolveAllPlaceholders(section.body, companyData, liveData)
      const clauseColour = getClauseColour(heading)

      // Check if we need a new page — need at least 35mm for heading + first content
      y = checkPageBreak(y, 35)

      // Add spacing between sections (but not before the first)
      if (sectionIdx > 0) y += 4

      // ─── SECTION HEADING ───
      // Coloured accent bar + heading text
      doc.setFillColor(...clauseColour)
      doc.rect(margin, y, 3, 7, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...DARK)
      doc.text(heading, margin + 5, y + 5.5)

      // Thin underline in clause colour
      y += 8
      doc.setDrawColor(...clauseColour)
      doc.setLineWidth(0.5)
      doc.line(margin, y, margin + contentWidth, y)
      doc.setLineWidth(0.2)
      y += 5

      // ─── BODY CONTENT ───
      const lines = body.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()

        // Empty lines: minimal spacing
        if (!trimmed) {
          y += 2
          continue
        }

        // ─── MARKDOWN TABLES ───
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          const tableRows = []
          let j = i
          while (j < lines.length && lines[j].trim().startsWith('|') && lines[j].trim().endsWith('|')) {
            const row = lines[j].trim()
            if (!/^\|[\s\-|:]+\|$/.test(row)) {
              const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(s => s.trim())
              tableRows.push(cells)
            }
            j++
          }
          i = j - 1
          if (tableRows.length > 0) {
            y = checkPageBreak(y, 14)
            y = renderTable(doc, tableRows, margin, y, contentWidth, checkPageBreak)
            y += 3
          }
          continue
        }

        // ─── BOLD STANDALONE HEADING (sub-clause) ───
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          y = checkPageBreak(y, 10)
          y += 2 // breathing room before sub-heading
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9)
          doc.setTextColor(...clauseColour)
          const boldText = trimmed.replace(/\*\*/g, '')
          doc.text(boldText, margin, y)
          y += 5
          continue
        }

        // ─── BOLD + INLINE TEXT ───
        const boldMatch = trimmed.match(/^\*\*(.+?)\*\*\s*(.*)$/)
        if (boldMatch) {
          y = checkPageBreak(y, 8)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8.5)
          doc.setTextColor(...DARK)
          const labelText = boldMatch[1]
          doc.text(labelText, margin, y)

          if (boldMatch[2]) {
            const labelWidth = doc.getTextWidth(labelText) + 2
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(60, 60, 80)

            let valueText = boldMatch[2]
            // Detect fill-in fields
            const isFillIn = valueText.includes('[') || valueText.includes('____')
            if (isFillIn) {
              doc.setTextColor(160, 130, 80)
            }

            const maxW = contentWidth - labelWidth
            const rest = doc.splitTextToSize(valueText, maxW)
            doc.text(rest[0] || '', margin + labelWidth, y)
            y += 4.5
            for (let k = 1; k < rest.length; k++) {
              y = checkPageBreak(y, 4.5)
              doc.text(rest[k], margin + 4, y)
              y += 4.5
            }
          } else {
            y += 5
          }
          continue
        }

        // ─── BULLET POINTS ───
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          y = checkPageBreak(y, 5)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8.5)
          doc.setTextColor(...DARK)
          const bulletText = trimmed.replace(/^[-•]\s+/, '').replace(/\*\*/g, '')

          // Detect fill-in fields in bullets
          if (bulletText.includes('[') || bulletText.includes('____')) {
            doc.setTextColor(160, 130, 80)
          }

          const wrapped = doc.splitTextToSize(bulletText, contentWidth - 7)
          wrapped.forEach((wl, idx) => {
            y = checkPageBreak(y, 4.5)
            if (idx === 0) {
              doc.setTextColor(...CYAN)
              doc.text('\u2022', margin + 1.5, y)
              doc.setTextColor(...DARK)
            }
            doc.text(wl, margin + 6, y)
            y += 4.5
          })
          continue
        }

        // ─── NUMBERED ITEMS ───
        const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/)
        if (numMatch) {
          y = checkPageBreak(y, 5)
          doc.setFontSize(8.5)
          const cleanText = numMatch[2].replace(/\*\*/g, '')
          const wrapped = doc.splitTextToSize(cleanText, contentWidth - 9)
          wrapped.forEach((wl, idx) => {
            y = checkPageBreak(y, 4.5)
            if (idx === 0) {
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(...PURPLE)
              doc.text(`${numMatch[1]}.`, margin + 1, y)
            }
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...DARK)
            doc.text(wl, margin + 8, y)
            y += 4.5
          })
          continue
        }

        // ─── BLOCKQUOTES (quality policy, key statements) ───
        if (trimmed.startsWith('>')) {
          y = checkPageBreak(y, 12)
          const quoteText = trimmed.replace(/^>\s*\*?/, '').replace(/\*$/, '')
          const quoteLines = doc.splitTextToSize(quoteText, contentWidth - 14)
          const quoteH = quoteLines.length * 4.5 + 5

          doc.setFillColor(...LIGHT_PURPLE)
          doc.roundedRect(margin, y - 2, contentWidth, quoteH, 1.5, 1.5, 'F')
          doc.setDrawColor(...PURPLE)
          doc.setLineWidth(0.8)
          doc.line(margin + 0.5, y - 1, margin + 0.5, y - 2 + quoteH - 1)
          doc.setLineWidth(0.2)

          doc.setFont('helvetica', 'italic')
          doc.setFontSize(8.5)
          doc.setTextColor(...PURPLE)
          quoteLines.forEach(ql => {
            doc.text(ql, margin + 6, y + 1.5)
            y += 4.5
          })
          y += 2
          continue
        }

        // ─── REGULAR PARAGRAPH ───
        y = checkPageBreak(y, 5)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(...DARK)

        let cleanLine = trimmed.replace(/\*\*/g, '')
        // Detect fill-in fields
        if (cleanLine.includes('[') || cleanLine.includes('____')) {
          doc.setTextColor(160, 130, 80)
        }

        const wrapped = doc.splitTextToSize(cleanLine, contentWidth)
        wrapped.forEach(wl => {
          y = checkPageBreak(y, 4.5)
          doc.text(wl, margin, y)
          y += 4.5
        })
        y += 1
      }
    })
  }

  // ═══════════════════════════════════════════════════════════
  // RELATED DOCUMENTS PAGE
  // ═══════════════════════════════════════════════════════════
  const crossRefs = CROSS_REFERENCES[template.id]
  if (crossRefs && (crossRefs.references.length > 0 || crossRefs.referencedBy.length > 0)) {
    y = newPage()

    // Heading
    doc.setFillColor(...CYAN)
    doc.rect(margin, y, 3, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...DARK)
    doc.text('Related Documents', margin + 5, y + 5.5)
    y += 9
    doc.setDrawColor(...CYAN)
    doc.setLineWidth(0.5)
    doc.line(margin, y, margin + contentWidth, y)
    doc.setLineWidth(0.2)
    y += 5

    // Info callout
    doc.setFillColor(...LIGHT_CYAN)
    doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'F')
    doc.setDrawColor(...CYAN)
    doc.setLineWidth(0.5)
    doc.line(margin + 0.5, y + 1, margin + 0.5, y + 9)
    doc.setLineWidth(0.2)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(50, 50, 60)
    doc.text('These documents are part of your integrated management system. Cross-references use your company document numbering.', margin + 4, y + 4.5)
    doc.text('Download related templates from the ISOGuardian Template Marketplace to build a complete, interconnected QMS.', margin + 4, y + 8)
    y += 14

    if (crossRefs.references.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...DARK)
      doc.text('This document references:', margin, y)
      y += 5

      const refRows = [['Doc Number', 'Title', 'Type', 'Clause']]
      crossRefs.references.forEach(refId => {
        const refTemplate = TEMPLATES.find(t => t.id === refId)
        const refDocNum = (DOC_NUMBER_MAP[refId] || '').replace(/\{\{CODE\}\}/g, companyCode)
        if (refTemplate) {
          refRows.push([refDocNum, refTemplate.title, refTemplate.docType, `Cl. ${refTemplate.clauseRef}`])
        }
      })
      y = renderTable(doc, refRows, margin, y, contentWidth, checkPageBreak)
      y += 6
    }

    if (crossRefs.referencedBy.length > 0) {
      y = checkPageBreak(y, 20)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...DARK)
      doc.text('This document is referenced by:', margin, y)
      y += 5

      const refByRows = [['Doc Number', 'Title', 'Type', 'Clause']]
      crossRefs.referencedBy.forEach(refId => {
        const refTemplate = TEMPLATES.find(t => t.id === refId)
        const refDocNum = (DOC_NUMBER_MAP[refId] || '').replace(/\{\{CODE\}\}/g, companyCode)
        if (refTemplate) {
          refByRows.push([refDocNum, refTemplate.title, refTemplate.docType, `Cl. ${refTemplate.clauseRef}`])
        }
      })
      y = renderTable(doc, refByRows, margin, y, contentWidth, checkPageBreak)
    }
  }

  // Save
  const filename = `${docNumber.replace(/\//g, '-')}_${companyCode}.pdf`
  doc.save(filename)
  return filename
}

// ═══════════════════════════════════════════════════════════════
// TABLE RENDERER — improved with multi-line cells, borders, spacing
// ═══════════════════════════════════════════════════════════════
function renderTable(doc, rows, x, startY, maxWidth, checkPageBreak) {
  if (rows.length === 0) return startY

  const numCols = rows[0].length
  const cellPad = 2.5
  const fontSize = 7.5
  const lineH = 3.8

  // ─── Calculate column widths based on content ───
  doc.setFontSize(fontSize)
  const colWidths = []

  for (let c = 0; c < numCols; c++) {
    let maxW = 0
    rows.forEach(row => {
      if (row[c]) {
        const text = row[c].replace(/\*\*/g, '')
        const w = doc.getTextWidth(text) + cellPad * 2 + 4
        maxW = Math.max(maxW, w)
      }
    })
    colWidths.push(Math.max(18, Math.min(maxW, maxWidth * 0.5)))
  }

  // Scale to fit within maxWidth
  const totalW = colWidths.reduce((a, b) => a + b, 0)
  const scale = Math.min(maxWidth / totalW, 1)
  const finalWidths = colWidths.map(w => w * scale)

  let y = startY

  rows.forEach((row, rowIdx) => {
    const isHeader = rowIdx === 0

    // Calculate row height based on tallest cell
    let maxLines = 1
    const cellTexts = row.map((_, colIdx) => {
      const text = (row[colIdx] || '').replace(/\*\*/g, '')
      const w = finalWidths[colIdx] - cellPad * 2
      const lines = doc.splitTextToSize(text, Math.max(w, 8))
      maxLines = Math.max(maxLines, lines.length)
      return lines
    })
    const rowHeight = Math.max(7, maxLines * lineH + 4)

    // Page break check
    y = checkPageBreak(y, rowHeight)

    // Set border colour BEFORE drawing cells — light grey for clean borders
    doc.setDrawColor(200, 200, 210)
    doc.setLineWidth(0.2)

    let cellX = x
    row.forEach((cell, colIdx) => {
      const w = finalWidths[colIdx]

      // Cell background
      if (isHeader) {
        doc.setFillColor(...PURPLE)
      } else if (rowIdx % 2 === 0) {
        doc.setFillColor(245, 243, 255) // Light purple tint for even rows
      } else {
        doc.setFillColor(255, 255, 255) // White for odd rows
      }
      doc.rect(cellX, y, w, rowHeight, 'FD')

      // Text styling
      doc.setFontSize(fontSize)
      if (isHeader) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...WHITE)
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(40, 40, 60) // Dark readable text
        // Detect fill-in fields in cells
        const text = cell || ''
        if (text.includes('____') || text.includes('[')) {
          doc.setTextColor(160, 130, 80)
        }
      }

      // Render each line of the cell
      const lines = cellTexts[colIdx]
      lines.forEach((line, lineIdx) => {
        if (lineIdx < 4) { // max 4 lines per cell
          doc.text(line, cellX + cellPad, y + 4 + lineIdx * lineH)
        }
      })

      cellX += w
    })

    y += rowHeight
  })

  return y
}
