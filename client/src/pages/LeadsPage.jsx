import { useEffect, useMemo, useState } from 'react'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../utils/api.js'

function Pill({ children, color }) {
  const map = {
    new: 'bg-gray-100 text-gray-700 border-gray-200',
    qualified: 'bg-sky-100 text-sky-700 border-sky-200',
    quoted: 'bg-violet-100 text-violet-700 border-violet-200',
    won: 'bg-green-100 text-green-700 border-green-200',
    lost: 'bg-red-100 text-red-700 border-red-200',
  }
  return <span className={`text-[10px] px-2 py-1 rounded-full border ${map[color]||map.new}`}>{children}</span>
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 6
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: 'organic', projectSizeKw: 0 })

  useEffect(() => {
    api.get('/api/leads').then((res) => setLeads(res.data.leads||[]))
  }, [])

  async function addLead(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/api/leads', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        source: form.source,
        projectSizeKw: Number(form.projectSizeKw)||0,
      })
      setLeads((prev)=>[res.data.lead, ...prev])
      setForm({ name: '', phone: '', email: '', source: 'organic', projectSizeKw: 0 })
    } finally {
      setLoading(false)
    }
  }

  async function updateLead(id, patch) {
    const res = await api.put(`/api/leads/${id}`, patch)
    setLeads((prev)=>prev.map((l)=> l.id===id ? res.data.lead : l))
  }

  async function removeLead(id) {
    const user = JSON.parse(localStorage.getItem('user')||'{}')
    if (user?.role !== 'admin') return
    await api.delete(`/api/leads/${id}`)
    setLeads((prev)=>prev.filter((l)=>l.id!==id))
  }

  const stats = useMemo(()=>{
    const total = leads.length
    const byStatus = leads.reduce((acc, l)=>{acc[l.status]=(acc[l.status]||0)+1; return acc}, {})
    return { total, byStatus }
  }, [leads])

  const filtered = useMemo(()=>{
    const q = query.trim().toLowerCase()
    return leads.filter((l)=> (
      (!q || (l.name?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.phone?.toLowerCase().includes(q))) &&
      (!statusFilter || l.status === statusFilter)
    ))
  }, [leads, query, statusFilter])

  const paged = useMemo(()=>{
    const start = (page-1)*pageSize
    return filtered.slice(start, start+pageSize)
  }, [filtered, page])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand/5 to-white">
      <TopNav />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fadein">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Leads</h2>
            <p className="text-sm text-gray-500">Capture and track prospects</p>
          </div>
          <div className="text-xs text-gray-600">Total: {stats.total} • New: {stats.byStatus.new||0} • Qualified: {stats.byStatus.qualified||0} • Quoted: {stats.byStatus.quoted||0} • Won: {stats.byStatus.won||0}</div>
        </div>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
            <input className="rounded-lg border px-3 py-2 sm:col-span-2" placeholder="Search name/email/phone" value={query} onChange={(e)=>{setQuery(e.target.value); setPage(1)}} />
            <select className="rounded-lg border px-3 py-2 sm:col-span-1" value={statusFilter} onChange={(e)=>{setStatusFilter(e.target.value); setPage(1)}}>
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="qualified">Qualified</option>
              <option value="quoted">Quoted</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
            <div className="text-sm text-gray-600 flex items-center">Matches: {filtered.length}</div>
          </div>
          <form onSubmit={addLead} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <input className="sm:col-span-2 rounded-lg border px-3 py-2" placeholder="Full name" value={form.name} onChange={(e)=>setForm((s)=>({...s,name:e.target.value}))} />
            <input className="sm:col-span-1 rounded-lg border px-3 py-2" placeholder="Phone" value={form.phone} onChange={(e)=>setForm((s)=>({...s,phone:e.target.value}))} />
            <input className="sm:col-span-1 rounded-lg border px-3 py-2" placeholder="Email" value={form.email} onChange={(e)=>setForm((s)=>({...s,email:e.target.value}))} />
            <select className="sm:col-span-1 rounded-lg border px-3 py-2" value={form.source} onChange={(e)=>setForm((s)=>({...s,source:e.target.value}))}>
              <option value="organic">Organic</option>
              <option value="referral">Referral</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
            <input className="sm:col-span-1 rounded-lg border px-3 py-2" type="number" min="0" step="0.5" placeholder="kW" value={form.projectSizeKw} onChange={(e)=>setForm((s)=>({...s,projectSizeKw:e.target.value}))} />
            <button disabled={loading} className="sm:col-span-6 sm:col-start-1 rounded-lg bg-brand text-white px-3 py-2 hover:bg-brand-dark disabled:opacity-60">{loading?'Adding…':'Add Lead'}</button>
          </form>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paged.map((l) => (
            <div key={l.id} className="border rounded-2xl p-5 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">{l.name}</div>
                <Pill color={l.status}>{l.status}</Pill>
              </div>
              <div className="text-sm text-gray-600 mt-1">{l.email || '—'} • {l.phone || '—'}</div>
              <div className="text-xs text-gray-500">Source: {l.source} • Size: {l.projectSizeKw} kW</div>
              <div className="mt-3 flex items-center gap-2">
                <select value={l.status} onChange={(e)=>updateLead(l.id,{ status: e.target.value })} className="rounded-lg border px-2 py-1 text-sm">
                  <option value="new">New</option>
                  <option value="qualified">Qualified</option>
                  <option value="quoted">Quoted</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
                <button onClick={()=>removeLead(l.id)} className="ml-auto px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">Delete</button>
              </div>
            </div>
          ))}
          {filtered.length===0 && (
            <div className="text-sm text-gray-500">No leads yet.</div>
          )}
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


