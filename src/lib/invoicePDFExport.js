/**
 * ISOGuardian Invoice & Commission Statement PDF Generator
 *
 * Two exports:
 * - generateInvoicePDF(invoice, company) — branded tax invoice with line items + VAT
 * - generateCommissionStatementPDF(reseller, commissions, dateRange) — monthly statement
 *
 * Uses jsPDF (same dependency as brandedPDFExport.js)
 */

import jsPDF from 'jspdf'

// Brand colours
const PURPLE = [124, 58, 237]
const DARK = [30, 27, 75]
const CYAN = [6, 182, 212]
const GREY = [107, 114, 128]
const WHITE = [255, 255, 255]
const LIGHT_BG = [249, 250, 251]
const GREEN = [34, 197, 94]
const RED = [239, 68, 68]

const VAT_RATE = 0.15 // South Africa VAT rate

function formatCurrency(amountCents) {
  const rands = (amountCents / 100).toFixed(2)
  return `R ${rands.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

async function loadLogo() {
  try {
    const response = await fetch('/isoguardian-logo.png')
    const blob = await response.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function addFooter(doc, pageNum, totalPages) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const y = pageHeight - 15

  doc.setDrawColor(200, 200, 200)
  doc.line(20, y - 5, pageWidth - 20, y - 5)

  doc.setFontSize(8)
  doc.setTextColor(...GREY)
  doc.text('ISOGuardian (Pty) Ltd | Reg: 2026/082362/07 | VAT: Pending Registration', 20, y)
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 20, y, { align: 'right' })
  doc.text('support@isoguardian.co.za | https://isoguardian.co.za', pageWidth / 2, y + 4, { align: 'center' })
}

/**
 * Generate a branded tax invoice PDF
 * @param {Object} invoice - Invoice record from database
 * @param {Object} company - Company record
 * @returns {jsPDF} The PDF document
 */
export async function generateInvoicePDF(invoice, company) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = 20

  const logo = await loadLogo()

  // Header with logo
  if (logo) {
    doc.addImage(logo, 'PNG', margin, y, 30, 30)
  }
  doc.setFontSize(24)
  doc.setTextColor(...DARK)
  doc.setFont(undefined, 'bold')
  doc.text('TAX INVOICE', pageWidth - margin, y + 10, { align: 'right' })

  doc.setFontSize(10)
  doc.setTextColor(...GREY)
  doc.setFont(undefined, 'normal')
  doc.text('ISOGuardian (Pty) Ltd', pageWidth - margin, y + 18, { align: 'right' })
  doc.text('Reg: 2026/082362/07', pageWidth - margin, y + 23, { align: 'right' })
  y += 40

  // Invoice details bar
  doc.setFillColor(...DARK)
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setTextColor(...WHITE)
  doc.setFont(undefined, 'bold')
  doc.text(`Invoice #: ${invoice.invoice_number || 'N/A'}`, margin + 8, y + 9)
  doc.text(`Date: ${formatDate(invoice.created_at || invoice.invoice_date)}`, margin + 8, y + 17)
  doc.text(`Status: ${(invoice.status || 'pending').toUpperCase()}`, pageWidth - margin - 8, y + 9, { align: 'right' })
  doc.text(`Due: ${formatDate(invoice.due_date)}`, pageWidth - margin - 8, y + 17, { align: 'right' })
  y += 32

  // Bill To
  doc.setFontSize(9)
  doc.setTextColor(...GREY)
  doc.setFont(undefined, 'bold')
  doc.text('BILL TO', margin, y)
  y += 6
  doc.setFont(undefined, 'normal')
  doc.setTextColor(...DARK)
  doc.setFontSize(11)
  doc.text(company?.name || 'Client', margin, y)
  y += 5
  doc.setFontSize(9)
  doc.setTextColor(...GREY)
  if (company?.company_code) doc.text(`Company Code: ${company.company_code}`, margin, y)
  y += 12

  // Line items table
  // Header row
  doc.setFillColor(...LIGHT_BG)
  doc.rect(margin, y, contentWidth, 8, 'F')
  doc.setFontSize(8)
  doc.setTextColor(...GREY)
  doc.setFont(undefined, 'bold')
  doc.text('Description', margin + 4, y + 5.5)
  doc.text('Qty', margin + 100, y + 5.5, { align: 'center' })
  doc.text('Unit Price', margin + 125, y + 5.5, { align: 'right' })
  doc.text('Amount', pageWidth - margin - 4, y + 5.5, { align: 'right' })
  y += 10

  // Parse line items from invoice or create default
  const lineItems = invoice.line_items || [
    {
      description: invoice.description || 'ISOGuardian Subscription',
      quantity: 1,
      unit_price: invoice.subtotal || invoice.amount || 0,
      amount: invoice.subtotal || invoice.amount || 0,
    },
  ]

  doc.setFont(undefined, 'normal')
  doc.setTextColor(...DARK)
  doc.setFontSize(9)

  let subtotal = 0
  for (const item of lineItems) {
    const amount = item.amount || item.unit_price * (item.quantity || 1)
    subtotal += amount
    doc.text(item.description || '', margin + 4, y + 4)
    doc.text(String(item.quantity || 1), margin + 100, y + 4, { align: 'center' })
    doc.text(formatCurrency(item.unit_price || 0), margin + 125, y + 4, { align: 'right' })
    doc.text(formatCurrency(amount), pageWidth - margin - 4, y + 4, { align: 'right' })
    doc.setDrawColor(230, 230, 230)
    doc.line(margin, y + 7, pageWidth - margin, y + 7)
    y += 9
  }

  // Totals
  y += 4
  const vatAmount = invoice.vat_amount || Math.round(subtotal * VAT_RATE)
  const total = invoice.total || subtotal + vatAmount

  doc.setDrawColor(200, 200, 200)
  doc.line(margin + 90, y, pageWidth - margin, y)
  y += 6

  doc.setFontSize(9)
  doc.setTextColor(...GREY)
  doc.text('Subtotal (excl. VAT)', margin + 92, y)
  doc.setTextColor(...DARK)
  doc.text(formatCurrency(subtotal), pageWidth - margin - 4, y, { align: 'right' })
  y += 6

  doc.setTextColor(...GREY)
  doc.text(`VAT (${VAT_RATE * 100}%)`, margin + 92, y)
  doc.setTextColor(...DARK)
  doc.text(formatCurrency(vatAmount), pageWidth - margin - 4, y, { align: 'right' })
  y += 8

  doc.setFillColor(...DARK)
  doc.roundedRect(margin + 88, y - 4, contentWidth - 88, 10, 2, 2, 'F')
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(...WHITE)
  doc.text('TOTAL', margin + 92, y + 3)
  doc.text(formatCurrency(total), pageWidth - margin - 4, y + 3, { align: 'right' })
  y += 18

  // Payment info
  doc.setFontSize(9)
  doc.setTextColor(...GREY)
  doc.setFont(undefined, 'bold')
  doc.text('PAYMENT INFORMATION', margin, y)
  y += 6
  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...DARK)
  doc.text('Payment Method: PayFast / EFT', margin, y)
  y += 4
  doc.text('Payment Terms: Due on receipt', margin, y)
  y += 4
  if (invoice.payment_reference) {
    doc.text(`Payment Reference: ${invoice.payment_reference}`, margin, y)
  }

  addFooter(doc, 1, 1)
  return doc
}

