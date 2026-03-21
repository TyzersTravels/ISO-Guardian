/**
 * ISOGuardian Template PDF Export
 *
 * Renders structured template content (from templateData.js) into branded PDFs
 * with company logo, name, document numbering, and professional formatting.
 *
 * Reuses createBrandedPDF infrastructure from brandedPDFExport.js
 */

import jsPDF from 'jspdf'

// Brand colours
const PURPLE = [124, 58, 237]
const DARK = [30, 27, 75]
const CYAN = [6, 182, 212]
const GREY = [107, 114, 128]
const WHITE = [255, 255, 255]
const LIGHT_BG = [249, 250, 251]

/**
 * Replace template placeholders with company data
 */
function replacePlaceholders(text, companyName, companyCode, preparedBy) {
  if (!text) return ''
  const today = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
  return text
    .replace(/\{\{COMPANY\}\}/g, companyName || 'Your Company')
    .replace(/\{\{CODE\}\}/g, companyCode || 'XX')
    .replace(/\{\{DATE\}\}/g, today)
    .replace(/\{\{PREPARED_BY\}\}/g, preparedBy || 'System Generated')
    .replace(/\{\{STANDARD\}\}/g, 'ISO 9001:2015')
}

/**
 * Generate a branded PDF from a template
 *
 * @param {Object} template - Template object from templateData.js
 * @param {Object} options
 * @param {string} options.companyName - Client company name
 * @param {string} options.companyCode - Company code (e.g., 'SH')
 * @param {string} options.preparedBy - User name
 * @param {string|null} options.companyLogoUrl - URL to company logo
 */
