import { useEffect, useState } from 'react'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../utils/api.js'

export default function AnnouncementsPage() {
  const user = JSON.parse(localStorage.getItem('user')||'{}')
  const isAdmin = user?.role === 'admin'
  const [list, setList] = useState([])
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', startsAt: '', endsAt: '', active: true })

  useEffect(() => {
    api.get('/api/announcements').then((res)=> setList(res.data.announcements||[]))
  }, [])

  async function createAnnouncement(e) {
    e.preventDefault()
    if (!isAdmin) return
    if (!form.title.trim() || !form.body.trim()) return
    const res = await api.post('/api/announcements', form)
    setList((prev)=> [res.data.announcement, ...prev])
    setForm({ title: '', body: '', audience: 'all', startsAt: '', endsAt: '', active: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand/5 to-white">
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fadein">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Announcements</h2>
            <p className="text-sm text-gray-500">Company-wide updates and incentives</p>
          </div>
        </div>

        {isAdmin && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <form onSubmit={createAnnouncement} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <input className="rounded-lg border px-3 py-2 sm:col-span-2" placeholder="Title" value={form.title} onChange={(e)=>setForm((s)=>({...s,title:e.target.value}))} />
              <select className="rounded-lg border px-3 py-2 sm:col-span-1" value={form.audience} onChange={(e)=>setForm((s)=>({...s,audience:e.target.value}))}>
                <option value="all">All</option>
                <option value="staff">Staff</option>
                <option value="hr">HR</option>
                <option value="sales">Sales</option>
              </select>
              <input className="rounded-lg border px-3 py-2 sm:col-span-1" type="date" value={form.startsAt} onChange={(e)=>setForm((s)=>({...s,startsAt:e.target.value}))} />
              <input className="rounded-lg border px-3 py-2 sm:col-span-1" type="date" value={form.endsAt} onChange={(e)=>setForm((s)=>({...s,endsAt:e.target.value}))} />
              <label className="flex items-center gap-2 text-sm sm:col-span-1"><input type="checkbox" checked={form.active} onChange={(e)=>setForm((s)=>({...s,active:e.target.checked}))} />Active</label>
              <textarea className="rounded-lg border px-3 py-2 sm:col-span-6" rows={3} placeholder="Message..." value={form.body} onChange={(e)=>setForm((s)=>({...s,body:e.target.value}))} />
              <button className="rounded-lg bg-brand text-white px-3 py-2 sm:col-span-6 hover:bg-brand-dark">Publish</button>
            </form>
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((a)=> (
            <div key={a.id} className="border rounded-2xl p-5 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">{a.title}</div>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{a.audience}</span>
              </div>
              <div className="text-sm text-gray-600 whitespace-pre-line mt-1">{a.body}</div>
              <div className="text-xs text-gray-500 mt-2">{a.startsAt||'Now'} → {a.endsAt||'Open'} • {a.active?'Active':'Inactive'}</div>
            </div>
          ))}
          {list.length===0 && <div className="text-sm text-gray-500">No announcements</div>}
        </section>
      </div>
      <Footer />
    </div>
  )
}