/**
 * Generate a commission statement PDF for a reseller
 * @param {Object} reseller - Reseller record with company name
 * @param {Array} commissions - Array of commission records
 * @param {Object} dateRange - { from: string, to: string }
 * @returns {jsPDF} The PDF document
 */
export async function generateCommissionStatementPDF(reseller, commissions, dateRange) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = 20

  const logo = await loadLogo()

  // Header
  if (logo) {
    doc.addImage(logo, 'PNG', margin, y, 30, 30)
  }
  doc.setFontSize(22)
  doc.setTextColor(...DARK)
  doc.setFont(undefined, 'bold')
  doc.text('COMMISSION STATEMENT', pageWidth - margin, y + 10, { align: 'right' })

  doc.setFontSize(10)
  doc.setTextColor(...GREY)
  doc.setFont(undefined, 'normal')
  doc.text('ISOGuardian (Pty) Ltd', pageWidth - margin, y + 18, { align: 'right' })
  y += 40

  // Period bar
  doc.setFillColor(...PURPLE)
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setTextColor(...WHITE)
  doc.setFont(undefined, 'bold')
  doc.text(`Statement Period: ${formatDate(dateRange?.from)} — ${formatDate(dateRange?.to)}`, margin + 8, y + 8)
  doc.text(`Reseller: ${reseller?.company_name || reseller?.name || 'N/A'}`, margin + 8, y + 15)
  y += 28

  // Summary
  const totalPending = commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + (c.amount || 0), 0)
  const totalApproved = commissions.filter((c) => c.status === 'approved').reduce((s, c) => s + (c.amount || 0), 0)
  const totalPaid = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + (c.amount || 0), 0)
  const grandTotal = commissions.reduce((s, c) => s + (c.amount || 0), 0)

  // Summary boxes
  const boxW = (contentWidth - 12) / 4
  const summaryItems = [
    { label: 'Total', value: grandTotal, color: DARK },
    { label: 'Pending', value: totalPending, color: [234, 179, 8] },
    { label: 'Approved', value: totalApproved, color: CYAN },
    { label: 'Paid', value: totalPaid, color: GREEN },
  ]

  summaryItems.forEach((item, i) => {
    const x = margin + i * (boxW + 4)
    doc.setFillColor(...LIGHT_BG)
    doc.roundedRect(x, y, boxW, 18, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setTextColor(...GREY)
    doc.setFont(undefined, 'normal')
    doc.text(item.label, x + boxW / 2, y + 6, { align: 'center' })
    doc.setFontSize(11)
    doc.setTextColor(...item.color)
    doc.setFont(undefined, 'bold')
    doc.text(formatCurrency(item.value), x + boxW / 2, y + 14, { align: 'center' })
  })
  y += 26

  // Commission detail table
  doc.setFillColor(...DARK)
  doc.rect(margin, y, contentWidth, 8, 'F')
  doc.setFontSize(7.5)
  doc.setTextColor(...WHITE)
  doc.setFont(undefined, 'bold')
  doc.text('Date', margin + 4, y + 5.5)
  doc.text('Client', margin + 30, y + 5.5)
  doc.text('Description', margin + 80, y + 5.5)
  doc.text('Status', margin + 125, y + 5.5)
  doc.text('Amount', pageWidth - margin - 4, y + 5.5, { align: 'right' })
  y += 10

  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)

  const pageHeight = doc.internal.pageSize.getHeight()
  let pageNum = 1

  for (const commission of commissions) {
    if (y > pageHeight - 30) {
      addFooter(doc, pageNum, '?')
      doc.addPage()
      pageNum++
      y = 20
    }

    doc.setTextColor(...DARK)
    doc.text(formatDate(commission.created_at).slice(0, 12), margin + 4, y + 4)
    doc.text((commission.client_name || '').slice(0, 20), margin + 30, y + 4)
    doc.text((commission.description || 'Subscription commission').slice(0, 25), margin + 80, y + 4)

    // Status color
    const statusColor = commission.status === 'paid' ? GREEN : commission.status === 'approved' ? CYAN : [234, 179, 8]
    doc.setTextColor(...statusColor)
    doc.text((commission.status || 'pending').toUpperCase(), margin + 125, y + 4)

    doc.setTextColor(...DARK)
    doc.text(formatCurrency(commission.amount || 0), pageWidth - margin - 4, y + 4, { align: 'right' })

    doc.setDrawColor(235, 235, 235)
    doc.line(margin, y + 7, pageWidth - margin, y + 7)
    y += 9
  }

  if (commissions.length === 0) {
    doc.setTextColor(...GREY)
    doc.text('No commissions for this period.', pageWidth / 2, y + 10, { align: 'center' })
  }

  // Update footers with correct total pages
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  return doc
}
