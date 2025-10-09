import { useEffect, useState } from 'react'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../utils/api.js'

function Card({ title, value, subtitle }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
    </div>
  )
}

function TrendTable({ title, data, currency }) {
  const fmt = (v) => currency ? `₹ ${Number(v||0).toLocaleString('en-IN')}` : Number(v||0).toLocaleString('en-IN')
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Date</th>
              <th className="py-2">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.date} className="border-t">
                <td className="py-1.5 text-gray-700">{row.date}</td>
                <td className="py-1.5 font-medium">{fmt(row.value)}</td>
              </tr>
            ))}
            {data.length===0 && (
              <tr><td className="py-2 text-gray-500" colSpan={2}>No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function ReportsPage() {
  const [data, setData] = useState(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    api.get('/api/reports/summary', { params: { days } }).then((res)=> setData(res.data))
  }, [days])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand/5 to-white">
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fadein">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Reports & KPIs</h2>
            <p className="text-sm text-gray-500">Real-time from live data</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-600">Range (days)</label>
            <select className="rounded-lg border px-2 py-1" value={days} onChange={(e)=> setDays(Number(e.target.value)||30)}>
              <option value={7}>7</option>
              <option value={30}>30</option>
              <option value={90}>90</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Leads (Total)" value={data ? data.summary.leads.total : '—'} subtitle={data ? `New+Imported in last ${data.days} days` : ''} />
          <Card title="Projects" value={data ? (data.summary.projects.working + data.summary.projects.not_started + data.summary.projects.completed) : '—'} subtitle={data ? `${data.summary.projects.working} working • ${data.summary.projects.completed} done` : ''} />
          <Card title="Open POs" value={data ? data.summary.purchaseOrders.open : '—'} subtitle={data ? `${data.summary.purchaseOrders.total} total` : ''} />
          <Card title="Invoices (Outstanding)" value={data ? `₹ ${Number(data.summary.invoices.outstandingAmount||0).toLocaleString('en-IN')}` : '—'} subtitle={data ? `Paid ₹ ${Number(data.summary.invoices.paidAmount||0).toLocaleString('en-IN')}` : ''} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrendTable title="Leads Created" data={data ? data.trends.leadsCreated : []} />
          <TrendTable title="Projects Created" data={data ? data.trends.projectsCreated : []} />
          <TrendTable title="Purchase Orders Created" data={data ? data.trends.purchaseOrdersCreated : []} />
          <TrendTable title="Invoice Amount (₹)" data={data ? data.trends.invoicesAmount : []} currency />
        </div>
      </div>
      <Footer />
    </div>
  )
}


