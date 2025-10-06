import { useEffect, useMemo, useState } from 'react'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../utils/api.js'

export default function InvoicesPage() {
  const [quotes, setQuotes] = useState([])
  const [invoices, setInvoices] = useState([])
  const [form, setForm] = useState({ quoteId: '', customerName: '', amount: 0 })
  const money = (v)=> `₹ ${Number(v||0).toLocaleString('en-IN')}`

  useEffect(() => {
    Promise.all([
      api.get('/api/quotes'),
      api.get('/api/invoices'),
    ]).then(([q, inv]) => {
      setQuotes(q.data.quotes||[])
      setInvoices(inv.data.invoices||[])
    })
  }, [])

  useEffect(() => {
    if (!form.quoteId) return
    const q = quotes.find((x)=> x.id === form.quoteId)
    if (q) setForm((f)=> ({...f, customerName: q.leadId || 'Customer', amount: q.amount }))
  }, [form.quoteId])

  async function createInvoice(e) {
    e.preventDefault()
    if (!form.customerName) return
    const res = await api.post('/api/invoices', form)
    setInvoices((prev)=> [res.data.invoice, ...prev])
    setForm({ quoteId: '', customerName: '', amount: 0 })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand/5 to-white">
      <TopNav />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fadein">
        <div>
          <h2 className="text-lg font-semibold">Invoices</h2>
          <p className="text-sm text-gray-500">Create invoices from quotes</p>
        </div>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <form onSubmit={createInvoice} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <select className="rounded-lg border px-3 py-2 sm:col-span-2" value={form.quoteId} onChange={(e)=>setForm((s)=>({...s,quoteId:e.target.value}))}>
              <option value="">Select quote</option>
              {quotes.map((q)=> <option key={q.id} value={q.id}>{q.name || q.id} • ₹ {Number(q.amount||0).toLocaleString('en-IN')}</option>)}
            </select>
            <input className="rounded-lg border px-3 py-2 sm:col-span-2" placeholder="Customer name" value={form.customerName} onChange={(e)=>setForm((s)=>({...s,customerName:e.target.value}))} />
            <input type="number" min="0" className="rounded-lg border px-3 py-2 sm:col-span-1" placeholder="Amount" value={form.amount} onChange={(e)=>setForm((s)=>({...s,amount:Number(e.target.value)||0}))} />
            <button className="rounded-lg bg-brand text-white px-3 py-2 sm:col-span-1 hover:bg-brand-dark">Create</button>
          </form>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.map((inv)=>(
            <div key={inv.id} className="border rounded-2xl p-5 bg-white shadow-sm">
              <div className="flex items-center justify-between"><div className="font-medium">{inv.id}</div><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{inv.status}</span></div>
              <div className="text-sm text-gray-600">{inv.customerName}</div>
              <div className="text-sm">{money(inv.totals?.grandTotal ?? inv.amount)}</div>
              <div className="text-xs text-gray-500">From Quote: {inv.quoteId || '—'}</div>
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer select-none text-brand">View Invoice</summary>
                <div className="mt-2 space-y-1">
                  {inv.items?.map((it, idx)=>{
                    const line = (Number(it.qty)||0)*(Number(it.price)||0)
                    const tax = line*((Number(it.taxPercent)||0)/100)
                    return (
                      <div key={idx} className="p-2 rounded border bg-gray-50">
                        <div>{it.description}</div>
                        <div>Qty: {it.qty} × Price: {money(it.price)} • Tax: {it.taxPercent}%</div>
                        <div>Line: {money(line)} • Tax: {money(tax)}</div>
                      </div>
                    )
                  })}
                  <div className="pt-2 text-gray-700">
                    Subtotal: <b>{money(inv.totals?.subtotal)}</b> • Tax: <b>{money(inv.totals?.tax)}</b> • Total: <b>{money(inv.totals?.grandTotal)}</b>
                  </div>
                </div>
              </details>
            </div>
          ))}
          {invoices.length===0 && <div className="text-sm text-gray-500">No invoices yet.</div>}
        </section>
      </div>
      <Footer />
    </div>
  )
}


