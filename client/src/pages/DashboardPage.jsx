import { useEffect, useState } from 'react'
import { api } from '../utils/api.js'
import { Link, useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import { useMemo } from 'react'
import { subscribeToLive } from '../utils/live.js'

function StatCard({ title, value, subtitle, accent }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 flex items-end gap-2">
        <div className={`text-2xl font-semibold ${accent}`}>{value}</div>
        {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  function fetchStats() {
    api.get('/api/stats')
      .then((res) => setStats(res.data))
      .catch(() => setStats({ error: true }))
  }
  useEffect(() => { fetchStats() }, [])
  useEffect(() => {
    const unsub = subscribeToLive(undefined, (evt)=>{
      if (['lead','quote','project','item','purchaseOrder','invoice','announcement'].includes(evt?.entity)) {
        fetchStats()
      }
    })
    return unsub
  }, [])
  const [ann, setAnn] = useState([])
  useEffect(() => {
    api.get('/api/announcements').then((res)=> setAnn(res.data.announcements||[]))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand/5 to-white">
      <TopNav />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fadein">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold">Solar Rooftop — Overview</h2>
          <p className="text-sm text-gray-500 mt-1">India Government scheme for home installations. Track leads, callers, conversions, and projects.</p>
          <div className="mt-3">
            <button onClick={fetchStats} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50">Refresh</button>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Leads progress</div>
              <ProgressBar percent={stats ? Math.round((stats.leads.organic / (stats.leads.total||1)) * 100) : 0} />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Tele callers active</div>
              <ProgressBar percent={stats ? Math.round((stats.teleCallers.active / (stats.teleCallers.total||1)) * 100) : 0} color="bg-sky-500" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Conversions share (Organic)</div>
              <ProgressBar percent={stats ? Math.round((stats.conversions.bySource.organic / (stats.conversions.total||1)) * 100) : 0} color="bg-violet-500" />
            </div>
          </div>
        </div>

        {/* Highlight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Leads (Total)"
            value={stats ? stats.leads.total : '—'}
            subtitle={stats ? `Organic ${stats.leads.organic} / Inorganic ${stats.leads.inorganic}` : ''}
            accent="text-emerald-600"
          />
          <StatCard
            title="Tele Callers"
            value={stats ? stats.teleCallers.total : '—'}
            subtitle={stats ? `${stats.teleCallers.active} active / ${stats.teleCallers.available} available` : ''}
            accent="text-sky-600"
          />
          <StatCard
            title="Conversions"
            value={stats ? stats.conversions.total : '—'}
            subtitle={stats ? `Org ${stats.conversions.bySource.organic} / Inorg ${stats.conversions.bySource.inorganic}` : ''}
            accent="text-violet-600"
          />
          <StatCard
            title="Pipeline"
            value={stats ? stats.pipeline?.total : '—'}
            subtitle={stats ? `New ${stats.pipeline?.new||0} • Qualified ${stats.pipeline?.qualified||0}` : ''}
            accent="text-amber-600"
          />
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Projects</div>
              <div className="text-xs text-gray-400">Working • Completed • Not Started</div>
            </div>
            <Link to="/projects" className="px-3 py-1.5 rounded-lg bg-brand text-white text-sm hover:bg-brand-dark">
              View
            </Link>
          </div>
        </div>

        {/* Projects section preview */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Projects Snapshot</h3>
            <Link to="/projects" className="px-3 py-1.5 rounded-lg bg-brand text-white text-sm hover:bg-brand-dark">Open Projects</Link>
          </div>
          <p className="text-sm text-gray-500 mt-1">Track installation progress, dates and installer details.</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-brand/10 border border-brand/20">
              <div className="text-xs text-gray-600">Working now</div>
              <div className="text-xl font-semibold text-brand">{stats ? stats.projects?.working : '—'} Live</div>
            </div>
            <div className="p-4 rounded-xl bg-solar-yellow/10 border border-solar-yellow/30">
              <div className="text-xs text-gray-600">Next up</div>
              <div className="text-xl font-semibold text-amber-600">{stats ? stats.projects?.not_started : '—'} Upcoming</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-600">Completed</div>
              <div className="text-xl font-semibold text-gray-800">{stats ? stats.projects?.completed : '—'} Handover</div>
            </div>
          </div>
        </section>
        {/* Announcements */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Announcements</h3>
            <Link to="/announcements" className="text-sm text-brand">View all</Link>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {ann.slice(0,2).map((a)=>(
              <div key={a.id} className="p-4 rounded-xl border bg-gray-50">
                <div className="flex items-center justify-between"><div className="font-medium">{a.title}</div><span className="text-xs bg-white border px-2 py-0.5 rounded">{a.audience}</span></div>
                <div className="text-sm text-gray-600 mt-1 line-clamp-2">{a.body}</div>
                <div className="text-xs text-gray-500 mt-1">{a.startsAt||'Now'} → {a.endsAt||'Open'}</div>
              </div>
            ))}
            {ann.length===0 && <div className="text-sm text-gray-500">No announcements</div>}
          </div>
        </section>
        {/* Scheme note */}
        <div className="text-xs text-gray-500">Data shown is demo and follows typical steps: Site Survey → Design & BOM → Installation → Net Metering.</div>
      </main>
      <Footer />
    </div>
  )
}


