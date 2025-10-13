import { useState } from 'react'
import { api } from '../utils/api.js'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@prefuel')
  const [password, setPassword] = useState('Admin@12345')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('admin')

  const roleDefaults = {
    admin: { email: 'admin@prefuel', password: 'Admin@12345' },
    staff: { email: 'staff@prefuel', password: 'Staff@12345' },
    hr: { email: 'hr@prefuel', password: 'Hr@2025!' },
  }

  function handleSelectRole(role) {
    setSelectedRole(role)
    const d = roleDefaults[role]
    setEmail(d.email)
    setPassword(d.password)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', {
        email,
        password,
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      // After login, redirect by role
      const role = res.data.user.role
      if (role === 'hr') navigate('/hr')
      else navigate('/')
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand/10 via-solar.yellow/10 to-white p-4">
      <div className="absolute inset-x-0 -top-20 -z-10 h-64 bg-gradient-to-r from-brand to-solar.amber opacity-20 blur-3xl" />
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-8 border border-gray-100 animate-fadein">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand to-solar.amber animate-float" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Green Tree • Prefuel Energy</h1>
            <p className="text-xs text-gray-500">Solar Rooftop Scheme — India</p>
          </div>
        </div>
        {/* Role panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            type="button"
            onClick={() => handleSelectRole('admin')}
            className={`rounded-2xl p-5 border transition hover:shadow ${selectedRole==='admin' ? 'border-brand bg-brand/10' : 'border-gray-200 bg-gray-50'}`}
          >
            <div className="text-sm text-gray-500">Login as</div>
            <div className="text-lg font-semibold">Admin</div>
            <div className="mt-2 text-xs text-gray-500">Access dashboard and projects</div>
          </button>
          <button
            type="button"
            onClick={() => handleSelectRole('staff')}
            className={`rounded-2xl p-5 border transition hover:shadow ${selectedRole==='staff' ? 'border-sky-500 bg-sky-50' : 'border-gray-200 bg-gray-50'}`}
          >
            <div className="text-sm text-gray-500">Login as</div>
            <div className="text-lg font-semibold">Staff</div>
            <div className="mt-2 text-xs text-gray-500">Work on leads, quotes, inventory</div>
          </button>
          <button
            type="button"
            onClick={() => handleSelectRole('hr')}
            className={`rounded-2xl p-5 border transition hover:shadow ${selectedRole==='hr' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}
          >
            <div className="text-sm text-gray-500">Login as</div>
            <div className="text-lg font-semibold">HR</div>
            <div className="mt-2 text-xs text-gray-500">Manage employees and attendance</div>
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={roleDefaults[selectedRole].email}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={roleDefaults[selectedRole].password}
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand text-white py-2 font-medium hover:bg-brand-dark transition disabled:opacity-60 shadow-sm"
          >
            {loading ? 'Signing in…' : selectedRole === 'hr' ? 'Login as HR' : selectedRole === 'staff' ? 'Login as Staff' : 'Login as Admin'}
          </button>
          <div className="text-xs text-gray-500 mt-2">
            Admin: <b>admin@prefuel</b> / <b>Admin@12345</b>
            <br />Staff: <b>staff@prefuel</b> / <b>Staff@12345</b>
            <br />HR: <b>hr@prefuel</b> / <b>Hr@2025!</b>
          </div>
        </form>
        <div className="mt-6 text-[10px] text-gray-400 text-center">© Green Tree • Prefuel Energy — Since 2015</div>
      </div>
    </div>
  )
}


