import { useEffect, useState } from 'react'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../utils/api.js'

function downloadCsv(filename, rows) {
  const escape = (v) => `"${String(v??'').replace(/"/g,'""')}"`
  const csv = rows.map((r)=> r.map(escape).join(',')).join('\n')
  // Prepend UTF-8 BOM so Excel renders ₹ and other unicode correctly
  const BOM = '\uFEFF'
  const blob = new Blob([BOM, csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

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
  const [period, setPeriod] = useState('monthly')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  useEffect(() => {
    const computedDays = period === 'weekly' ? 7 : period === 'quarterly' ? 90 : period === 'yearly' ? 365 : 30
    const params = { days: computedDays }
    if (from) params.from = from
    if (to) params.to = to
    api.get('/api/reports/summary', { params }).then((res)=> setData(res.data))
  }, [period, from, to])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand/5 to-white">
      <TopNav />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fadein">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Reports & KPIs</h2>
            <p className="text-sm text-gray-500">Real-time from live data {data ? `• ${data.period.from} → ${data.period.to}` : ''}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-600">From</label>
            <input type="date" className="rounded-lg border px-2 py-1" value={from} onChange={(e)=> setFrom(e.target.value)} />
            <label className="text-gray-600">To</label>
            <input type="date" className="rounded-lg border px-2 py-1" value={to} onChange={(e)=> setTo(e.target.value)} />
            <label className="text-gray-600">Period</label>
            <select className="rounded-lg border px-2 py-1" value={period} onChange={(e)=> setPeriod(e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            <button onClick={()=>{
              const rows = []
              rows.push(["Period", data?.period?.from||'', data?.period?.to||''])
              rows.push([])
              rows.push(["Leads Total", data?.summary?.leads?.total||0])
              rows.push(["Projects", (data?.summary?.projects?.working||0)+(data?.summary?.projects?.not_started||0)+(data?.summary?.projects?.completed||0)])
              rows.push(["PO Open", data?.summary?.purchaseOrders?.open||0])
              rows.push(["PO Total", data?.summary?.purchaseOrders?.total||0])
              rows.push(["On-time GRN %", data?.summary?.purchaseOrders?.onTimeGrnRate??''])
              rows.push(["Invoices Total ₹", data?.summary?.invoices?.totalAmount||0])
              rows.push(["Invoices Paid ₹", data?.summary?.invoices?.paidAmount||0])
              rows.push(["Invoices Outstanding ₹", data?.summary?.invoices?.outstandingAmount||0])
              rows.push([])
              rows.push(["Aging Bucket","Amount ₹"]) 
              const a = data?.summary?.aging||{}
              rows.push(["0-30", a['0-30']||0])
              rows.push(["31-60", a['31-60']||0])
              rows.push(["61-90", a['61-90']||0])
              rows.push(["90+", a['90+']||0])
              rows.push([])
              rows.push(["Lead Conversion by Source/Channel"]) 
              rows.push(["Source","Channel","Total","Won","Rate%"])
              ;(data?.summary?.leads?.conversionBySource||[]).forEach(r=> rows.push([r.source,r.channel,r.total,r.won,r.rate]))
              downloadCsv(`report_${data?.period?.from||''}_${data?.period?.to||''}.csv`, rows)
            }} className="ml-2 rounded-lg border px-3 py-1.5 hover:bg-gray-50">Export Report CSV</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Leads (Total)" value={data ? data.summary.leads.total : '—'} subtitle={data ? `New+Imported in last ${data.days} days` : ''} />
          <Card title="Projects" value={data ? (data.summary.projects.working + data.summary.projects.not_started + data.summary.projects.completed) : '—'} subtitle={data ? `${data.summary.projects.working} working • ${data.summary.projects.completed} done` : ''} />
          <Card title="Open POs" value={data ? data.summary.purchaseOrders.open : '—'} subtitle={data ? `${data.summary.purchaseOrders.total} total • On-time GRN ${data.summary.purchaseOrders.onTimeGrnRate??'—'}%` : ''} />
          <Card title="Invoices (Outstanding)" value={data ? `₹ ${Number(data.summary.invoices.outstandingAmount||0).toLocaleString('en-IN')}` : '—'} subtitle={data ? `Paid ₹ ${Number(data.summary.invoices.paidAmount||0).toLocaleString('en-IN')}` : ''} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrendTable title="Leads Created" data={data ? data.trends.leadsCreated : []} />
          <TrendTable title="Projects Created" data={data ? data.trends.projectsCreated : []} />
          <TrendTable title="Purchase Orders Created" data={data ? data.trends.purchaseOrdersCreated : []} />
          <TrendTable title="Invoice Amount (₹)" data={data ? data.trends.invoicesAmount : []} currency />
        </div>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">Lead Conversion by Source/Channel</h3>
            <button onClick={()=>{
              const computedDays = period === 'weekly' ? 7 : period === 'quarterly' ? 90 : 30
              const rows = [["Source","Channel","Total","Won","Rate%"], ...(data?.summary?.leads?.conversionBySource||[]).map(r=>[r.source,r.channel,r.total,r.won,r.rate])]
              downloadCsv(`lead_conversion_${computedDays}d.csv`, rows)
            }} className="text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50">Export CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">Source</th>
                  <th className="py-2">Channel</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Won</th>
                  <th className="py-2">Rate</th>
                </tr>
              </thead>
              <tbody>
                {data?.summary?.leads?.conversionBySource?.map((r, idx)=>(
                  <tr key={idx} className="border-t">
                    <td className="py-1.5">{r.source}</td>
                    <td className="py-1.5">{r.channel}</td>
                    <td className="py-1.5">{r.total}</td>
                    <td className="py-1.5">{r.won}</td>
                    <td className="py-1.5">{r.rate}%</td>
                  </tr>
                ))}
                {(!data?.summary?.leads?.conversionBySource || data.summary.leads.conversionBySource.length===0) && (
                  <tr><td className="py-2 text-gray-500" colSpan={5}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">Invoices Outstanding Aging</h3>
            <button onClick={()=>{
              const computedDays = period === 'weekly' ? 7 : period === 'quarterly' ? 90 : 30
              const a = data?.summary?.aging || {}
              const rows = [["Bucket","Amount"],["0-30", a['0-30']||0],["31-60", a['31-60']||0],["61-90", a['61-90']||0],["90+", a['90+']||0]]
              downloadCsv(`aging_${computedDays}d.csv`, rows)
            }} className="text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50">Export CSV</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-700">
            <div className="p-3 rounded-lg border bg-gray-50">0–30: <b>{data ? `₹ ${Number(data.summary.aging['0-30']||0).toLocaleString('en-IN')}` : '—'}</b></div>
            <div className="p-3 rounded-lg border bg-gray-50">31–60: <b>{data ? `₹ ${Number(data.summary.aging['31-60']||0).toLocaleString('en-IN')}` : '—'}</b></div>
            <div className="p-3 rounded-lg border bg-gray-50">61–90: <b>{data ? `₹ ${Number(data.summary.aging['61-90']||0).toLocaleString('en-IN')}` : '—'}</b></div>
            <div className="p-3 rounded-lg border bg-gray-50">90+: <b>{data ? `₹ ${Number(data.summary.aging['90+']||0).toLocaleString('en-IN')}` : '—'}</b></div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  )
}


