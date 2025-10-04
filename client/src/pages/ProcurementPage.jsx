import { useEffect, useMemo, useState } from 'react'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../utils/api.js'

export default function ProcurementPage() {
  const [items, setItems] = useState([])
  const [pos, setPos] = useState([])
  const [form, setForm] = useState({ supplier: 'Vendor', lines: [{ itemId: '', qty: 0 }] })

  useEffect(() => {
    Promise.all([
      api.get('/api/items'),
      api.get('/api/purchase-orders'),
    ]).then(([it, po]) => {
      setItems(it.data.items||[])
      setPos(po.data.purchaseOrders||[])
    })
  }, [])

  function updateLine(idx, patch) {
    setForm((f)=> ({...f, lines: f.lines.map((ln, i)=> i===idx ? {...ln, ...patch} : ln)}))
  }

  function addLine() {
    setForm((f)=> ({...f, lines: [...f.lines, { itemId: '', qty: 0 }]}))
  }

  function removeLine(idx) {
    setForm((f)=> ({...f, lines: f.lines.filter((_, i)=> i!==idx)}))
  }

  const summary = useMemo(()=> form.lines.reduce((s, ln)=> s + (Number(ln.qty)||0), 0), [form.lines])

  async function createPO(e) {
    e.preventDefault()
    const validLines = form.lines.filter((ln)=> ln.itemId && Number(ln.qty)>0)
    if (validLines.length===0) return
    const res = await api.post('/api/purchase-orders', { supplier: form.supplier, lines: validLines, status: 'ordered' })
    setPos((prev)=>[res.data.purchaseOrder, ...prev])
    setForm({ supplier: 'Vendor', lines: [{ itemId: '', qty: 0 }] })
  }

  async function receivePO(id) {
    const res = await api.post(`/api/purchase-orders/${id}/receive`)
    setPos((prev)=> prev.map((p)=> p.id===id ? res.data.purchaseOrder : p))
    // Update items list with new stocks
    setItems(res.data.items)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand/5 to-white">
      <TopNav />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fadein">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Procurement</h2>
            <p className="text-sm text-gray-500">Create POs and receive stock</p>
          </div>
          <div className="text-xs text-gray-600">Items: {items.length} • POs: {pos.length}</div>
        </div>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <form onSubmit={createPO} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input className="rounded-lg border px-3 py-2" value={form.supplier} onChange={(e)=>setForm((s)=>({...s,supplier:e.target.value}))} />
              <div className="sm:col-span-2 text-right text-sm text-gray-600">Total lines: <span className="font-semibold">{summary}</span></div>
            </div>
            <div className="space-y-2">
              {form.lines.map((ln, idx)=> (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <select className="rounded-lg border px-3 py-2 sm:col-span-3" value={ln.itemId} onChange={(e)=>updateLine(idx,{ itemId: e.target.value })}>
                    <option value="">Select item</option>
                    {items.map((it)=> <option key={it.id} value={it.id}>{it.name} • {it.sku}</option>)}
                  </select>
                  <input type="number" min="0" className="rounded-lg border px-3 py-2 sm:col-span-1" placeholder="Qty" value={ln.qty} onChange={(e)=>updateLine(idx,{ qty: e.target.value })} />
                  <button type="button" onClick={()=>removeLine(idx)} className="rounded-lg border px-3 py-2 sm:col-span-1 hover:bg-gray-50">Remove</button>
                </div>
              ))}
              <button type="button" onClick={addLine} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">+ Add line</button>
            </div>

            <div className="text-right">
              <button className="rounded-lg bg-brand text-white px-3 py-2 hover:bg-brand-dark">Create PO</button>
            </div>
          </form>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pos.map((p)=>(
            <div key={p.id} className="border rounded-2xl p-5 bg-white shadow-sm">
              <div className="flex items-center justify-between"><div className="font-medium">{p.id}</div><span className={`text-xs px-2 py-0.5 rounded bg-gray-100`}>{p.status}</span></div>
              <div className="text-sm text-gray-600">Supplier: {p.supplier}</div>
              <div className="text-xs text-gray-500">Lines: {p.items?.length||0}</div>
              {p.status!=='received' && <button onClick={()=>receivePO(p.id)} className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700">Mark Received</button>}
            </div>
          ))}
          {pos.length===0 && <div className="text-sm text-gray-500">No purchase orders yet.</div>}
        </section>
      </div>
      <Footer />
    </div>
  )
}


