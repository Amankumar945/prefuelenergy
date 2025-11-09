import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../utils/api.js'
import { generateInvoicePdf } from '../utils/invoicePdf.js'

export default function InvoicePrintPage() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const iframeRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    async function loadInvoice() {
      try {
        const res = await api.get('/api/invoices')
        if (!active) return
        const list = Array.isArray(res.data?.invoices) ? res.data.invoices : []
        const found = list.find((item) => item.id === id)
        if (!found) {
          setError('Invoice not found. Please go back and refresh your invoices list.')
        }
        setInvoice(found || null)
      } catch (err) {
        if (!active) return
        setError(err?.response?.data?.message || 'Unable to load invoice information.')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadInvoice()
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    document.title = invoice ? `Invoice ${invoice.id} • Prefuel Energy` : 'Invoice Preview • Prefuel Energy'
  }, [invoice])

  useEffect(() => {
    if (!invoice) {
      setPdfUrl('')
      return
    }
    let cancelled = false
    let currentUrl = ''
    async function buildPdf() {
      setGenerating(true)
      setGenerationError('')
      try {
        const url = await generateInvoicePdf(invoice)
        if (cancelled) {
          URL.revokeObjectURL(url)
          return
        }
        currentUrl = url
        setPdfUrl(url)
      } catch (err) {
        if (!cancelled) {
          setGenerationError(err?.message || 'Failed to prepare invoice PDF.')
          setPdfUrl('')
        }
      } finally {
        if (!cancelled) setGenerating(false)
      }
    }
    buildPdf()
    return () => {
      cancelled = true
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [invoice])

  function handlePrint() {
    if (!pdfUrl) return
    const frame = iframeRef.current
    if (frame?.contentWindow) {
      try {
        frame.contentWindow.focus()
        frame.contentWindow.print()
        return
      } catch (_) {
        // fall back to window.print
      }
    }
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Invoice Print Preview</h1>
            <p className="text-sm text-gray-600">
              The preview below loads the official Sales_205 format. Use the buttons to print or download the template.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-white"
            >
              Back
            </button>
            <a
              href={pdfUrl || undefined}
              target="_blank"
              rel="noreferrer"
              className={`px-3 py-2 rounded-lg border border-gray-200 text-sm ${pdfUrl ? 'hover:bg-white' : 'opacity-50 cursor-not-allowed'}`}
            >
              Open in new tab
            </a>
            <a
              href={pdfUrl || undefined}
              download={`Invoice_${id || 'template'}.pdf`}
              className={`px-3 py-2 rounded-lg border border-gray-200 text-sm ${pdfUrl ? 'hover:bg-white' : 'opacity-50 cursor-not-allowed'}`}
            >
              Download PDF
            </a>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!pdfUrl}
              className={`px-3 py-2 rounded-lg text-sm ${pdfUrl ? 'bg-brand text-white hover:bg-brand-dark' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            >
              Print
            </button>
          </div>
        </div>

        {loading && (
          <div className="p-4 rounded-lg border border-dashed border-gray-300 bg-white text-sm text-gray-600">
            Loading invoice details…
          </div>
        )}

        {!loading && error && (
          <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
            {error}{' '}
            <Link to="/invoices" className="underline font-medium">
              Back to invoices
            </Link>
          </div>
        )}

        {!loading && invoice && (
          <section className="bg-white rounded-xl border border-gray-100 p-4 text-sm text-gray-700 space-y-2">
            <div className="flex flex-wrap gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Invoice ID</div>
                <div className="font-medium text-gray-900">{invoice.id}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Status</div>
                <div className="font-medium capitalize text-gray-900">{invoice.status || 'draft'}</div>
              </div>
              {invoice.customerName && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Customer</div>
                  <div className="font-medium text-gray-900">{invoice.customerName}</div>
                </div>
              )}
              {invoice.quoteId && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Quote Ref</div>
                  <div className="font-medium text-gray-900">{invoice.quoteId}</div>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              The preview renders your live invoice data on top of the official Sales_205 template. Use the actions above
              to print or download the generated PDF without re-entering details.
            </div>
          </section>
        )}

        {generating && (
          <div className="p-4 rounded-lg border border-dashed border-gray-300 bg-white text-sm text-gray-600">
            Preparing PDF with live data…
          </div>
        )}

        {generationError && (
          <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
            {generationError} You can still{' '}
            <a href="/invoice/Sales_205.pdf" target="_blank" rel="noreferrer" className="underline">
              open the blank template
            </a>{' '}
            while we troubleshoot.
          </div>
        )}

        <section className="bg-white rounded-xl border border-gray-100 p-2">
          <iframe
            key={pdfUrl || id}
            ref={iframeRef}
            src={pdfUrl || 'about:blank'}
            title="Invoice Template Viewer"
            className="w-full rounded-lg border border-gray-200"
            style={{ minHeight: '75vh' }}
          />
        </section>
      </main>
      <Footer />
    </div>
  )
}


