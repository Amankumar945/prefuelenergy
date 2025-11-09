import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../utils/api.js'
import { generateQuotePdf } from '../utils/quotePdf.js'
import { formatINR } from '../utils/currency.js'

export default function QuotePrintPage() {
  const { id } = useParams()
  const [quote, setQuote] = useState(null)
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const iframeRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    async function loadData() {
      try {
        const [quotesRes, leadsRes] = await Promise.all([api.get('/api/quotes'), api.get('/api/leads')])
        if (!active) return
        const quotesList = Array.isArray(quotesRes.data?.quotes) ? quotesRes.data.quotes : []
        const foundQuote = quotesList.find((item) => item.id === id)
        if (!foundQuote) {
          setError('Quotation not found. Please go back and refresh your quotation list.')
          setQuote(null)
          return
        }
        setQuote(foundQuote)
        const leadList = Array.isArray(leadsRes.data?.leads) ? leadsRes.data.leads : []
        const foundLead = foundQuote.leadId ? leadList.find((item) => item.id === foundQuote.leadId) : null
        setLead(foundLead || null)
      } catch (err) {
        if (!active) return
        setError(err?.response?.data?.message || 'Unable to load quotation details.')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadData()
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    document.title = quote ? `Quotation ${quote.id} • Prefuel Energy` : 'Quotation Preview • Prefuel Energy'
  }, [quote])

  useEffect(() => {
    if (!quote) {
      setPdfUrl('')
      return
    }
    let cancelled = false
    let currentUrl = ''
    async function buildPdf() {
      setGenerating(true)
      setGenerationError('')
      try {
        const url = await generateQuotePdf(quote, lead)
        if (cancelled) {
          URL.revokeObjectURL(url)
          return
        }
        currentUrl = url
        setPdfUrl(url)
      } catch (err) {
        if (!cancelled) {
          setGenerationError(err?.message || 'Failed to prepare the quotation PDF.')
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
  }, [quote, lead])

  function handlePrint() {
    if (!pdfUrl) return
    const frame = iframeRef.current
    if (frame?.contentWindow) {
      try {
        frame.contentWindow.focus()
        frame.contentWindow.print()
        return
      } catch (_) {
        // Fall through to window.print()
      }
    }
    window.print()
  }

  const total = Array.isArray(quote?.items)
    ? quote.items.reduce((sum, item) => {
        const qty = Number(item.qty || 0)
        const price = Number(item.price || 0)
        if (qty && price) return sum + qty * price
        return sum + Number(item.amount || 0)
      }, 0)
    : Number(quote?.amount || 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Quotation Print Preview</h1>
            <p className="text-sm text-gray-600">
              This preview renders your quotation on the official company template. Use the actions to print or download
              the generated PDF.
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
              href="/quotation/SINGLE_QT_SBI.docx"
              download
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-white"
            >
              Blank DOCX
            </a>
            <a
              href={pdfUrl || undefined}
              target="_blank"
              rel="noreferrer"
              className={`px-3 py-2 rounded-lg border border-gray-200 text-sm ${
                pdfUrl ? 'hover:bg-white' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              Open in new tab
            </a>
            <a
              href={pdfUrl || undefined}
              download={`Quotation_${id || 'template'}.pdf`}
              className={`px-3 py-2 rounded-lg border border-gray-200 text-sm ${
                pdfUrl ? 'hover:bg-white' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              Download PDF
            </a>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!pdfUrl}
              className={`px-3 py-2 rounded-lg text-sm ${
                pdfUrl ? 'bg-brand text-white hover:bg-brand-dark' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              Print
            </button>
          </div>
        </div>

        {loading && (
          <div className="p-4 rounded-lg border border-dashed border-gray-300 bg-white text-sm text-gray-600">
            Loading quotation details…
          </div>
        )}

        {!loading && error && (
          <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
            {error}{' '}
            <Link to="/quotes" className="underline font-medium">
              Back to quotations
            </Link>
          </div>
        )}

        {!loading && quote && (
          <section className="bg-white rounded-xl border border-gray-100 p-4 text-sm text-gray-700 space-y-2">
            <div className="flex flex-wrap gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Quotation ID</div>
                <div className="font-medium text-gray-900">{quote.id}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Status</div>
                <div className="font-medium capitalize text-gray-900">{quote.status || 'draft'}</div>
              </div>
              {quote.name && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">System</div>
                  <div className="font-medium text-gray-900">{quote.name}</div>
                </div>
              )}
              {lead?.name && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Lead</div>
                  <div className="font-medium text-gray-900">{lead.name}</div>
                </div>
              )}
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Value</div>
                <div className="font-medium text-gray-900">{formatINR(total)}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Any updates you apply to the quotation or lead will be reflected the next time you open this preview.
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
            <a href="/quotation/SINGLE_QT_SBI.docx" target="_blank" rel="noreferrer" className="underline">
              download the blank DOCX template
            </a>{' '}
            while we troubleshoot.
          </div>
        )}

        <section className="bg-white rounded-xl border border-gray-100 p-2">
          <iframe
            key={pdfUrl || id}
            ref={iframeRef}
            src={pdfUrl || 'about:blank'}
            title="Quotation Template Viewer"
            className="w-full rounded-lg border border-gray-200"
            style={{ minHeight: '75vh' }}
          />
        </section>
      </main>
      <Footer />
    </div>
  )
}


