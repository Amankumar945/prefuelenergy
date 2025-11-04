import { useEffect, useState } from 'react'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../utils/api.js'
import Modal from '../components/Modal.jsx'
import { subscribeToLive } from '../utils/live.js'

export default function InventoryPage() {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 9
  const [form, setForm] = useState({ name: '', sku: '', unit: 'pcs', stock: '', minStock: '' })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', sku: '', unit: 'pcs', stock: 0, minStock: 0 })

  const user = JSON.parse(localStorage.getItem('user')||'{}')
  const role = user?.role || ''
  const canEditInventory = ['admin','staff','ops'].includes(role)
  const canDeleteInventory = ['admin','ops'].includes(role)

  useEffect(() => {
    api.get('/api/items').then((res)=> setItems(res.data.items||[]))
    const unsub = subscribeToLive(undefined, (evt)=>{
      if (evt?.entity !== 'item') return
      if (evt.type === 'create') setItems((prev)=> [...prev, evt.payload])
      if (evt.type === 'update') setItems((prev)=> prev.map((x)=> x.id===evt.id ? evt.payload : x))
      if (evt.type === 'delete') setItems((prev)=> prev.filter((x)=> x.id!==evt.id))
      if (evt.type === 'bulk' && Array.isArray(evt.payload)) setItems(evt.payload)
    })
    return unsub
  }, [])

  async function addItem(e) {
    e.preventDefault()
    setAddError('')
    if (!form.name.trim() || !form.sku.trim()) {
      setAddError('Please enter item name and SKU')
      return
    }
    try {
      setAdding(true)
      const res = await api.post('/api/items', {
        name: form.name.trim(),
        sku: form.sku.trim(),
        unit: form.unit,
        stock: Number(form.stock)||0,
        minStock: Number(form.minStock)||0
      })
      setItems((prev)=>[...prev, res.data.item])
      setForm({ name: '', sku: '', unit: 'pcs', stock: '', minStock: '' })
      setPage(1)
    } catch (err) {
      setAddError(err?.response?.data?.message || 'Failed to add item')
    } finally {
      setAdding(false)
    }
  }

  const filtered = items.filter((it)=> (
    (!query.trim() || it.name.toLowerCase().includes(query.trim().toLowerCase()) || it.sku.toLowerCase().includes(query.trim().toLowerCase())) &&
    (!lowOnly || it.stock<=it.minStock)
  ))
  const start = (page-1)*pageSize
  const paged = filtered.slice(start, start+pageSize)

  function openEdit(it) {
    if (!canEditInventory) {
      alert('You do not have permission to edit inventory items')
      return
    }
    setEditingId(it.id)
    setEditForm({ name: it.name, sku: it.sku, unit: it.unit, stock: it.stock, minStock: it.minStock })
    setEditOpen(true)
  }

  function exportCsv() {
    const rows = [["Name","SKU","Unit","Stock","Min"]]
    filtered.forEach((it)=> rows.push([it.name||'', it.sku||'', it.unit||'', it.stock||0, it.minStock||0]))
    const csv = rows.map(r=> r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(["\uFEFF", csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventory.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function saveEdit() {
    try {
      const res = await api.put(`/api/items/${editingId}`, {
        name: editForm.name,
        sku: editForm.sku,
        unit: editForm.unit,
        stock: Number(editForm.stock)||0,
        minStock: Number(editForm.minStock)||0,
      })
      setItems((prev)=> prev.map((x)=> x.id===editingId ? res.data.item : x))
      setEditOpen(false)
      setEditingId(null)
    } catch (err) {
      const status = err?.response?.status
      if (status === 403) alert('You do not have permission to edit items')
      else alert(err?.response?.data?.message || 'Failed to save changes')
    }
  }

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
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Matches: {filtered.length}</div>
              <button onClick={exportCsv} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50">Export CSV</button>
            </div>
          </div>
          <form onSubmit={addItem} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <input className="rounded-lg border px-3 py-2 sm:col-span-2" placeholder="Item name" value={form.name} onChange={(e)=>setForm((s)=>({...s,name:e.target.value}))} />
            <input className="rounded-lg border px-3 py-2 sm:col-span-1" placeholder="SKU" value={form.sku} onChange={(e)=>setForm((s)=>({...s,sku:e.target.value}))} />
            <select className="rounded-lg border px-3 py-2 sm:col-span-1" value={form.unit} onChange={(e)=>setForm((s)=>({...s,unit:e.target.value}))}>
              <option>pcs</option>
              <option>unit</option>
              <option>set</option>
              <option>m</option>
            </select>
            <input className="rounded-lg border px-3 py-2 sm:col-span-1" type="number" min="0" placeholder="Stock" value={form.stock} onChange={(e)=>setForm((s)=>({...s,stock:e.target.value}))} />
            <input className="rounded-lg border px-3 py-2 sm:col-span-1" type="number" min="0" placeholder="Min" value={form.minStock} onChange={(e)=>setForm((s)=>({...s,minStock:e.target.value}))} />
            <button disabled={adding} className="sm:col-span-6 rounded-lg bg-brand text-white px-3 py-2 hover:bg-brand-dark disabled:opacity-60">{adding ? 'Adding…' : 'Add Item'}</button>
          </form>
          {addError && <div className="mt-2 text-sm text-red-600">{addError}</div>}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paged.map((it)=>(
            <div key={it.id} className={`border rounded-2xl p-5 bg-white shadow-sm ${it.stock<=it.minStock?'ring-1 ring-red-300':''}`}>
              <div className="flex items-center justify-between">
                <div className="font-medium">{it.name}</div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{it.sku}</span>
              </div>
              <div className="text-sm text-gray-600">Unit: {it.unit}</div>
              <div className="text-sm">Stock: <span className="font-medium">{it.stock}</span> • Min: {it.minStock}</div>
              <div className="mt-3 flex items-center justify-between gap-2">
                {canEditInventory && (
                  <button onClick={()=> openEdit(it)} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">Edit details</button>
                )}
                <button
                  disabled={!canDeleteInventory}
                  onClick={async()=>{
                  if (!canDeleteInventory) return alert('You do not have permission to delete items')
                  if (!confirm('Delete this item permanently?')) return
                  try {
                    await api.delete(`/api/items/${it.id}`)
                    setItems((prev)=> prev.filter((x)=> x.id!==it.id))
                  } catch (err) {
                    const status = err?.response?.status
                    if (status === 403) alert('You do not have permission to delete items')
                  }
                }}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${canDeleteInventory ? 'text-red-600 hover:bg-red-50' : 'text-gray-400 cursor-not-allowed'}`}
                >Delete</button>
              </div>
            </div>
          ))}
          {filtered.length===0 && <div className="text-sm text-gray-500">No items match.</div>}
        </section>
        <Modal open={editOpen} title="Edit Item" onClose={()=>{setEditOpen(false); setEditingId(null)}} onPrimary={saveEdit} primaryText="Save">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Item name</label>
                <input className="w-full rounded-lg border px-3 py-2" value={editForm.name} onChange={(e)=>setEditForm((s)=>({...s,name:e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">SKU</label>
                <input className="w-full rounded-lg border px-3 py-2" value={editForm.sku} onChange={(e)=>setEditForm((s)=>({...s,sku:e.target.value}))} />
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Unit</label>
                <select className="w-full rounded-lg border px-3 py-2" value={editForm.unit} onChange={(e)=>setEditForm((s)=>({...s,unit:e.target.value}))}>
                  <option>pcs</option>
                  <option>unit</option>
                  <option>set</option>
                  <option>m</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Stock</label>
                  <input className="w-full rounded-lg border px-3 py-2" type="number" min="0" value={editForm.stock} onChange={(e)=>setEditForm((s)=>({...s,stock:e.target.value}))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min stock</label>
                  <input className="w-full rounded-lg border px-3 py-2" type="number" min="0" value={editForm.minStock} onChange={(e)=>setEditForm((s)=>({...s,minStock:e.target.value}))} />
                </div>
              </div>
            </div>
          </div>
        </Modal>
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


