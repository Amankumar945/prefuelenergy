import { useEffect, useMemo, useState } from 'react'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../utils/api.js'

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow transition-shadow">
      <div className="text-sm text-gray-500 mb-2">{title}</div>
      {children}
    </div>
  )
}

export default function HRDashboardPage() {
  const [employees, setEmployees] = useState([
    { id: 'e1', name: 'Ravi Kumar', dept: 'Field', status: 'active' },
    { id: 'e2', name: 'Priya Sharma', dept: 'Ops', status: 'active' },
    { id: 'e3', name: 'Aarav Mehta', dept: 'Tech', status: 'leave' },
  ])
  const [attendance, setAttendance] = useState({ date: '', present: 0, absent: 0 })
  const [leaves, setLeaves] = useState([
    { id: 'l1', name: 'Ravi Kumar', days: 1, date: '2025-10-03', status: 'pending' },
    { id: 'l2', name: 'Priya Sharma', days: 2, date: '2025-10-04', status: 'pending' },
  ])

  // Modals state
  const [openAdd, setOpenAdd] = useState(false)
  const [openAtt, setOpenAtt] = useState(false)
  const [openLeaves, setOpenLeaves] = useState(false)

  // Add Employee form
  const [newEmp, setNewEmp] = useState({ name: '', dept: 'Field' })
  function addEmployee() {
    if (!newEmp.name.trim()) return
    const e = { id: `e${Date.now()}`, name: newEmp.name.trim(), dept: newEmp.dept, status: 'active' }
    setEmployees((prev) => [e, ...prev])
    setNewEmp({ name: '', dept: 'Field' })
    setOpenAdd(false)
  }

  // Attendance form
  const [attForm, setAttForm] = useState({ date: '', present: 0, absent: 0 })
  async function saveAttendance() {
    const res = await api.post('/api/attendance', attForm)
    setAttendance(res.data.attendance)
    setOpenAtt(false)
  }

  // Approve Leave actions
  function approveLeave(id) {
    setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'approved' } : l)))
  }
  function rejectLeave(id) {
    setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'rejected' } : l)))
  }

  const summary = useMemo(() => {
    const total = employees.length
    const onLeave = employees.filter((e) => e.status === 'leave').length
    const active = total - onLeave
    return { total, active, onLeave }
  }, [employees])

  useEffect(() => {
    api.get('/api/attendance').then((res)=> setAttendance(res.data.attendance||{ date: '', present: 0, absent: 0 }))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand/5 to-white">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fadein">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold">HR Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Manage employees, attendance, leaves, and recruitment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card title="Quick Actions">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setOpenAdd(true)} className="px-3 py-2 rounded-lg bg-brand text-white hover:bg-brand-dark text-sm shadow-sm">Add Employee</button>
              <button onClick={() => setOpenAtt(true)} className="px-3 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 text-sm shadow-sm">Mark Attendance</button>
              <button onClick={() => setOpenLeaves(true)} className="px-3 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 text-sm shadow-sm">Approve Leave</button>
            </div>
          </Card>

          <Card title="Employees (Summary)">
            <div className="text-sm text-gray-700">Total: {summary.total} • Active: {summary.active} • On Leave: {summary.onLeave}</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-600">
              <div className="p-3 rounded-lg bg-gray-50 border">Field</div>
              <div className="p-3 rounded-lg bg-gray-50 border">Tech</div>
              <div className="p-3 rounded-lg bg-gray-50 border">Ops</div>
            </div>
          </Card>

          <Card title="Attendance">
            <div className="text-sm text-gray-700">{attendance.date ? `On ${attendance.date}: Present ${attendance.present} • Absent ${attendance.absent}` : 'No attendance marked yet.'}</div>
            <div className="mt-3 text-xs text-gray-500">Simple placeholder for attendance heatmap/chart.</div>
          </Card>

          <Card title="Leaves">
            <div className="text-sm text-gray-700">Pending approvals: {leaves.filter(l=>l.status==='pending').length}</div>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              {leaves.map((l) => (
                <div key={l.id} className="p-3 rounded-lg bg-gray-50 border flex items-center justify-between">
                  <div>
                    {l.name} • {l.days} {l.days>1?'days':'day'} • {l.date}
                    <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full border ${l.status==='pending'?'bg-amber-50 text-amber-700 border-amber-200': l.status==='approved'?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>{l.status}</span>
                  </div>
                  {l.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => approveLeave(l.id)} className="px-2 py-1 rounded-lg text-xs bg-green-600 text-white hover:bg-green-700">Approve</button>
                      <button onClick={() => rejectLeave(l.id)} className="px-2 py-1 rounded-lg text-xs bg-red-600 text-white hover:bg-red-700">Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Recruitment">
            <div className="text-sm text-gray-700">Open roles: 2 • Candidates in pipeline: 12</div>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <div className="p-3 rounded-lg bg-gray-50 border">Telecaller • 3 candidates</div>
              <div className="p-3 rounded-lg bg-gray-50 border">Solar Installer • 9 candidates</div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />

      {/* Add Employee Modal */}
      <Modal open={openAdd} title="Add Employee" onClose={() => setOpenAdd(false)} onPrimary={addEmployee} primaryText="Add">
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600">Full name</label>
            <input value={newEmp.name} onChange={(e)=>setNewEmp((s)=>({...s,name:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="e.g., Neha Verma" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Department</label>
            <select value={newEmp.dept} onChange={(e)=>setNewEmp((s)=>({...s,dept:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2">
              <option>Field</option>
              <option>Tech</option>
              <option>Ops</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Mark Attendance Modal */}
      <Modal open={openAtt} title="Mark Attendance" onClose={() => setOpenAtt(false)} onPrimary={saveAttendance} primaryText="Save">
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600">Date</label>
            <input type="date" value={attForm.date} onChange={(e)=>setAttForm((s)=>({...s,date:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600">Present</label>
              <input type="number" min="0" value={attForm.present} onChange={(e)=>setAttForm((s)=>({...s,present:Number(e.target.value)||0}))} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Absent</label>
              <input type="number" min="0" value={attForm.absent} onChange={(e)=>setAttForm((s)=>({...s,absent:Number(e.target.value)||0}))} className="mt-1 w-full rounded-lg border px-3 py-2" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Approve Leave Modal */}
      <Modal open={openLeaves} title="Approve Leaves" onClose={() => setOpenLeaves(false)} onPrimary={() => setOpenLeaves(false)} primaryText="Close">
        <div className="space-y-2 text-sm">
          {leaves.map((l) => (
            <div key={l.id} className="p-3 rounded-lg bg-gray-50 border flex items-center justify-between">
              <div>
                {l.name} • {l.days} {l.days>1?'days':'day'} • {l.date}
                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full border ${l.status==='pending'?'bg-amber-50 text-amber-700 border-amber-200': l.status==='approved'?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-700 border-red-200'}`}>{l.status}</span>
              </div>
              {l.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => approveLeave(l.id)} className="px-2 py-1 rounded-lg text-xs bg-green-600 text-white hover:bg-green-700">Approve</button>
                  <button onClick={() => rejectLeave(l.id)} className="px-2 py-1 rounded-lg text-xs bg-red-600 text-white hover:bg-red-700">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}


