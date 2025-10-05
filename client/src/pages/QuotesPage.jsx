import { useEffect, useMemo, useState } from 'react'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../utils/api.js'

export default function QuotesPage() {
  const [leads, setLeads] = useState([])
  const [quotes, setQuotes] = useState([])
  const [form, setForm] = useState({ leadId: '', items: [{ itemId: '', name: '', qty: 1, price: 0 }] })
  const [convertForm, setConvertForm] = useState({ customerName: '', siteAddress: '', capacityKw: 0 })

  useEffect(() => {
    Promise.all([
      api.get('/api/leads'),
      api.get('/api/quotes'),
    ]).then(([l, q]) => {
      setLeads(l.data.leads || [])
      setQuotes(q.data.quotes || [])
    })
  }, [])

  const total = useMemo(()=> form.items.reduce((s, it)=> s + (Number(it.qty)||0)*(Number(it.price)||0), 0), [form.items])

  function updateItem(idx, patch) {
    setForm((f)=> ({...f, items: f.items.map((it, i)=> i===idx ? {...it, ...patch}: it)}))
  }

  function addLine() {
    setForm((f)=> ({...f, items: [...f.items, { itemId: '', name: '', qty: 1, price: 0 }]}))
  }

  function removeLine(idx) {
    setForm((f)=> ({...f, items: f.items.filter((_, i)=> i!==idx)}))
  }

  async function createQuote(e) {
    e.preventDefault()
    if (!form.leadId) return
    const payload = { leadId: form.leadId, items: form.items.map(it=> ({ itemId: it.itemId||null, name: it.name, qty: Number(it.qty)||0, price: Number(it.price)||0 })) }
    const res = await api.post('/api/quotes', payload)
    setQuotes((prev)=>[res.data.quote, ...prev])
    setForm({ leadId: '', items: [{ itemId: '', name: '', qty: 1, price: 0 }] })
  }

  async function convertToProject(id) {
    const payload = { ...convertForm }
    const res = await api.post(`/api/quotes/${id}/convert`, payload)
    setQuotes((prev)=> prev.map((q)=> q.id===id ? res.data.quote : q))
    setConvertForm({ customerName: '', siteAddress: '', capacityKw: 0 })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand/5 to-white">
      <TopNav />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fadein">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Quotes</h2>
            <p className="text-sm text-gray-500">Create and track quotations</p>
          </div>
        </div>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <form onSubmit={createQuote} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select className="rounded-lg border px-3 py-2" value={form.leadId} onChange={(e)=>setForm((s)=>({...s,leadId:e.target.value}))}>
                <option value="">Select lead</option>
                {leads.map((l)=> <option key={l.id} value={l.id}>{l.name} • {l.status}</option>)}
              </select>
              <div className="sm:col-span-2 text-right text-sm text-gray-600">Total: <span className="font-semibold">₹ {total.toLocaleString()}</span></div>
            </div>

            <div className="space-y-2">
              {form.items.map((it, idx)=> (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                  <input className="rounded-lg border px-3 py-2 sm:col-span-3" placeholder="Item name/desc" value={it.name} onChange={(e)=>updateItem(idx, { name: e.target.value })} />
                  <input type="number" min="0" className="rounded-lg border px-3 py-2 sm:col-span-1" placeholder="Qty" value={it.qty} onChange={(e)=>updateItem(idx, { qty: e.target.value })} />
                  <input type="number" min="0" className="rounded-lg border px-3 py-2 sm:col-span-1" placeholder="Price" value={it.price} onChange={(e)=>updateItem(idx, { price: e.target.value })} />
                  <button type="button" onClick={()=>removeLine(idx)} className="rounded-lg border px-3 py-2 sm:col-span-1 hover:bg-gray-50">Remove</button>
                </div>
              ))}
              <button type="button" onClick={addLine} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">+ Add line</button>
            </div>

            <div className="text-right">
              <button className="rounded-lg bg-brand text-white px-3 py-2 hover:bg-brand-dark">Create Quote</button>
            </div>
          </form>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotes.map((q)=>(
            <div key={q.id} className="border rounded-2xl p-5 bg-white shadow-sm">
              <div className="flex items-center justify-between"><div className="font-medium">Quote {q.id}</div><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{q.status}</span></div>
              <div className="text-sm text-gray-600">Lead: {q.leadId || '—'}</div>
              <div className="text-sm">Amount: <span className="font-semibold">₹ {Number(q.amount||0).toLocaleString()}</span></div>
              <div className="mt-2 text-xs text-gray-500">Lines: {q.items?.length||0}</div>
              {!q.projectId && (
                <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                  <input className="rounded-lg border px-3 py-2" placeholder="Customer name" value={convertForm.customerName} onChange={(e)=>setConvertForm((s)=>({...s,customerName:e.target.value}))} />
                  <input className="rounded-lg border px-3 py-2" placeholder="Site address" value={convertForm.siteAddress} onChange={(e)=>setConvertForm((s)=>({...s,siteAddress:e.target.value}))} />
                  <input type="number" min="0" className="rounded-lg border px-3 py-2" placeholder="Capacity (kW)" value={convertForm.capacityKw} onChange={(e)=>setConvertForm((s)=>({...s,capacityKw:Number(e.target.value)||0}))} />
                  <button onClick={()=>convertToProject(q.id)} className="rounded-lg bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-700">Convert to Project</button>
                </div>
              )}
              {q.projectId && <div className="mt-2 text-xs text-emerald-700">Converted → {q.projectId}</div>}
            </div>
          ))}
          {quotes.length===0 && <div className="text-sm text-gray-500">No quotes yet.</div>}
        </section>
      </div>
      <Footer />
    </div>
  )
}


