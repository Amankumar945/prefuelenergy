import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatINR } from './currency.js'

let templateBytesCache = null

async function loadTemplateBytes() {
  if (templateBytesCache) return templateBytesCache
  const res = await fetch('/invoice/Sales_205.pdf')
  if (!res.ok) throw new Error('Failed to download invoice template')
  const buffer = await res.arrayBuffer()
  templateBytesCache = new Uint8Array(buffer)
  return templateBytesCache
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

function calculateTotals(invoice) {
  const items = Array.isArray(invoice?.items) ? invoice.items : []
  let subtotal = 0
  let tax = 0
  items.forEach((item) => {
    const qty = Math.max(0, Number(item?.qty) || 0)
    const price = Math.max(0, Number(item?.price) || 0)
    const taxPercent = Math.max(0, Math.min(28, Number(item?.taxPercent) || 0))
    const line = qty * price
    subtotal += line
    tax += line * (taxPercent / 100)
  })
  const grandTotal = subtotal + tax
  return { subtotal, tax, grandTotal }
}

function splitLines(text, font, size, maxWidth) {
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
      // single word longer than max width – hard split
      lines.push(word)
      current = ''
    } else {
      lines.push(current)
      current = word
    }
  })
  if (current) lines.push(current)
  return lines
}

export async function generateInvoicePdf(invoice) {
  if (!invoice) throw new Error('Missing invoice payload')

  const baseBytes = await loadTemplateBytes()
  const pdfDoc = await PDFDocument.load(baseBytes.slice(0), { updateMetadata: false })
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const [page] = pdfDoc.getPages()
  const { height } = page.getSize()

  const layout = {
    invoiceNumber: { x: 418, y: height - 128 },
    invoiceDate: { x: 418, y: height - 148 },
    customerNameLabel: { x: 118, y: height - 226 },
    customerNameValue: { x: 170, y: height - 226 },
    customerDetails: { x: 118, y: height - 240, lineHeight: 12, maxLines: 4, width: 250 },
    tableStart: { x: 54, y: height - 330 },
    table: {
      rowHeight: 20,
      maxRows: 10,
      rowSpacing: 48,
      columns: {
        index: 40,
        description: 90,
        quantity: 320,
        unitPrice: 380,
        amount: 460,
      },
      descriptionWidth: 210,
    },
    totals: {
      labelX: 360,
      valueX: 460,
      startY: height - 540,
      lineHeight: 18,
    },
    notes: { x: 54, y: height - 580, width: 300, lineHeight: 12, maxLines: 3 },
  }

  const white = rgb(1, 1, 1)
  const clearRect = (x, y, width, height) => {
    if (width <= 0 || height <= 0) return
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: white,
    })
  }

  const drawText = (text, position, options = {}) => {
    const { x, y } = position
    page.drawText(sanitizeText(text ?? ''), {
      x,
      y,
      size: 10,
      font: fontRegular,
      color: options.color,
      maxWidth: options.maxWidth,
    })
  }

  const drawBold = (text, position, options = {}) => {
    const { x, y } = position
    page.drawText(sanitizeText(text ?? ''), {
      x,
      y,
      size: options.size || 10,
      font: fontBold,
      color: options.color,
      maxWidth: options.maxWidth,
    })
  }

  clearRect(layout.invoiceNumber.x - 8, layout.invoiceDate.y - 22, 180, 48)
  drawBold(invoice.id || '', layout.invoiceNumber)
  drawText(formatDate(invoice.createdAt || invoice.updatedAt), layout.invoiceDate)

  const customerName = invoice.customerName || invoice.billingName || ''
  const customerBlockHeight = layout.customerDetails.lineHeight * layout.customerDetails.maxLines + 34
  const customerBlockBottom = layout.customerDetails.y - customerBlockHeight + 4
  clearRect(layout.customerDetails.x - 10, customerBlockBottom, 280, customerBlockHeight + 12)
  drawBold('Name:', layout.customerNameLabel, { size: 10 })
  drawText(customerName || '—', layout.customerNameValue)

  const customerLines = splitLines(
    invoice.customerAddress ||
      invoice.billingAddress ||
      [invoice.customerEmail, invoice.customerPhone].filter(Boolean).join(' • ') ||
      'Location: —',
    fontRegular,
    10,
    layout.customerDetails.width,
  )
  customerLines.slice(0, layout.customerDetails.maxLines).forEach((line, idx) => {
    drawText(line, {
      x: layout.customerDetails.x,
      y: layout.customerDetails.y - idx * layout.customerDetails.lineHeight,
    })
  })

  const items = Array.isArray(invoice.items) ? invoice.items : []
  const table = layout.table
  const tableInteriorLeft = table.columns.index + 2
  const tableInteriorRight = table.columns.amount + 85
  const tableInteriorWidth = tableInteriorRight - tableInteriorLeft
  const rowSpacing = table.rowSpacing || 48
  const tableHeaderHeight = 24
  const tableBodyHeight = rowSpacing * table.maxRows + 18
  clearRect(
    tableInteriorLeft,
    layout.tableStart.y - tableHeaderHeight - tableBodyHeight,
    tableInteriorWidth,
    tableHeaderHeight + tableBodyHeight,
  )

  const columnStarts = [
    table.columns.index,
    table.columns.description,
    table.columns.quantity,
    table.columns.unitPrice,
    table.columns.amount,
  ]
  const columnWidths = [
    Math.max(0, table.columns.description - table.columns.index - 6),
    Math.max(0, table.columns.quantity - table.columns.description - 6),
    Math.max(0, table.columns.unitPrice - table.columns.quantity - 6),
    Math.max(0, table.columns.amount - table.columns.unitPrice - 6),
    110,
  ]

  const visibleItems = items.slice(0, table.maxRows)
  visibleItems.forEach((item, idx) => {
    const rowNumber = idx + 1
    const descLines = splitLines(item.description || item.name || '', fontRegular, 9, table.descriptionWidth).slice(0, 3)
    const rowTop = layout.tableStart.y - idx * rowSpacing
    const rowBottom = rowTop - rowSpacing + 1
    const textBaseY = rowTop - 16

    columnStarts.forEach((start, colIdx) => {
      const width = columnWidths[colIdx]
      if (width <= 0) return
      clearRect(start + 2, rowBottom + 2, width, rowSpacing - 4)
    })

    drawText(rowNumber, { x: table.columns.index, y: textBaseY })

    descLines.forEach((line, lineIndex) => {
      page.drawText(line, {
        x: table.columns.description,
        y: textBaseY - lineIndex * 11,
        size: 9,
        font: fontRegular,
      })
    })

    const qty = Number(item.qty || 0)
    const price = Number(item.price || 0)
    const amount = qty * price

    drawText(qty ? qty.toString() : '', { x: table.columns.quantity, y: textBaseY })
    drawText(price ? formatINR(price) : '', { x: table.columns.unitPrice, y: textBaseY })
    drawText(amount ? formatINR(amount) : '', { x: table.columns.amount, y: textBaseY })
  })

  if (visibleItems.length < table.maxRows) {
    for (let idx = visibleItems.length; idx < table.maxRows; idx += 1) {
      const rowTop = layout.tableStart.y - idx * rowSpacing
      const rowBottom = rowTop - rowSpacing + 1
      columnStarts.forEach((start, colIdx) => {
        const width = columnWidths[colIdx]
        if (width <= 0) return
        clearRect(start + 2, rowBottom + 2, width, rowSpacing - 4)
      })
    }
  }

  if (items.length > table.maxRows) {
    const overflowY = layout.tableStart.y - rowSpacing * table.maxRows - 12
    page.drawText(`+${items.length - table.maxRows} more item(s)…`, {
      x: table.columns.description,
      y: overflowY,
      size: 9,
      font: fontRegular,
    })
  }

  const totals = invoice.totals || calculateTotals(invoice)
  const totalsLines = [
    { label: 'Subtotal', value: totals.subtotal },
    { label: 'Tax', value: totals.tax },
    { label: 'Grand Total', value: totals.grandTotal, bold: true },
  ]
  const totalsBlockHeight = layout.totals.lineHeight * totalsLines.length + 20
  clearRect(layout.totals.labelX - 10, layout.totals.startY - totalsBlockHeight + 6, 220, totalsBlockHeight)
  totalsLines.forEach((line, idx) => {
    const y = layout.totals.startY - idx * layout.totals.lineHeight
    const labelPosition = { x: layout.totals.labelX, y }
    const valuePosition = { x: layout.totals.valueX, y }
    if (line.bold) {
      drawBold(line.label, labelPosition)
      drawBold(formatINR(line.value), valuePosition)
    } else {
      drawText(line.label, labelPosition)
      drawText(formatINR(line.value), valuePosition)
    }
  })

  if (invoice.notes) {
    const notesHeight = layout.notes.lineHeight * layout.notes.maxLines + 16
    clearRect(layout.notes.x - 4, layout.notes.y - notesHeight + layout.notes.lineHeight - 4, layout.notes.width + 30, notesHeight)
    const noteLines = splitLines(invoice.notes, fontRegular, 9, layout.notes.width)
    noteLines.slice(0, layout.notes.maxLines).forEach((line, idx) => {
      page.drawText(line, {
        x: layout.notes.x,
        y: layout.notes.y - idx * layout.notes.lineHeight,
        size: 9,
        font: fontRegular,
      })
    })
  }

  const pdfBytes = await pdfDoc.save()
  return URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }))
}