export async function generateTemplatePDF(template, options = {}) {
  const {
    companyName = 'Your Company',
    companyCode = 'XX',
    preparedBy = 'System Generated',
    companyLogoUrl = null,
  } = options

  const content = template.content
  const docNumber = replacePlaceholders(content.docNumber || '', companyName, companyCode, preparedBy)
  const title = replacePlaceholders(content.title || template.title, companyName, companyCode, preparedBy)
  const today = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
  const reviewDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let currentPage = 1

  // Load company logo
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
    } catch (e) { /* continue without logo */ }
  }

  // Load ISOGuardian logo for footer
  let isoLogo = null
  try {
    const response = await fetch('/isoguardian-logo.png')
    const blob = await response.blob()
    isoLogo = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch (e) { /* continue without */ }

  function addHeader(pageNum) {
    // Purple header bar
    doc.setFillColor(...PURPLE)
    doc.rect(0, 0, pageWidth, 32, 'F')

    let logoX = margin
    if (companyLogoImg) {
      try {
        doc.addImage(companyLogoImg, 'PNG', margin, 3, 26, 26)
        logoX = margin + 30
      } catch (e) { /* skip */ }
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...WHITE)
    doc.text(companyName, logoX, 14)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(220, 220, 255)
    doc.text('ISO Compliance Management', logoX, 20)

    doc.setFontSize(8)
    doc.setTextColor(...WHITE)
    doc.text(`Page ${pageNum}`, pageWidth - margin, 14, { align: 'right' })

    // Document control block
    doc.setFillColor(...LIGHT_BG)
    doc.rect(margin, 35, contentWidth, 18, 'F')
    doc.setDrawColor(200, 200, 200)
    doc.rect(margin, 35, contentWidth, 18, 'S')

    doc.setFontSize(8)
    doc.setTextColor(...DARK)

    const colW = contentWidth / 3
    doc.setFont('helvetica', 'bold')
    doc.text('Document No.', margin + 4, 41)
    doc.text('Revision', margin + colW + 4, 41)
    doc.text('Review Date', margin + colW * 2 + 4, 41)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...PURPLE)
    doc.text(docNumber, margin + 4, 48)
    doc.text(content.revision || '01', margin + colW + 4, 48)
    doc.text(reviewDate, margin + colW * 2 + 4, 48)

    doc.setDrawColor(200, 200, 200)
    doc.line(margin + colW, 35, margin + colW, 53)
    doc.line(margin + colW * 2, 35, margin + colW * 2, 53)
  }

  function addFooter(pageNum) {
    const y = pageHeight - 12
    doc.setDrawColor(...GREY)
    doc.line(margin, y - 4, pageWidth - margin, y - 4)

    if (isoLogo) {
      try { doc.addImage(isoLogo, 'PNG', margin, y - 3, 5, 5) } catch (e) { /* skip */ }
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(...GREY)
    doc.text('Powered by ISOGuardian', margin + 7, y + 1)
    doc.text(`${docNumber} | Rev ${content.revision || '01'} | ${today}`, pageWidth / 2, y + 1, { align: 'center' })
    doc.text(`Page ${pageNum}`, pageWidth - margin, y + 1, { align: 'right' })
  }

  // ─── DIAGONAL WATERMARK (IP protection) ───
  function addWatermark(pageNum) {
    doc.saveGraphicsState()
    doc.setGState(new doc.GState({ opacity: 0.06 }))
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(48)
    doc.setTextColor(124, 58, 237)
    // Rotate and place diagonal watermark
    const centerX = pageWidth / 2
    const centerY = pageHeight / 2
    doc.text(`Licensed to ${companyName}`, centerX, centerY, {
      align: 'center',
      angle: 35,
    })
    doc.restoreGraphicsState()
  }

  function newPage() {
    doc.addPage()
    currentPage++
    addHeader(currentPage)
    addFooter(currentPage)
    addWatermark(currentPage)
    return 58 // Y position after header
  }

  function checkPageBreak(y, needed = 20) {
    if (y + needed > pageHeight - 25) {
      return newPage()
    }
    return y
  }

  // ─── PDF METADATA (IP protection) ───
  doc.setProperties({
    title: `${title} — ${companyName}`,
    subject: `ISO compliance template generated by ISOGuardian for ${companyName}`,
    author: 'ISOGuardian (Pty) Ltd',
    creator: 'ISOGuardian Template Marketplace — https://isoguardian.co.za',
    keywords: `ISO, compliance, ${companyName}, ISOGuardian, controlled document`,
  })

  // ─── COVER PAGE ───
  addHeader(1)
  addFooter(1)
  addWatermark(1)

  let y = 80

  // Title block
  doc.setFillColor(248, 245, 255)
  doc.roundedRect(margin, y - 5, contentWidth, 40, 3, 3, 'F')
  doc.setDrawColor(...PURPLE)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, y - 5, contentWidth, 40, 3, 3, 'S')
  doc.setLineWidth(0.2)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...PURPLE)

  // Word-wrap title
  const titleLines = doc.splitTextToSize(title, contentWidth - 20)
  doc.text(titleLines, pageWidth / 2, y + 8, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...GREY)
  doc.text(companyName, pageWidth / 2, y + 28, { align: 'center' })

  y += 55

  // Cover metadata table
  const coverData = [
    ['Document Number', docNumber],
    ['Revision', content.revision || '01'],
    ['Effective Date', today],
    ['Prepared By', preparedBy],
    ['Approved By', '[Management Representative]'],
    ['Next Review', reviewDate],
    ['Classification', 'CONTROLLED DOCUMENT'],
  ]

  doc.setFontSize(9)
  const rowH = 8
  const labelW = 55
  const valW = contentWidth - labelW

  coverData.forEach(([label, value]) => {
    y = checkPageBreak(y, rowH + 2)
    doc.setFillColor(...LIGHT_BG)
    doc.rect(margin, y, labelW, rowH, 'F')
    doc.setDrawColor(220, 220, 220)
    doc.rect(margin, y, labelW, rowH, 'S')
    doc.rect(margin + labelW, y, valW, rowH, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    doc.text(label, margin + 3, y + 5.5)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...PURPLE)
    doc.text(value, margin + labelW + 3, y + 5.5)

    y += rowH
  })

  // ─── CONTENT PAGES ───
  if (content.sections && content.sections.length > 0) {
    content.sections.forEach((section) => {
      // Start each major section on a new page
      y = newPage()

      const heading = replacePlaceholders(section.heading, companyName, companyCode, preparedBy)
      const body = replacePlaceholders(section.body, companyName, companyCode, preparedBy)

      // Section heading
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(...PURPLE)
      doc.text(heading, margin, y)
      y += 3

      // Purple underline
      doc.setDrawColor(...PURPLE)
      doc.setLineWidth(0.8)
      doc.line(margin, y, margin + contentWidth, y)
      doc.setLineWidth(0.2)
      y += 8

      // Parse and render body content
      const lines = body.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()

        if (!trimmed) {
          y += 3
          continue
        }

        // Detect markdown tables
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          // Collect all table rows
          const tableRows = []
          let j = i
          while (j < lines.length && lines[j].trim().startsWith('|') && lines[j].trim().endsWith('|')) {
            const row = lines[j].trim()
            // Skip separator rows (|---|---|)
            if (!/^\|[\s\-|:]+\|$/.test(row)) {
              const cells = row.split('|').filter((c, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim())
              tableRows.push(cells)
            }
            j++
          }
          i = j - 1

          if (tableRows.length > 0) {
            y = renderTable(doc, tableRows, margin, y, contentWidth)
            y += 4
          }
          continue
        }

        // Detect bold text (heading-like within body)
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          y = checkPageBreak(y, 12)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(...DARK)
          const boldText = trimmed.replace(/\*\*/g, '')
          doc.text(boldText, margin, y)
          y += 6
          continue
        }

        // Detect sub-headings (bold followed by content)
        const boldMatch = trimmed.match(/^\*\*(.+?)\*\*\s*(.*)$/)
        if (boldMatch) {
          y = checkPageBreak(y, 10)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9)
          doc.setTextColor(...DARK)
          doc.text(boldMatch[1], margin, y)
          if (boldMatch[2]) {
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...GREY)
            const rest = doc.splitTextToSize(boldMatch[2], contentWidth - doc.getTextWidth(boldMatch[1]) - 3)
            doc.text(rest[0] || '', margin + doc.getTextWidth(boldMatch[1]) + 2, y)
            y += 5
            // Wrap remaining lines
            for (let k = 1; k < rest.length; k++) {
              y = checkPageBreak(y, 5)
              doc.text(rest[k], margin, y)
              y += 5
            }
          } else {
            y += 6
          }
          continue
        }

        // Detect bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          y = checkPageBreak(y, 6)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(...DARK)
          const bulletText = trimmed.replace(/^[-•]\s+/, '')
          const cleanText = bulletText.replace(/\*\*/g, '')
          const wrapped = doc.splitTextToSize(cleanText, contentWidth - 8)
          wrapped.forEach((wl, idx) => {
            y = checkPageBreak(y, 5)
            if (idx === 0) {
              doc.text('•', margin + 2, y)
            }
            doc.text(wl, margin + 7, y)
            y += 5
          })
          continue
        }

        // Detect numbered items
        const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/)
        if (numMatch) {
          y = checkPageBreak(y, 6)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(...DARK)
          const cleanText = numMatch[2].replace(/\*\*/g, '')
          const wrapped = doc.splitTextToSize(cleanText, contentWidth - 10)
          wrapped.forEach((wl, idx) => {
            y = checkPageBreak(y, 5)
            if (idx === 0) {
              doc.setFont('helvetica', 'bold')
              doc.text(`${numMatch[1]}.`, margin + 1, y)
              doc.setFont('helvetica', 'normal')
            }
            doc.text(wl, margin + 9, y)
            y += 5
          })
          continue
        }

        // Detect blockquotes (quality policy etc.)
        if (trimmed.startsWith('>')) {
          y = checkPageBreak(y, 15)
          const quoteText = trimmed.replace(/^>\s*\*?/, '').replace(/\*$/, '')
          doc.setFillColor(248, 245, 255)
          const quoteLines = doc.splitTextToSize(quoteText, contentWidth - 16)
          const quoteH = quoteLines.length * 5 + 6
          doc.roundedRect(margin, y - 3, contentWidth, quoteH, 2, 2, 'F')
          doc.setDrawColor(...PURPLE)
          doc.setLineWidth(1)
          doc.line(margin + 1, y - 2, margin + 1, y - 3 + quoteH - 1)
          doc.setLineWidth(0.2)

          doc.setFont('helvetica', 'italic')
          doc.setFontSize(9)
          doc.setTextColor(...PURPLE)
          quoteLines.forEach(ql => {
            doc.text(ql, margin + 8, y + 2)
            y += 5
          })
          y += 4
          continue
        }

        // Regular paragraph
        y = checkPageBreak(y, 6)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...DARK)
        const cleanLine = trimmed.replace(/\*\*/g, '')
        const wrapped = doc.splitTextToSize(cleanLine, contentWidth)
        wrapped.forEach(wl => {
          y = checkPageBreak(y, 5)
          doc.text(wl, margin, y)
          y += 5
        })
        y += 2
      }
    })
  }

  // Save
  const filename = `${docNumber.replace(/\//g, '-')}_${companyCode}.pdf`
  doc.save(filename)
  return filename
}

