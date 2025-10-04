import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../utils/api.js'

function StepRow({ step, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
      <input className="rounded-lg border px-3 py-2 sm:col-span-2" value={step.name} onChange={(e)=>onChange({ name: e.target.value })} />
      <select className="rounded-lg border px-3 py-2" value={step.status} onChange={(e)=>onChange({ status: e.target.value })}>
        <option value="pending">pending</option>
        <option value="in_progress">in_progress</option>
        <option value="done">done</option>
      </select>
      <input className="rounded-lg border px-3 py-2" placeholder="YYYY-MM-DD" value={step.date||''} onChange={(e)=>onChange({ date: e.target.value })} />
    </div>
  )
}

export default function ProjectDetailsPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [steps, setSteps] = useState([])
  const [installerName, setInstallerName] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [tasks, setTasks] = useState([])
  const [taskForm, setTaskForm] = useState({ title: '', assignee: '', dueDate: '' })

  useEffect(() => {
    api.get(`/api/projects/${id}`).then((res)=>{
      setData(res.data)
      setSteps(res.data.installation?.steps||[])
      setInstallerName(res.data.installation?.installerName||'')
      setScheduledDate(res.data.installation?.scheduledDate||'')
    })
    api.get('/api/tasks', { params: { projectId: id }}).then((res)=> setTasks(res.data.tasks||[]))
  }, [id])

  async function saveMilestones() {
    const res = await api.post(`/api/projects/${id}/milestones`, { steps, installerName, scheduledDate })
    setData(res.data.project)
  }

  async function attachDoc() {
    if (!docUrl.trim()) return
    await api.post('/api/documents', { entityType: 'project', entityId: id, url: docUrl, title: 'Attachment' })
    setDocUrl('')
  }

  async function addTask(e) {
    e.preventDefault()
    if (!taskForm.title.trim()) return
    const res = await api.post('/api/tasks', { projectId: id, ...taskForm })
    setTasks((prev)=>[res.data.task, ...prev])
    setTaskForm({ title: '', assignee: '', dueDate: '' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand/5 to-white">
      <TopNav />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fadein">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Project Details</h2>
            <p className="text-sm text-gray-500">{data?.customerName} • {data?.capacityKw} kW • {data?.status}</p>
          </div>
          <Link to="/projects" className="text-sm text-brand">Back</Link>
        </div>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input className="rounded-lg border px-3 py-2" value={installerName} onChange={(e)=>setInstallerName(e.target.value)} placeholder="Installer name" />
            <input className="rounded-lg border px-3 py-2" value={scheduledDate} onChange={(e)=>setScheduledDate(e.target.value)} placeholder="Scheduled date" />
            <button onClick={saveMilestones} className="rounded-lg bg-brand text-white px-3 py-2 hover:bg-brand-dark">Save</button>
          </div>
          <div className="space-y-2">
            {steps.map((s, idx)=> (
              <StepRow key={idx} step={s} onChange={(patch)=> setSteps((prev)=> prev.map((x,i)=> i===idx? { ...x, ...patch }: x))} />
            ))}
            <button type="button" onClick={()=> setSteps((prev)=> [...prev, { name: 'Step', status: 'pending', date: '' }])} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">+ Add step</button>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
          <div className="font-medium">Attachments</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input className="rounded-lg border px-3 py-2 sm:col-span-3" placeholder="https://... (doc/image URL)" value={docUrl} onChange={(e)=>setDocUrl(e.target.value)} />
            <button onClick={attachDoc} className="rounded-lg bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-700">Attach</button>
          </div>
          <div className="text-xs text-gray-500">Note: URLs are stored demo-only.</div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
          <div className="font-medium">Tasks</div>
          <form onSubmit={addTask} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            <input className="rounded-lg border px-3 py-2 sm:col-span-2" placeholder="Title" value={taskForm.title} onChange={(e)=>setTaskForm((s)=>({...s,title:e.target.value}))} />
            <input className="rounded-lg border px-3 py-2 sm:col-span-1" placeholder="Assignee" value={taskForm.assignee} onChange={(e)=>setTaskForm((s)=>({...s,assignee:e.target.value}))} />
            <input className="rounded-lg border px-3 py-2 sm:col-span-1" placeholder="Due YYYY-MM-DD" value={taskForm.dueDate} onChange={(e)=>setTaskForm((s)=>({...s,dueDate:e.target.value}))} />
            <button className="rounded-lg bg-brand text-white px-3 py-2 sm:col-span-1 hover:bg-brand-dark">Add</button>
          </form>
          <div className="space-y-2 text-sm">
            {tasks.map((t)=> (
              <div key={t.id} className="p-3 rounded-lg border bg-gray-50 flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-gray-500">{t.assignee||'Unassigned'} • {t.dueDate||'No due'}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-white border">{t.status}</span>
              </div>
            ))}
            {tasks.length===0 && <div className="text-sm text-gray-500">No tasks yet.</div>}
          </div>
        </section>

      </div>
      <Footer />
    </div>
  )
}


