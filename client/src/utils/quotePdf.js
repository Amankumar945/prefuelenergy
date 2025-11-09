import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import { formatINR } from './currency.js'

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89

let logoBytesCache = null

async function loadLogoBytes() {
  if (logoBytesCache) return logoBytesCache
  const res = await fetch('/quotation/logo.png')
  if (!res.ok) throw new Error('Failed to load quotation logo')
  const buffer = await res.arrayBuffer()
  logoBytesCache = new Uint8Array(buffer)
  return logoBytesCache
}

function sanitizeText(value) {
  if (value === undefined || value === null) return ''
  return String(value).replace(/\u20b9/g, 'Rs')
}

function formatDate(isoDate) {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-IN').format(date)
}

function buildQuoteRows(quote) {
  const items = Array.isArray(quote?.items) ? quote.items : []
  if (items.length === 0) {
    return [
      {
        title: 'Scope of Work',
        detail: 'Details to be confirmed',
        amount: 0,
      },
    ]
  }
  return items.map((item, idx) => {
    const title = sanitizeText(item.name || item.title || `Item ${idx + 1}`).toUpperCase()
    const qty = Number(item.qty || item.quantity || 0)
    const price = Number(item.price || item.unitPrice || 0)
    const taxPercent = Number(item.taxPercent || item.tax || 0)
    const amount = qty && price ? qty * price : Number(item.amount || 0) || 0
    const detailParts = []
    if (item.description) detailParts.push(sanitizeText(item.description))
    if (qty) detailParts.push(`Qty: ${qty}`)
    if (price) detailParts.push(`Unit: ${formatINR(price)}`)
    if (taxPercent) detailParts.push(`Tax: ${taxPercent}%`)
    if (!detailParts.length) detailParts.push(sanitizeText(item.detail || item.notes || '—'))
    return {
      title,
      detail: detailParts.join(' | '),
      amount,
    }
  })
}

function summariseTotals(rows) {
  return rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
}

function lineWrap(text, font, size, maxWidth) {
  const clean = sanitizeText(text)
  if (!clean) return ['']
  const words = clean.split(/\s+/)
  const lines = []
  let current = ''
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word
    const width = font.widthOfTextAtSize(candidate, size)
    if (width <= maxWidth) {
      current = candidate
    } else if (!current) {
      lines.push(word)
    } else {
      lines.push(current)
      current = word
    }
  })
  if (current) lines.push(current)
  return lines
}