/**
 * Render a markdown-style table into the PDF
 */
function renderTable(doc, rows, x, startY, maxWidth) {
  if (rows.length === 0) return startY

  const pageHeight = doc.internal.pageSize.getHeight()
  const numCols = rows[0].length
  const cellPadding = 2
  const rowHeight = 7
  const colWidth = Math.min(maxWidth / numCols, 55)
  const tableWidth = Math.min(numCols * colWidth, maxWidth)
  const adjustedColWidths = []

  // Calculate column widths based on content
  for (let c = 0; c < numCols; c++) {
    let maxLen = 0
    rows.forEach(row => {
      if (row[c]) maxLen = Math.max(maxLen, row[c].replace(/\*\*/g, '').length)
    })
    adjustedColWidths.push(Math.max(15, Math.min(maxLen * 2 + 6, maxWidth * 0.5)))
  }

  // Normalise widths to fit
  const totalW = adjustedColWidths.reduce((a, b) => a + b, 0)
  const scale = Math.min(maxWidth / totalW, 1)
  const finalWidths = adjustedColWidths.map(w => w * scale)

  let y = startY

  rows.forEach((row, rowIdx) => {
    // Check page break
    if (y + rowHeight > pageHeight - 25) {
      doc.addPage()
      // Re-add header on new page
      y = 58
    }

    const isHeader = rowIdx === 0

    // Row background
    if (isHeader) {
      doc.setFillColor(...PURPLE)
    } else {
      doc.setFillColor(rowIdx % 2 === 0 ? 255 : 248, rowIdx % 2 === 0 ? 255 : 248, rowIdx % 2 === 0 ? 255 : 252)
    }

    let cellX = x
    row.forEach((cell, colIdx) => {
      const w = finalWidths[colIdx] || colWidth
      doc.rect(cellX, y, w, rowHeight, 'FD')

      doc.setFontSize(7)
      if (isHeader) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...WHITE)
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...DARK)
      }

      const cleanCell = (cell || '').replace(/\*\*/g, '').substring(0, 50)
      const textLines = doc.splitTextToSize(cleanCell, w - cellPadding * 2)
      doc.text(textLines[0] || '', cellX + cellPadding, y + 4.5)

      cellX += w
    })

    doc.setDrawColor(220, 220, 220)
    y += rowHeight
  })

  return y
}
