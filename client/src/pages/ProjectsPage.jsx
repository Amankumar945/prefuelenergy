import { useEffect, useMemo, useState } from 'react'
import { api } from '../utils/api.js'
import { Link } from 'react-router-dom'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'

function Section({ title, children }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="mb-3">
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function StepPill({ step }) {
  const map = {
    done: 'bg-green-100 text-green-700 border-green-200',
    in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
    pending: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  return (
    <span className={`text-[10px] px-2 py-1 rounded-full border ${map[step.status]}`}>{step.name}</span>
  )
}

function ProjectCard({ project }) {
  return (
    <div className="border rounded-2xl p-5 flex flex-col gap-3 bg-white">
      <div className="flex items-center justify-between">
        <div className="font-medium">{project.customerName}</div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{project.status}</span>
      </div>
      <div className="text-sm text-gray-600">{project.siteAddress}</div>
      <div className="text-xs text-gray-500">{project.scheme}</div>
      <div className="text-sm">Capacity: <span className="font-medium">{project.capacityKw} kW</span></div>
      <div className="text-xs text-gray-500">Scheduled: {project.installation.scheduledDate} • Installer: {project.installation.installerName}</div>
      <div className="flex flex-wrap gap-2">
        {project.installation?.steps?.map((s, i) => <StepPill key={i} step={s} />)}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer select-none text-brand">Installation details</summary>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="font-medium text-gray-700">Installed</div>
            <ul className="list-disc ml-5 text-gray-600">
              {project.installation.installedItems.length === 0 && <li>None</li>}
              {project.installation.installedItems.map((it, idx) => (
                <li key={idx}>{it.item}: {it.qty} {it.unit}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-medium text-gray-700">Pending</div>
            <ul className="list-disc ml-5 text-gray-600">
              {project.installation.pendingItems.length === 0 && <li>None</li>}
              {project.installation.pendingItems.map((it, idx) => (
                <li key={idx}>{it.item}: {it.qty} {it.unit}</li>
              ))}
            </ul>
          </div>
        </div>
      </details>
      <Link to={`/projects/${project.id}`} className="text-sm text-brand">Open details</Link>
    </div>
  )
}

export default function ProjectsPage() {
  const [data, setData] = useState([])

  useEffect(() => {
    api.get('/api/projects')
      .then((res) => setData(res.data.projects || []))
  }, [])

  const groups = useMemo(() => ({
    working: data.filter((p) => p.status === 'working'),
    completed: data.filter((p) => p.status === 'completed'),
    not_started: data.filter((p) => p.status === 'not_started'),
  }), [data])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand/5 to-white">
      <TopNav />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fadein">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Projects</h2>
            <p className="text-sm text-gray-500">Solar scheme — grouped by status</p>
          </div>
          <Link to="/" className="text-sm text-brand">Back to Dashboard</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Section title="Working Projects">
            <div className="space-y-3">
              {groups.working.map((p) => <ProjectCard key={p.id} project={p} />)}
              {groups.working.length === 0 && <div className="text-sm text-gray-500">No working projects</div>}
            </div>
          </Section>

          <Section title="Completed Projects">
            <div className="space-y-3">
              {groups.completed.map((p) => <ProjectCard key={p.id} project={p} />)}
              {groups.completed.length === 0 && <div className="text-sm text-gray-500">No completed projects</div>}
            </div>
          </Section>

          <Section title="Not Started">
            <div className="space-y-3">
              {groups.not_started.map((p) => <ProjectCard key={p.id} project={p} />)}
              {groups.not_started.length === 0 && <div className="text-sm text-gray-500">No pending projects</div>}
            </div>
          </Section>
        </div>
      </div>
      <Footer />
    </div>
  )
}


