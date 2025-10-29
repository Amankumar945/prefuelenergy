import { useState } from 'react'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../utils/api.js'

export default function AdminProfilePage() {
  const user = JSON.parse(localStorage.getItem('user')||'{}')
  const [openConfirm, setOpenConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function resetAll() {
    setBusy(true)
    setMessage('')
    try {
      await api.post('/api/admin/reset-data')
      setMessage('All data deleted. Reloading...')
      setTimeout(()=> { try { window.location.reload() } catch (_) {} }, 800)
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to delete data')
    } finally {
      setBusy(false)
      setOpenConfirm(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand/5 to-white">
      <TopNav />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fadein">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold">Admin Profile</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your account and system-level settings.</p>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
          <div className="font-medium">Account</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg border bg-gray-50">
              <div className="text-gray-500">Name</div>
              <div className="font-medium">{user?.name||'—'}</div>
            </div>
            <div className="p-3 rounded-lg border bg-gray-50">
              <div className="text-gray-500">Role</div>
              <div className="font-medium uppercase">{user?.role||'—'}</div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
          <div className="font-medium text-red-700">Danger Zone</div>
          <p className="text-sm text-gray-600">Delete ALL data from this system: leads, quotes, projects, items, purchase orders, invoices, documents, tasks, attendance, announcements, service tickets and audit logs. This action cannot be undone.</p>
          <button onClick={()=> setOpenConfirm(true)} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm w-full sm:w-auto">Delete All Data</button>
          {message && <div className="text-sm text-gray-700">{message}</div>}
        </section>
      </div>
      <Footer />

      <Modal open={openConfirm} title="Delete all data?" onClose={()=> setOpenConfirm(false)} onPrimary={resetAll} primaryText={busy? 'Deleting…' : 'Yes, delete all'}>
        <div className="text-sm text-gray-700">
          This will remove every entry and reset the system to an empty state.
          Are you sure you want to continue?
        </div>
      </Modal>
    </div>
  )
}


