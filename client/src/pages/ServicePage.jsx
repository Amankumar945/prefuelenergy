import { useEffect, useState } from 'react'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../utils/api.js'

export default function ServicePage() {
  const [tickets, setTickets] = useState([])
  const [form, setForm] = useState({ projectId: '', leadId: '', title: '', priority: 'low', assignedTo: '' })

  useEffect(() => {
    api.get('/api/service-tickets').then((res)=> setTickets(res.data.tickets||[]))
  }, [])

  async function addTicket(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const res = await api.post('/api/service-tickets', form)
    setTickets((prev)=>[res.data.ticket, ...prev])
    setForm({ projectId: '', leadId: '', title: '', priority: 'low', assignedTo: '' })
  }

  async function updateTicket(id, patch) {
    const res = await api.put(`/api/service-tickets/${id}`, patch)
    setTickets((prev)=> prev.map((t)=> t.id===id ? res.data.ticket : t))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand/5 to-white">
      <TopNav />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fadein">
        <div>
          <h2 className="text-lg font-semibold">Service & Maintenance</h2>
          <p className="text-sm text-gray-500">Track service tickets and resolutions</p>
        </div>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <form onSubmit={addTicket} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <input className="rounded-lg border px-3 py-2 sm:col-span-2" placeholder="Title" value={form.title} onChange={(e)=>setForm((s)=>({...s,title:e.target.value}))} />
            <select className="rounded-lg border px-3 py-2 sm:col-span-1" value={form.priority} onChange={(e)=>setForm((s)=>({...s,priority:e.target.value}))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input className="rounded-lg border px-3 py-2 sm:col-span-1" placeholder="Project ID (optional)" value={form.projectId} onChange={(e)=>setForm((s)=>({...s,projectId:e.target.value}))} />
            <input className="rounded-lg border px-3 py-2 sm:col-span-1" placeholder="Lead ID (optional)" value={form.leadId} onChange={(e)=>setForm((s)=>({...s,leadId:e.target.value}))} />
            <input className="rounded-lg border px-3 py-2 sm:col-span-1" placeholder="Assignee" value={form.assignedTo} onChange={(e)=>setForm((s)=>({...s,assignedTo:e.target.value}))} />
            <button className="rounded-lg bg-brand text-white px-3 py-2 sm:col-span-6 hover:bg-brand-dark">Add Ticket</button>
          </form>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((t)=>(
            <div key={t.id} className="border rounded-2xl p-5 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">{t.title}</div>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{t.status}</span>
              </div>
              <div className="text-sm text-gray-600">Priority: {t.priority} • {t.assignedTo||'Unassigned'}</div>
              <div className="text-xs text-gray-500">Project: {t.projectId||'—'} • Lead: {t.leadId||'—'}</div>
              <div className="mt-2 flex gap-2 text-sm">
                <select value={t.status} onChange={(e)=>updateTicket(t.id, { status: e.target.value })} className="rounded-lg border px-2 py-1">
                  <option value="open">open</option>
                  <option value="in_progress">in_progress</option>
                  <option value="resolved">resolved</option>
                </select>
              </div>
            </div>
          ))}
          {tickets.length===0 && <div className="text-sm text-gray-500">No tickets yet.</div>}
        </section>
      </div>
      <Footer />
    </div>
  )
}


