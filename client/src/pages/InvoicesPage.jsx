import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../utils/api.js'
import { subscribeToLive } from '../utils/live.js'

export default function InvoicesPage() {
  const [quotes, setQuotes] = useState([])
  const [invoices, setInvoices] = useState([])
  const [leads, setLeads] = useState([])
  const [form, setForm] = useState({ quoteId: '', customerName: '', amount: 0 })
  const money = (v)=> `₹ ${Number(v||0).toLocaleString('en-IN')}`
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ customerName: '', status: 'draft', items: [] })

  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 6
  useEffect(() => {
    Promise.all([
      api.get('/api/quotes'),
      api.get('/api/invoices', { params: { page, size: pageSize } }),
      api.get('/api/leads'),
    ]).then(([q, inv, l]) => {
      setQuotes(q.data.quotes||[])
      setInvoices(inv.data.invoices||[])
      if (typeof inv.data.total === 'number') setTotal(inv.data.total)
      setLeads(l.data.leads||[])
    })
    const unsub = subscribeToLive(undefined, (evt)=>{
      if (evt?.entity === 'invoice') {
        if (evt.type === 'create') setInvoices((prev)=> [evt.payload, ...prev])
        if (evt.type === 'update') setInvoices((prev)=> prev.map((i)=> i.id===evt.id? evt.payload: i))
        if (evt.type === 'bulk') setInvoices(Array.isArray(evt.payload)? evt.payload : [])
      }
      if (evt?.entity === 'quote') {
        if (evt.type === 'create') setQuotes((prev)=> [evt.payload, ...prev])
        if (evt.type === 'update') setQuotes((prev)=> prev.map((qq)=> qq.id===evt.id? evt.payload: qq))
        if (evt.type === 'bulk') setQuotes(Array.isArray(evt.payload)? evt.payload : [])
      }
    })
    return unsub
  }, [page])

  useEffect(() => {
    if (!form.quoteId) return
    const q = quotes.find((x)=> x.id === form.quoteId)
    if (q) {
      const leadName = q.leadId ? (leads.find((l)=> l.id===q.leadId)?.name || q.leadId) : 'Customer'
      setForm((f)=> ({...f, customerName: leadName, amount: q.amount }))
    }
  }, [form.quoteId, quotes, leads])

  async function createInvoice(e) {
    e.preventDefault()
    if (!form.customerName) return
    const res = await api.post('/api/invoices', form)
    setInvoices((prev)=> [res.data.invoice, ...prev])
    setForm({ quoteId: '', customerName: '', amount: 0 })
  }

  function exportCsv() {
    const rows = [["Invoice Id","Customer","Amount ₹","Status","Quote Id"]]
    invoices.forEach((inv)=> rows.push([inv.id, inv.customerName||'', inv.totals?.grandTotal ?? inv.amount ?? 0, inv.status||'', inv.quoteId||'']))
    const csv = rows.map(r=> r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(["\uFEFF", csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'invoices.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function openEdit(inv) {
    setEditing(inv)
    setEditForm({
      customerName: inv.customerName || '',
      status: inv.status || 'draft',
      items: (inv.items||[]).map(it=> ({ description: it.description||'', qty: it.qty||0, price: it.price||0, taxPercent: it.taxPercent||0 }))
    })
    setEditOpen(true)
  }

  async function saveEdit() {
    try {
      const res = await api.put(`/api/invoices/${editing.id}`, editForm)
      setInvoices((prev)=> prev.map((i)=> i.id===editing.id ? res.data.invoice : i))
      setEditOpen(false)
      setEditing(null)
    } catch (_) {}
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
          <div className="md:col-span-2 lg:col-span-3 -mt-2 -mb-2 flex justify-end">
            <button onClick={exportCsv} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50">Export CSV</button>
          </div>
          {invoices.map((inv)=>(
            <div key={inv.id} className="border rounded-2xl p-5 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">{inv.id}</div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/invoices/${inv.id}/print`}
                    className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-50"
                  >
                    Print template
                  </Link>
                  <button onClick={()=> openEdit(inv)} className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-50">Edit details</button>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{inv.status}</span>
                </div>
              </div>
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
          {(total>pageSize) && (
            <div className="md:col-span-2 lg:col-span-3 flex items-center justify-center gap-2 text-sm">
              <button disabled={page===1} onClick={()=>setPage((p)=>Math.max(1,p-1))} className="px-3 py-1.5 rounded-lg border disabled:opacity-50">Prev</button>
              <span>Page {page} / {Math.ceil((total||0)/pageSize)}</span>
              <button disabled={page>=Math.ceil((total||0)/pageSize)} onClick={()=>setPage((p)=>p+1)} className="px-3 py-1.5 rounded-lg border disabled:opacity-50">Next</button>
            </div>
          )}
        </section>

        {/* Edit Invoice Modal */}
        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={()=>{setEditOpen(false); setEditing(null)}} />
            <div className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 p-5 animate-fadein">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">Edit Invoice</div>
                <button onClick={()=>{setEditOpen(false); setEditing(null)}} className="px-2 py-1 text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Customer</label>
                    <input className="w-full rounded-lg border px-3 py-2" value={editForm.customerName} onChange={(e)=>setEditForm((s)=>({...s, customerName: e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Status</label>
                    <select className="w-full rounded-lg border px-3 py-2" value={editForm.status} onChange={(e)=>setEditForm((s)=>({...s, status: e.target.value}))}>
                      <option value="draft">draft</option>
                      <option value="sent">sent</option>
                      <option value="paid">paid</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-700 mb-2">Lines</div>
                  <div className="space-y-2">
                    {editForm.items.map((it, idx)=> (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                        <input className="rounded-lg border px-3 py-2 sm:col-span-3" placeholder="Description" value={it.description} onChange={(e)=> setEditForm((s)=> ({...s, items: s.items.map((x,i)=> i===idx? {...x, description: e.target.value }: x)}))} />
                        <input type="number" min="0" className="rounded-lg border px-3 py-2 sm:col-span-1" placeholder="Qty" value={it.qty} onChange={(e)=> setEditForm((s)=> ({...s, items: s.items.map((x,i)=> i===idx? {...x, qty: Number(e.target.value)||0 }: x)}))} />
                        <input type="number" min="0" className="rounded-lg border px-3 py-2 sm:col-span-1" placeholder="Price" value={it.price} onChange={(e)=> setEditForm((s)=> ({...s, items: s.items.map((x,i)=> i===idx? {...x, price: Number(e.target.value)||0 }: x)}))} />
                        <input type="number" min="0" className="rounded-lg border px-3 py-2 sm:col-span-1" placeholder="Tax %" value={it.taxPercent} onChange={(e)=> setEditForm((s)=> ({...s, items: s.items.map((x,i)=> i===idx? {...x, taxPercent: Number(e.target.value)||0 }: x)}))} />
                      </div>
                    ))}
                    <button type="button" onClick={()=> setEditForm((s)=> ({...s, items: [...s.items, { description: '', qty: 0, price: 0, taxPercent: 0 }]}))} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50">+ Add line</button>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={()=>{setEditOpen(false); setEditing(null)}} className="px-3 py-2 rounded-lg border text-sm">Cancel</button>
                <button onClick={saveEdit} className="px-3 py-2 rounded-lg bg-brand text-white text-sm">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}


