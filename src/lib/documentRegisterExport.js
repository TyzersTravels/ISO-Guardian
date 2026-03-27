import jsPDF from 'jspdf'

/**
 * Export the document register as a branded PDF (landscape A4)
 */
export async function exportRegisterPDF(documents, { companyName, companyCode, exportedBy, logoUrl }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 15
  let y = margin

  // ─── Header ───
  doc.setFillColor(15, 23, 42) // slate-900
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(`${companyName || 'Company'} — Document Register`, margin, 12)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 200, 200)
  doc.text(`Exported: ${new Date().toLocaleDateString('en-ZA')} | By: ${exportedBy || 'User'} | Code: ${companyCode || '—'}`, margin, 20)
  doc.text(`Total documents: ${documents.length}`, pageW - margin, 20, { align: 'right' })
  y = 35

  // ─── Table header ───
  const cols = [
    { label: 'Document Name', width: 70 },
    { label: 'Doc Number', width: 35 },
    { label: 'Standard', width: 25 },
    { label: 'Type', width: 22 },
    { label: 'Ver', width: 12 },
    { label: 'Status', width: 25 },
    { label: 'Owner', width: 35 },
    { label: 'Next Review', width: 25 },
    { label: 'Last Updated', width: 25 },
  ]

  const drawTableHeader = () => {
    doc.setFillColor(30, 41, 59) // slate-800
    doc.rect(margin, y, pageW - margin * 2, 8, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(148, 163, 184) // slate-400
    let x = margin + 2
    cols.forEach(col => {
      doc.text(col.label.toUpperCase(), x, y + 5.5)
      x += col.width
    })
    y += 10
  }

  drawTableHeader()

  // ─── Table rows ───
  const sortedDocs = [...documents].sort((a, b) => a.name.localeCompare(b.name))

  sortedDocs.forEach((d, i) => {
    if (y > pageH - 20) {
      doc.addPage()
      y = margin
      drawTableHeader()
    }

    // Alternate row background
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, y - 1, pageW - margin * 2, 7, 'F')
    }

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 41, 59)

    let x = margin + 2
    const row = [
      (d.name || '').substring(0, 40),
      d.document_number || '—',
      (d.standard || '').replace('_', ' ').substring(0, 12),
      d.type || '—',
      `v${d.version || '1.0'}`,
      (d.status || 'draft').replace('_', ' '),
      '—', // owner name not available in this context, caller can enrich
      d.next_review_date ? new Date(d.next_review_date).toLocaleDateString('en-ZA') : '—',
      d.updated_at ? new Date(d.updated_at).toLocaleDateString('en-ZA') : '—',
    ]

    // Highlight overdue
    if (d.next_review_date && new Date(d.next_review_date) < new Date()) {
      doc.setTextColor(220, 38, 38) // red
    }

    row.forEach((cell, ci) => {
      doc.text(cell, x, y + 4)
      x += cols[ci].width
      // Reset color after next_review_date column
      if (ci === 7) doc.setTextColor(30, 41, 59)
    })

    y += 7
  })

  // ─── Footer ───
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(6)
    doc.setTextColor(150, 150, 150)
    doc.text(`ISOGuardian Document Register — Page ${p} of ${totalPages}`, margin, pageH - 5)
    doc.text('Controlled copy — valid only on date of export', pageW - margin, pageH - 5, { align: 'right' })
  }

  doc.save(`${companyCode || 'Company'}_Document_Register_${new Date().toISOString().split('T')[0]}.pdf`)
}

/**
 * Export the document register as CSV
 */
export function exportRegisterCSV(documents) {
  const headers = ['Document Name', 'Document Number', 'Standard', 'Clause', 'Type', 'Version', 'Status', 'Next Review Date', 'Review Frequency (months)', 'Last Updated', 'Requires Acknowledgement']

  const rows = documents.map(d => [
    `"${(d.name || '').replace(/"/g, '""')}"`,
    d.document_number || '',
    (d.standard || '').replace('_', ' '),
    d.clause || '',
    d.type || '',
    d.version || '1.0',
    (d.status || 'draft').replace('_', ' '),
    d.next_review_date || '',
    d.review_frequency_months || 12,
    d.updated_at ? new Date(d.updated_at).toLocaleDateString('en-ZA') : '',
    d.requires_acknowledgement ? 'Yes' : 'No',
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Document_Register_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
