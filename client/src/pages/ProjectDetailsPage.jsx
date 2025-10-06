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
  const [docs, setDocs] = useState([])
  const [tasks, setTasks] = useState([])
  const [taskForm, setTaskForm] = useState({ title: '', assignee: '', dueDate: '' })
  const [acquisition, setAcquisition] = useState({ sourceType: '', sourceChannel: '', agent: { id: '', name: '', phone: '' } })
  const [followUp, setFollowUp] = useState({ ownerRole: '', person: { id: '', name: '', phone: '' }, lastContacted: '' })

  useEffect(() => {
    api.get(`/api/projects/${id}`).then((res)=>{
      setData(res.data)
      setSteps(res.data.installation?.steps||[])
      setInstallerName(res.data.installation?.installerName||'')
      setScheduledDate(res.data.installation?.scheduledDate||'')
      setAcquisition(res.data.acquisition || { sourceType: '', sourceChannel: '', agent: { id: '', name: '', phone: '' } })
      setFollowUp(res.data.followUp || { ownerRole: '', person: { id: '', name: '', phone: '' }, lastContacted: '' })
    })
    api.get('/api/tasks', { params: { projectId: id }}).then((res)=> setTasks(res.data.tasks||[]))
    api.get('/api/documents', { params: { entityType: 'project', entityId: id }}).then((res)=> setDocs(res.data.documents||[]))
  }, [id])

  async function saveMilestones() {
    const res = await api.post(`/api/projects/${id}/milestones`, { steps, installerName, scheduledDate })
    setData(res.data.project)
  }

  async function saveAttribution() {
    const res = await api.post(`/api/projects/${id}/milestones`, { acquisition, followUp })
    setData(res.data.project)
  }

  async function attachDoc() {
    if (!docUrl.trim()) return
    await api.post('/api/documents', { entityType: 'project', entityId: id, url: docUrl, title: 'Attachment' })
    setDocUrl('')
    const list = await api.get('/api/documents', { params: { entityType: 'project', entityId: id }})
    setDocs(list.data.documents||[])
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
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fadein">
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
            <div className="flex items-center justify-between">
              <button type="button" onClick={()=> setSteps((prev)=> [...prev, { name: 'Step', status: 'pending', date: '' }])} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">+ Add step</button>
              <button type="button" onClick={()=> setSteps((prev)=> prev.length ? prev.slice(0, prev.length-1) : prev)} disabled={!steps.length} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">Delete step</button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Source & Follow-up</div>
            <button onClick={saveAttribution} className="rounded-lg bg-brand text-white px-3 py-2 hover:bg-brand-dark text-sm">Save</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Acquisition</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select className="rounded-lg border px-3 py-2 sm:col-span-1" value={acquisition.sourceType||''} onChange={(e)=>setAcquisition((s)=>({...s, sourceType: e.target.value}))}>
                  <option value="">Source type</option>
                  <option value="telecaller">Telecaller</option>
                  <option value="site_agent">Site Agent</option>
                  <option value="survey">Survey</option>
                  <option value="organic">Organic</option>
                  <option value="inorganic">Inorganic</option>
                  <option value="digital_ads">Digital Ads</option>
                  <option value="referral">Referral</option>
                </select>
                <input className="rounded-lg border px-3 py-2 sm:col-span-2" placeholder="Channel (e.g., Website, Meta Ads)" value={acquisition.sourceChannel||''} onChange={(e)=>setAcquisition((s)=>({...s, sourceChannel: e.target.value}))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input className="rounded-lg border px-3 py-2" placeholder="Agent ID" value={acquisition.agent?.id||''} onChange={(e)=>setAcquisition((s)=>({...s, agent: { ...(s.agent||{}), id: e.target.value }}))} />
                <input className="rounded-lg border px-3 py-2" placeholder="Agent Name" value={acquisition.agent?.name||''} onChange={(e)=>setAcquisition((s)=>({...s, agent: { ...(s.agent||{}), name: e.target.value }}))} />
                <input className="rounded-lg border px-3 py-2" placeholder="Agent Phone" value={acquisition.agent?.phone||''} onChange={(e)=>setAcquisition((s)=>({...s, agent: { ...(s.agent||{}), phone: e.target.value }}))} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Follow-up</div>
              {(acquisition.agent?.id || acquisition.agent?.name) && (
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input type="checkbox" onChange={(e)=>{
                    if (e.target.checked) {
                      setFollowUp((s)=>({ ...s, ownerRole: acquisition.sourceType==='telecaller'?'telecaller':s.ownerRole, person: { id: acquisition.agent?.id||'', name: acquisition.agent?.name||'', phone: acquisition.agent?.phone||'' } }))
                    }
                  }} /> Same as acquisition agent
                </label>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select className="rounded-lg border px-3 py-2" value={followUp.ownerRole||''} onChange={(e)=>setFollowUp((s)=>({...s, ownerRole: e.target.value}))}>
                  <option value="">Owner role</option>
                  <option value="telecaller">Telecaller</option>
                  <option value="site_agent">Site Agent</option>
                  <option value="sales">Sales</option>
                </select>
                <input className="rounded-lg border px-3 py-2" placeholder="Person Name" value={followUp.person?.name||''} onChange={(e)=>setFollowUp((s)=>({...s, person: { ...(s.person||{}), name: e.target.value }}))} />
                <input className="rounded-lg border px-3 py-2" placeholder="Person Phone" value={followUp.person?.phone||''} onChange={(e)=>setFollowUp((s)=>({...s, person: { ...(s.person||{}), phone: e.target.value }}))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input className="rounded-lg border px-3 py-2" placeholder="Person ID" value={followUp.person?.id||''} onChange={(e)=>setFollowUp((s)=>({...s, person: { ...(s.person||{}), id: e.target.value }}))} />
                <input className="rounded-lg border px-3 py-2 sm:col-span-2" type="date" value={followUp.lastContacted||''} onChange={(e)=>setFollowUp((s)=>({...s, lastContacted: e.target.value}))} />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
          <div className="font-medium">Attachments</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input className="rounded-lg border px-3 py-2 sm:col-span-3" placeholder="https://... (doc/image URL)" value={docUrl} onChange={(e)=>setDocUrl(e.target.value)} />
            <button onClick={attachDoc} className="rounded-lg bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-700">Attach</button>
          </div>
          <div className="text-xs text-gray-500">Note: URLs are stored demo-only.</div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {docs.map((d)=> (
              <a key={d.id} href={d.url} target="_blank" rel="noreferrer" className="p-3 rounded-lg border hover:bg-gray-50 truncate">{d.title||'Attachment'} — {d.url}</a>
            ))}
            {docs.length===0 && <div className="text-sm text-gray-500">No attachments yet.</div>}
          </div>
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


