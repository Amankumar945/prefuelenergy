import { useEffect, useState } from 'react'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../utils/api.js'

export default function InventoryPage() {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 9
  const [form, setForm] = useState({ name: '', sku: '', unit: 'pcs', stock: 0, minStock: 0 })

  useEffect(() => {
    api.get('/api/items').then((res)=> setItems(res.data.items||[]))
  }, [])

  async function addItem(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.sku.trim()) return
    const res = await api.post('/api/items', {
      name: form.name.trim(), sku: form.sku.trim(), unit: form.unit, stock: Number(form.stock)||0, minStock: Number(form.minStock)||0
    })
    setItems((prev)=>[...prev, res.data.item])
    setForm({ name: '', sku: '', unit: 'pcs', stock: 0, minStock: 0 })
  }

  const filtered = items.filter((it)=> (
    (!query.trim() || it.name.toLowerCase().includes(query.trim().toLowerCase()) || it.sku.toLowerCase().includes(query.trim().toLowerCase())) &&
    (!lowOnly || it.stock<=it.minStock)
  ))
  const start = (page-1)*pageSize
  const paged = filtered.slice(start, start+pageSize)

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand/5 to-white">
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fadein">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Inventory</h2>
            <p className="text-sm text-gray-500">Track items and stock thresholds</p>
          </div>
          <div className="text-xs text-gray-600">Low stock: {items.filter(it=>it.stock<=it.minStock).length}</div>
        </div>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
            <input className="rounded-lg border px-3 py-2 sm:col-span-2" placeholder="Search name/SKU" value={query} onChange={(e)=>{setQuery(e.target.value); setPage(1)}} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lowOnly} onChange={(e)=>{setLowOnly(e.target.checked); setPage(1)}} />Show low stock only</label>
            <div className="text-sm text-gray-600 flex items-center">Matches: {filtered.length}</div>
          </div>
          <form onSubmit={addItem} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <input className="rounded-lg border px-3 py-2 sm:col-span-2" placeholder="Item name" value={form.name} onChange={(e)=>setForm((s)=>({...s,name:e.target.value}))} />
            <input className="rounded-lg border px-3 py-2 sm:col-span-1" placeholder="SKU" value={form.sku} onChange={(e)=>setForm((s)=>({...s,sku:e.target.value}))} />
            <select className="rounded-lg border px-3 py-2 sm:col-span-1" value={form.unit} onChange={(e)=>setForm((s)=>({...s,unit:e.target.value}))}>
              <option>pcs</option>
              <option>unit</option>
              <option>set</option>
            </select>
            <input className="rounded-lg border px-3 py-2 sm:col-span-1" type="number" min="0" placeholder="Stock" value={form.stock} onChange={(e)=>setForm((s)=>({...s,stock:e.target.value}))} />
            <input className="rounded-lg border px-3 py-2 sm:col-span-1" type="number" min="0" placeholder="Min" value={form.minStock} onChange={(e)=>setForm((s)=>({...s,minStock:e.target.value}))} />
            <button className="sm:col-span-6 rounded-lg bg-brand text-white px-3 py-2 hover:bg-brand-dark">Add Item</button>
          </form>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paged.map((it)=>(
            <div key={it.id} className={`border rounded-2xl p-5 bg-white shadow-sm ${it.stock<=it.minStock?'ring-1 ring-amber-300':''}`}>
              <div className="flex items-center justify-between">
                <div className="font-medium">{it.name}</div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{it.sku}</span>
              </div>
              <div className="text-sm text-gray-600">Unit: {it.unit}</div>
              <div className="text-sm">Stock: <span className="font-medium">{it.stock}</span> • Min: {it.minStock}</div>
            </div>
          ))}
          {filtered.length===0 && <div className="text-sm text-gray-500">No items match.</div>}
        </section>
        {filtered.length>pageSize && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <button disabled={page===1} onClick={()=>setPage((p)=>Math.max(1,p-1))} className="px-3 py-1.5 rounded-lg border disabled:opacity-50">Prev</button>
            <span>Page {page} / {Math.ceil(filtered.length/pageSize)}</span>
            <button disabled={page>=Math.ceil(filtered.length/pageSize)} onClick={()=>setPage((p)=>p+1)} className="px-3 py-1.5 rounded-lg border disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}


