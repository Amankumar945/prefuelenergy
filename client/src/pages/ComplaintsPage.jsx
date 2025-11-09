import { useEffect, useMemo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import TopNav from '../components/TopNav.jsx'
import Footer from '../components/Footer.jsx'
import Modal from '../components/Modal.jsx'
import { api } from '../utils/api.js'
import { subscribeToLive } from '../utils/live.js'

function showToast(message, type = 'success') {
  const toastArea = document.getElementById('toast-area')
  if (!toastArea) return

  const toast = document.createElement('div')
  toast.className = `px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
    type === 'success' ? 'bg-green-600 text-white' :
    type === 'error' ? 'bg-red-600 text-white' :
    'bg-blue-600 text-white'
  }`
  toast.textContent = message
  toastArea.appendChild(toast)

  setTimeout(() => {
    if (toastArea.contains(toast)) {
      toastArea.removeChild(toast)
    }
  }, 5000)
}

function PriorityBadge({ priority }) {
  const colors = {
    low: 'bg-gray-100 text-gray-700 border-gray-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200'
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${colors[priority] || colors.medium}`}>
      {priority.toUpperCase()}
    </span>
  )
}

function StatusBadge({ status }) {
  const colors = {
    open: 'bg-blue-100 text-blue-700 border-blue-200',
    in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
    resolved: 'bg-green-100 text-green-700 border-green-200',
    closed: 'bg-gray-100 text-gray-700 border-gray-200'
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${colors[status] || colors.open}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  )
}

function ComplaintTypeBadge({ type }) {
  const colors = {
    technical: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    installation: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    billing: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    service: 'bg-pink-100 text-pink-700 border-pink-200',
    other: 'bg-gray-100 text-gray-700 border-gray-200'
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${colors[type] || colors.other}`}>
      {type.toUpperCase()}
    </span>
  )
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', priority: '', type: '' })

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState(null)

  // Form states with validation
  const [createForm, setCreateForm] = useState({
    projectId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    complaintType: 'technical',
    priority: 'medium',
    title: '',
    description: '',
    assignedTo: ''
  })

  const [updateForm, setUpdateForm] = useState({
    status: 'open',
    assignedTo: '',
    resolution: ''
  })

  // Form validation and submission states
  const [createErrors, setCreateErrors] = useState({})
  const [updateErrors, setUpdateErrors] = useState({})
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [updateSubmitting, setUpdateSubmitting] = useState(false)

  // Track form state changes for real-time feedback
  const [lastFormChange, setLastFormChange] = useState(null)
  const [formDirty, setFormDirty] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Enhanced auto-save draft functionality with debouncing
  const draftRef = useRef(null)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  // Load draft on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('complaint-draft')
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        if (draft.timestamp && Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
          setCreateForm(prev => ({ ...prev, ...draft.data }))
          setDraftLoaded(true)
        } else {
          localStorage.removeItem('complaint-draft')
        }
      } catch (err) {
        localStorage.removeItem('complaint-draft')
      }
    }
  }, [])

  // Debounced auto-save with improved logic
  useEffect(() => {
    // Skip saving if draft is being loaded or form is submitting
    if (!draftLoaded || createSubmitting) return

    // Clear existing timeout
    if (draftRef.current) {
      clearTimeout(draftRef.current)
    }

    // Check if form has meaningful data
    const hasData = createForm.customerName?.trim() ||
                   createForm.title?.trim() ||
                   createForm.description?.trim() ||
                   createForm.customerEmail?.trim() ||
                   createForm.customerPhone?.trim()

    if (hasData) {
      // Debounce save for 2 seconds after user stops typing
      draftRef.current = setTimeout(() => {
        const draft = {
          data: createForm,
          timestamp: Date.now(),
          version: '1.0'
        }
        localStorage.setItem('complaint-draft', JSON.stringify(draft))
        setLastSaved(Date.now())
        setFormDirty(false)
      }, 2000)
    }

    return () => {
      if (draftRef.current) {
        clearTimeout(draftRef.current)
      }
    }
  }, [createForm, createSubmitting, draftLoaded])

  // Clear draft after successful submission
  const clearDraft = () => {
    localStorage.removeItem('complaint-draft')
  }

  // Load data and setup real-time synchronization
  useEffect(() => {
    loadData()
    const unsub = subscribeToLive(undefined, (evt) => {
      if (evt?.entity === 'complaint') {
        console.log('Real-time complaint update:', evt.type, evt.id)

        if (evt.type === 'create') {
          setComplaints(prev => {
            // Avoid duplicates
            const exists = prev.find(c => c.id === evt.payload.id)
            if (exists) return prev
            return [evt.payload, ...prev]
          })
        }

        if (evt.type === 'update') {
          setComplaints(prev => prev.map(c =>
            c.id === evt.id ? { ...evt.payload, _lastUpdated: Date.now() } : c
          ))

          // If user is currently updating this complaint, show notification
          if (selectedComplaint?.id === evt.id && showUpdateModal) {
            showToast('Complaint was updated by another user. Please refresh if needed.', 'info')
          }
        }

        if (evt.type === 'delete') {
          setComplaints(prev => {
            const updated = prev.filter(c => c.id !== evt.id)
            // If user was viewing the deleted complaint, close modal
            if (selectedComplaint?.id === evt.id) {
              setShowUpdateModal(false)
              setSelectedComplaint(null)
              setUpdateForm({ status: 'open', assignedTo: '', resolution: '' })
              showToast('This complaint was deleted by another user.', 'info')
            }
            return updated
          })
        }

        if (evt.type === 'bulk') {
          setComplaints(Array.isArray(evt.payload) ? evt.payload.map(c => ({ ...c, _lastSynced: Date.now() })) : [])
        }
      }

      // Also listen for project updates that might affect complaints
      if (evt?.entity === 'project') {
        if (evt.type === 'update') {
          // Update project references in complaints if needed
          setComplaints(prev => prev.map(complaint =>
            complaint.projectId === evt.id
              ? { ...complaint, _projectUpdated: Date.now() }
              : complaint
          ))
        }
      }
    })
    return unsub
  }, [selectedComplaint?.id, showUpdateModal])

  // Warn users about unsaved changes when leaving page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (formDirty && showCreateModal) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [formDirty, showCreateModal])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      showToast('✅ You are back online', 'success')
    }

    const handleOffline = () => {
      setIsOnline(false)
      showToast('❌ You are offline. Changes will be saved locally.', 'error')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [complaintsRes, projectsRes] = await Promise.all([
        api.get('/api/complaints'),
        api.get('/api/projects')
      ])
      setComplaints(complaintsRes.data.complaints || [])
      setProjects(projectsRes.data.projects || [])
    } catch (err) {
      console.error('Failed to load data:', err)
    }
    setLoading(false)
  }

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter(complaint => {
      if (filters.status && complaint.status !== filters.status) return false
      if (filters.priority && complaint.priority !== filters.priority) return false
      if (filters.type && complaint.complaintType !== filters.type) return false
      return true
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }, [complaints, filters])

  // Validation functions
  const validateCreateForm = () => {
    const errors = {}

    if (!createForm.customerName.trim()) {
      errors.customerName = 'Customer name is required'
    }

    if (!createForm.title.trim()) {
      errors.title = 'Complaint title is required'
    }

    if (!createForm.description.trim()) {
      errors.description = 'Complaint description is required'
    }

    if (createForm.customerEmail && !/\S+@\S+\.\S+/.test(createForm.customerEmail)) {
      errors.customerEmail = 'Please enter a valid email address'
    }

    setCreateErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateUpdateForm = () => {
    const errors = {}

    if ((updateForm.status === 'resolved' || updateForm.status === 'closed') && !updateForm.resolution.trim()) {
      errors.resolution = 'Resolution is required when marking as resolved or closed'
    }

    setUpdateErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Enhanced form change tracking
  const handleCreateFormChange = (field, value) => {
    setCreateForm(prev => ({ ...prev, [field]: value }))
    setLastFormChange(Date.now())
    setFormDirty(true)

    // Clear error for this field if it exists
    if (createErrors[field]) {
      setCreateErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleUpdateFormChange = (field, value) => {
    setUpdateForm(prev => ({ ...prev, [field]: value }))
    setLastFormChange(Date.now())
    setFormDirty(true)

    // Clear error for this field if it exists
    if (updateErrors[field]) {
      setUpdateErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  // Create complaint with enhanced error handling
  const handleCreate = async (e) => {
    e.preventDefault()

    // Check if user is online
    if (!navigator.onLine) {
      showToast('❌ You are offline. Please check your internet connection and try again.', 'error')
      return
    }

    if (!validateCreateForm()) {
      showToast('Please fix the form errors before submitting', 'error')
      return
    }

    setCreateSubmitting(true)
    setFormDirty(false)

    try {
      const response = await api.post('/api/complaints', createForm)
      showToast('✅ Complaint created successfully!', 'success')

      // Reset form completely
      setShowCreateModal(false)
      setCreateForm({
        projectId: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        complaintType: 'technical',
        priority: 'medium',
        title: '',
        description: '',
        assignedTo: ''
      })
      setCreateErrors({})
      setFormDirty(false)
      clearDraft()

    } catch (err) {
      console.error('Failed to create complaint:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create complaint. Please try again.'
      showToast(`❌ ${errorMessage}`, 'error')
      setFormDirty(true) // Keep form dirty on error so user can retry
    } finally {
      setCreateSubmitting(false)
    }
  }

  // Update complaint with enhanced error handling
  const handleUpdate = async (e) => {
    e.preventDefault()

    // Check if user is online
    if (!navigator.onLine) {
      showToast('❌ You are offline. Please check your internet connection and try again.', 'error')
      return
    }

    if (!validateUpdateForm()) {
      showToast('Please fix the form errors before submitting', 'error')
      return
    }

    setUpdateSubmitting(true)
    setFormDirty(false)

    try {
      const response = await api.put(`/api/complaints/${selectedComplaint.id}`, updateForm)
      showToast('✅ Complaint updated successfully!', 'success')

      // Reset update form and close modal
      setShowUpdateModal(false)
      setSelectedComplaint(null)
      setUpdateForm({ status: 'open', assignedTo: '', resolution: '' })
      setUpdateErrors({})
      setFormDirty(false)

    } catch (err) {
      console.error('Failed to update complaint:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update complaint. Please try again.'
      showToast(`❌ ${errorMessage}`, 'error')
      setFormDirty(true) // Keep form dirty on error so user can retry
    } finally {
      setUpdateSubmitting(false)
    }
  }

  const openUpdateModal = (complaint) => {
    setSelectedComplaint(complaint)
    setUpdateForm({
      status: complaint.status,
      assignedTo: complaint.assignedTo || '',
      resolution: complaint.resolution || ''
    })
    setShowUpdateModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-brand/5 to-white">
        <TopNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading complaints...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand/5 to-white">
      <TopNav />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fadein">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Complaints Management</h2>
              <p className="text-sm text-gray-500 mt-1">Track and resolve customer complaints professionally</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition font-medium relative"
            >
              New Complaint
              {localStorage.getItem('complaint-draft') && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" title="Draft saved"></div>
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                className="rounded-lg border px-3 py-2 text-sm"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Priority:</label>
              <select
                className="rounded-lg border px-3 py-2 text-sm"
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <select
                className="rounded-lg border px-3 py-2 text-sm"
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="">All Types</option>
                <option value="technical">Technical</option>
                <option value="installation">Installation</option>
                <option value="billing">Billing</option>
                <option value="service">Service</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button
              onClick={() => setFilters({ status: '', priority: '', type: '' })}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Complaints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComplaints.map((complaint) => {
            const project = projects.find(p => p.id === complaint.projectId)
            return (
              <div key={complaint.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{complaint.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <ComplaintTypeBadge type={complaint.complaintType} />
                      <PriorityBadge priority={complaint.priority} />
                      <StatusBadge status={complaint.status} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div><strong>Customer:</strong> {complaint.customerName}</div>
                  {complaint.customerPhone && <div><strong>Phone:</strong> {complaint.customerPhone}</div>}
                  {complaint.customerEmail && <div><strong>Email:</strong> {complaint.customerEmail}</div>}
                  {project && <div><strong>Project:</strong> {project.customerName} ({project.capacityKw}kW)</div>}
                  {complaint.assignedTo && <div><strong>Assigned to:</strong> {complaint.assignedTo}</div>}
                  <div><strong>Created:</strong> {new Date(complaint.createdAt).toLocaleDateString()}</div>
                  <div><strong>Last Updated:</strong> {new Date(complaint.updatedAt).toLocaleDateString()}</div>
                </div>

                <div className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {complaint.description}
                </div>

                {complaint.resolution && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="text-sm font-medium text-green-800 mb-1">Resolution:</div>
                    <div className="text-sm text-green-700">{complaint.resolution}</div>
                  </div>
                )}

                <button
                  onClick={() => openUpdateModal(complaint)}
                  className="w-full px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition font-medium"
                >
                  Update Status
                </button>
              </div>
            )
          })}
        </div>

        {filteredComplaints.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No complaints found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first complaint.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition font-medium"
            >
              Create Complaint
            </button>
          </div>
        )}
      </main>

      <Footer />

      {/* Create Complaint Modal */}
      <Modal open={showCreateModal} onClose={() => {
        if (!createSubmitting) {
          if (formDirty) {
            const confirmClose = window.confirm(
              'You have unsaved changes. Are you sure you want to close? Your draft will be saved automatically.'
            )
            if (!confirmClose) return
          }
          setShowCreateModal(false)
          setCreateErrors({})
        }
      }} title="New Customer Complaint">
        <form onSubmit={handleCreate} className="max-h-[80vh] overflow-y-auto">
          <div className="space-y-8">
            {/* Draft and Auto-save Indicators */}
            <div className="-mx-6 -mt-6 mb-6">
              {localStorage.getItem('complaint-draft') && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-orange-800">
                    <span className="text-sm">💾</span>
                    <span className="text-sm font-medium">Draft Restored</span>
                  </div>
                  <p className="text-xs text-orange-700 mt-1">Your previous work has been automatically restored</p>
                </div>
              )}

              {/* Status indicators */}
              <div className="space-y-2">
                {/* Connection status */}
                {!isOnline && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                    <div className="flex items-center gap-2 text-red-700">
                      <span className="text-xs">📡</span>
                      <span className="text-xs font-medium">Offline Mode</span>
                      <span className="text-xs">- Changes will sync when online</span>
                    </div>
                  </div>
                )}

                {/* Auto-save indicator */}
                {(formDirty || lastSaved) && !createSubmitting && isOnline && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <div className="flex items-center gap-2 text-blue-700">
                      {formDirty ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                          <span className="text-xs">Auto-saving draft...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs">💾</span>
                          <span className="text-xs">
                            Draft saved {lastSaved ? new Date(lastSaved).toLocaleTimeString() : 'recently'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information Section */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-sm">👤</span>
                  </div>
                  Customer Information
                </h3>
                <p className="text-sm text-gray-600 mt-1">Basic details about the customer filing the complaint</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Project Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Associated Project
                    <span className="text-xs text-gray-500 ml-2 font-normal">(Optional - Link to existing solar project)</span>
                  </label>
                  <select
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 ${
                      createErrors.projectId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    value={createForm.projectId}
                    onChange={(e) => handleCreateFormChange('projectId', e.target.value)}
                    disabled={createSubmitting}
                  >
                    <option value="">Select a project (optional)</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.customerName} • {project.capacityKw}kW • {project.siteAddress}
                      </option>
                    ))}
                  </select>
                  {createForm.projectId && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      ✓ Project details will be auto-filled
                    </p>
                  )}
                </div>

                {/* Customer Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 ${
                        createErrors.customerName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                      }`}
                      value={createForm.customerName}
                    onChange={(e) => handleCreateFormChange('customerName', e.target.value)}
                    disabled={createSubmitting}
                  />
                  {createErrors.customerName && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span>⚠️</span> {createErrors.customerName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                    <span className="text-xs text-gray-500 ml-2 font-normal">(For follow-up calls)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91-XXXXXXXXXX"
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 ${
                      createErrors.customerPhone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    value={createForm.customerPhone}
                    onChange={(e) => handleCreateFormChange('customerPhone', e.target.value)}
                    disabled={createSubmitting}
                  />
                  {createErrors.customerPhone && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span>⚠️</span> {createErrors.customerPhone}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                  <span className="text-xs text-gray-500 ml-2 font-normal">(For email notifications)</span>
                </label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 ${
                    createErrors.customerEmail ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                  }`}
                  value={createForm.customerEmail}
                  onChange={(e) => handleCreateFormChange('customerEmail', e.target.value)}
                  disabled={createSubmitting}
                />
                {createErrors.customerEmail && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {createErrors.customerEmail}
                  </p>
                )}
              </div>
              </div>
            </div>

            {/* Complaint Details Section */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 text-sm">📋</span>
                  </div>
                  Complaint Details
                </h3>
                <p className="text-sm text-gray-600 mt-1">Categorize and describe the complaint</p>
              </div>

              {/* Complaint Classification */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Complaint Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 ${
                      createErrors.complaintType ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    value={createForm.complaintType}
                    onChange={(e) => handleCreateFormChange('complaintType', e.target.value)}
                    disabled={createSubmitting}
                  >
                    <option value="technical">🔧 Technical Issue</option>
                    <option value="installation">⚡ Installation Problem</option>
                    <option value="billing">💰 Billing Issue</option>
                    <option value="service">🛠️ Service Request</option>
                    <option value="other">📋 Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Priority Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 ${
                      createErrors.priority ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    value={createForm.priority}
                    onChange={(e) => handleCreateFormChange('priority', e.target.value)}
                    disabled={createSubmitting}
                  >
                    <option value="low">🟢 Low Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="high">🟠 High Priority</option>
                    <option value="critical">🔴 Critical Priority</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Assign To
                    <span className="text-xs text-gray-500 ml-2 font-normal">(Team member)</span>
                  </label>
                  <select
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 ${
                      createErrors.assignedTo ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    value={createForm.assignedTo}
                    onChange={(e) => handleCreateFormChange('assignedTo', e.target.value)}
                    disabled={createSubmitting}
                  >
                    <option value="">👤 Unassigned</option>
                    <option value="staff">👨‍💼 Staff</option>
                    <option value="ops">🔧 Operations</option>
                    <option value="admin">👑 Admin</option>
                  </select>
                </div>
              </div>

              {/* Complaint Description */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Complaint Title <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2 font-normal">(Brief summary)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Solar panels generating 20% less power than expected"
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 ${
                      createErrors.title ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    value={createForm.title}
                    onChange={(e) => handleCreateFormChange('title', e.target.value)}
                    disabled={createSubmitting}
                  />
                  {createErrors.title && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span>⚠️</span> {createErrors.title}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Detailed Description <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2 font-normal">(Complete details)</span>
                  </label>
                  <textarea
                    placeholder="Please describe the complaint in detail. Include when the issue started, what the customer observed, steps already taken, and any relevant context..."
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 h-32 resize-none ${
                      createErrors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    value={createForm.description}
                    onChange={(e) => handleCreateFormChange('description', e.target.value)}
                    disabled={createSubmitting}
                  />
                  {createErrors.description && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span>⚠️</span> {createErrors.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Character count: {createForm.description.length} / 1000
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  if (!createSubmitting) {
                    setShowCreateModal(false)
                    setCreateErrors({})
                  }
                }}
                className="px-6 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 disabled:opacity-50 font-medium"
                disabled={createSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createSubmitting}
                className="px-6 py-2.5 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center gap-2 min-w-[140px] justify-center"
              >
                {createSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <span>📝</span>
                    Create Complaint
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Update Complaint Modal */}
      <Modal open={showUpdateModal} onClose={() => {
        if (!updateSubmitting) {
          setShowUpdateModal(false)
          setSelectedComplaint(null)
          setUpdateForm({ status: 'open', assignedTo: '', resolution: '' })
          setUpdateErrors({})
        }
      }} title={`Update Complaint: ${selectedComplaint?.title || ''}`}>
        <form onSubmit={handleUpdate} className="max-h-[80vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Current Status Overview */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 -mx-6 -mt-6 px-6 py-5 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-sm">📊</span>
                    </div>
                    Current Status
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Complaint ID: <span className="font-mono font-medium">{selectedComplaint?.id}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="mb-2">
                    <StatusBadge status={selectedComplaint?.status} />
                  </div>
                  <p className="text-xs text-blue-600">
                    Last updated: {selectedComplaint ? new Date(selectedComplaint.updatedAt).toLocaleString() : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Update Section */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 text-sm">🔄</span>
                  </div>
                  Update Status & Assignment
                </h3>
                <p className="text-sm text-gray-600 mt-1">Change the complaint status and team assignment</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    New Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 ${
                      updateErrors.status ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    value={updateForm.status}
                    onChange={(e) => handleUpdateFormChange('status', e.target.value)}
                    disabled={updateSubmitting}
                  >
                    <option value="open">📂 Open - Initial status</option>
                    <option value="in_progress">🔄 In Progress - Being worked on</option>
                    <option value="resolved">✅ Resolved - Issue fixed</option>
                    <option value="closed">🔒 Closed - Final status</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Current: <span className="font-medium">{selectedComplaint?.status?.replace('_', ' ').toUpperCase()}</span>
                  </p>
                  {updateErrors.status && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <span>⚠️</span> {updateErrors.status}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Assign To
                    <span className="text-xs text-gray-500 ml-2 font-normal">(Team member)</span>
                  </label>
                  <select
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 ${
                      updateErrors.assignedTo ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    value={updateForm.assignedTo}
                    onChange={(e) => handleUpdateFormChange('assignedTo', e.target.value)}
                    disabled={updateSubmitting}
                  >
                    <option value="">👤 Unassigned</option>
                    <option value="staff">👨‍💼 Staff</option>
                    <option value="ops">🔧 Operations</option>
                    <option value="admin">👑 Admin</option>
                  </select>
                  {selectedComplaint?.assignedTo && (
                    <p className="text-xs text-gray-500 mt-1">
                      Currently assigned to: <span className="font-medium">{selectedComplaint.assignedTo}</span>
                    </p>
                  )}
                  {updateErrors.assignedTo && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <span>⚠️</span> {updateErrors.assignedTo}
                    </p>
                  )}
                </div>
              </div>

              {/* Resolution Section - Only show when resolving or closing */}
              {(updateForm.status === 'resolved' || updateForm.status === 'closed') && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 -mx-6 px-6 py-5 border-b border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-sm">✅</span>
                    </div>
                    Resolution Details {updateForm.status === 'resolved' ? '*' : '(Optional)'}
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    {updateForm.status === 'resolved'
                      ? 'Please provide comprehensive details about how this complaint was resolved'
                      : 'Optional notes about why this complaint is being closed'
                    }
                  </p>
                </div>
              )}

              {(updateForm.status === 'resolved' || updateForm.status === 'closed') && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Resolution Notes
                    <span className="text-xs text-gray-500 ml-2 font-normal">
                      {updateForm.status === 'resolved' ? 'Required for resolved complaints' : 'Optional for closed complaints'}
                    </span>
                  </label>
                  <textarea
                    placeholder={
                      updateForm.status === 'resolved'
                        ? "Provide detailed resolution information:\n• What was the root cause?\n• What actions were taken?\n• What parts/equipment were replaced?\n• How was the issue verified as resolved?\n• Any follow-up actions needed?"
                        : "Optional notes about why this complaint is being closed..."
                    }
                    className={`w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 h-40 resize-none ${
                      updateErrors.resolution ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                    }`}
                    value={updateForm.resolution}
                    onChange={(e) => handleUpdateFormChange('resolution', e.target.value)}
                    disabled={updateSubmitting}
                    required={updateForm.status === 'resolved'}
                  />
                  {updateErrors.resolution && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <span>⚠️</span> {updateErrors.resolution}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Character count: {updateForm.resolution.length} / 1000
                  </p>
                </div>
              )}

              {/* Complaint Summary */}
              <div className="bg-gray-50 -mx-6 px-6 py-5 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 text-xs">📋</span>
                  </div>
                  Complaint Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-medium text-gray-900">{selectedComplaint?.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium text-gray-900">{selectedComplaint?.complaintType?.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className="font-medium text-gray-900">{selectedComplaint?.priority?.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium text-gray-900 text-right">
                        {selectedComplaint ? new Date(selectedComplaint.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">{selectedComplaint?.customerPhone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900 text-right">{selectedComplaint?.customerEmail || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  if (!updateSubmitting) {
                    setShowUpdateModal(false)
                    setSelectedComplaint(null)
                    setUpdateForm({ status: 'open', assignedTo: '', resolution: '' })
                    setUpdateErrors({})
                  }
                }}
                className="px-6 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 disabled:opacity-50 font-medium"
                disabled={updateSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateSubmitting}
                className="px-6 py-2.5 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center gap-2 min-w-[160px] justify-center"
              >
                {updateSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    Update to {updateForm.status.replace('_', ' ').toUpperCase()}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