export async function generateQuotePdf(quote, lead) {
  if (!quote) throw new Error('Missing quote payload')

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const logoBytes = await loadLogoBytes()
  const logoImage = await pdfDoc.embedPng(logoBytes)
  const headerGreen = rgb(0, 0.69, 0.31)
  const lineGray = rgb(0.75, 0.75, 0.75)
  const textColor = rgb(0.1, 0.1, 0.1)

  const drawText = (text, x, y, options = {}) => {
    page.drawText(sanitizeText(text ?? ''), {
      x,
      y,
      size: options.size || 10,
      font: options.bold ? boldFont : regularFont,
      color: options.color || textColor,
      maxWidth: options.maxWidth,
    })
  }

  const margin = 40
  const { width, height } = page.getSize()

  // Light watermark
  const watermark = sanitizeText('PREFUEL ENERGY')
  const waterWidth = boldFont.widthOfTextAtSize(watermark, 60)
  const waterHeight = boldFont.heightAtSize(60)
  page.drawText(watermark, {
    x: (width - waterWidth) / 2,
    y: height / 2 - waterHeight / 2,
    size: 60,
    font: boldFont,
    color: rgb(0.85, 0.85, 0.85),
    opacity: 0.12,
    rotate: degrees(35),
  })

  // Header logo
  const logoScale = 0.35
  const logoDims = {
    width: logoImage.width * logoScale,
    height: logoImage.height * logoScale,
  }
  page.drawImage(logoImage, {
    x: margin,
    y: height - margin - logoDims.height,
    width: logoDims.width,
    height: logoDims.height,
  })

  // Company header text
  const headerX = margin + logoDims.width + 12
  let headerY = height - margin - 8

  drawText('GREEN TREE INNOVATIONS', headerX, headerY, { size: 16, bold: true, color: headerGreen })
  headerY -= 18
  drawText('GST NO: 09ABQFM3569D1ZU', headerX, headerY, { size: 10 })
  headerY -= 14
  drawText('EPC VENDOR CODE: BRY2404050642', headerX, headerY, { size: 10 })
  headerY -= 14
  drawText(`Quotation No: ${sanitizeText(quote.id)}`, headerX, headerY, { size: 10 })
  headerY -= 14
  drawText(`Date: ${formatDate(quote.createdAt || quote.updatedAt || new Date())}`, headerX, headerY, { size: 10 })

  // Title
  const titleY = headerY - 28
  drawText('QUOTATION', width / 2 - boldFont.widthOfTextAtSize('QUOTATION', 20) / 2, titleY, {
    size: 20,
    bold: true,
    color: headerGreen,
  })

  const subtitle = sanitizeText(quote.name || '').toUpperCase()
  if (subtitle) {
    drawText(subtitle, width / 2 - regularFont.widthOfTextAtSize(subtitle, 12) / 2, titleY - 20, {
      size: 12,
      bold: true,
    })
  }

  // Customer block
  const customerName = quote.customerName || lead?.name || 'Valued Customer'
  const customerEmail = quote.customerEmail || lead?.email || ''
  const customerPhone = lead?.phone || ''
  const customerAddress =
    quote.siteAddress ||
    lead?.address ||
    [lead?.owner?.person?.name, lead?.owner?.person?.phone].filter(Boolean).join(' • ') ||
    '—'

  let infoY = titleY - (subtitle ? 48 : 32)
  drawText(`Name: ${sanitizeText(customerName)}`, margin, infoY, { size: 12, bold: true })
  infoY -= 16
  drawText(`Email: ${sanitizeText(customerEmail || '—')}`, margin, infoY, { size: 11 })
  infoY -= 16
  drawText(`Phone: ${sanitizeText(customerPhone || '—')}`, margin, infoY, { size: 11 })
  infoY -= 16
  drawText(`Address: ${sanitizeText(customerAddress)}`, margin, infoY, { size: 11, maxWidth: width - margin * 2 })

  // Table header
  let tableTop = infoY - 28
  const tableWidth = width - margin * 2
  const headerHeight = 22
  const rowHeight = 24
  const itemColWidth = 150
  const amountColWidth = 110
  const detailColWidth = tableWidth - itemColWidth - amountColWidth

  const tableLeft = margin

  // Header background
  page.drawRectangle({
    x: tableLeft,
    y: tableTop - headerHeight,
    width: tableWidth,
    height: headerHeight,
    color: headerGreen,
    opacity: 0.08,
    borderColor: headerGreen,
    borderWidth: 1,
  })

  drawText('ITEM', tableLeft + 8, tableTop - 16, { size: 11, bold: true })
  drawText('DETAILS', tableLeft + itemColWidth + 8, tableTop - 16, { size: 11, bold: true })
  drawText('COST', tableLeft + itemColWidth + detailColWidth + 8, tableTop - 16, {
    size: 11,
    bold: true,
  })

  let currentY = tableTop - headerHeight
  const rows = buildQuoteRows(quote)
  const totalAmount = summariseTotals(rows)

  rows.forEach((row) => {
    currentY -= rowHeight
    // Row border
    page.drawRectangle({
      x: tableLeft,
      y: currentY,
      width: tableWidth,
      height: rowHeight,
      borderColor: lineGray,
      borderWidth: 0.6,
    })

    const detailLines = lineWrap(row.detail, regularFont, 10, detailColWidth - 12)
    const itemLines = lineWrap(row.title, boldFont, 10, itemColWidth - 12)
    detailLines.forEach((line, index) => {
      const lineY = currentY + rowHeight - 8 - index * 12
      if (lineY <= currentY + 4) return
      drawText(line, tableLeft + itemColWidth + 8, lineY, { size: 10 })
    })
    itemLines.slice(0, 2).forEach((line, index) => {
      const lineY = currentY + rowHeight - 8 - index * 12
      if (lineY <= currentY + 4) return
      drawText(line, tableLeft + 8, lineY, { size: 10, bold: index === 0 })
    })
    drawText(row.amount ? formatINR(row.amount) : '—', tableLeft + itemColWidth + detailColWidth + 8, currentY + rowHeight - 12, {
      size: 10,
    })
  })

  currentY -= 10

  // Total row
  page.drawRectangle({
    x: tableLeft,
    y: currentY - rowHeight,
    width: tableWidth,
    height: rowHeight,
    color: headerGreen,
    opacity: 0.05,
    borderColor: headerGreen,
    borderWidth: 1,
  })
  drawText('Total Amount (Including GST)', tableLeft + 8, currentY - rowHeight + 10, { size: 11, bold: true })
  drawText(formatINR(totalAmount), tableLeft + itemColWidth + detailColWidth + 8, currentY - rowHeight + 10, {
    size: 11,
    bold: true,
  })

  currentY -= rowHeight + 26

  const descriptionNote =
    'Note: Pricing includes complete installation, commissioning, and statutory approvals unless specified otherwise.'
  const noteLines = lineWrap(descriptionNote, regularFont, 10, tableWidth)
  noteLines.forEach((line, index) => {
    drawText(line, tableLeft, currentY - index * 12, { size: 10 })
  })

  currentY -= noteLines.length * 12 + 28

  const bankDetails = [
    'A/C NAME: M/S GREEN TREE INNOVATIONS',
    'ACCOUNT NUMBER: 44174778508',
    'IFSC CODE: SBIN0001819',
    'BANK NAME: STATE BANK OF INDIA',
    'ADDRESS: SHIAMGANJ, BAREILLY, UTTAR PRADESH, 243005',
  ]

  bankDetails.forEach((line, index) => {
    drawText(line, tableLeft, currentY - index * 14, { size: 10, bold: index === 0 })
  })

  currentY -= bankDetails.length * 14 + 40

  drawText('(Signature with official seal)', width / 2 - 90, currentY, { size: 10 })
  drawText('For M/S Green Tree Innovations', width / 2 - 110, currentY - 18, { size: 11, bold: true })
  drawText('Name: Mr. Mrigendra Singh', width / 2 - 95, currentY - 36, { size: 10 })
  drawText('Designation: Partner', width / 2 - 80, currentY - 52, { size: 10 })

  const pdfBytes = await pdfDoc.save()
  return URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }))
}


