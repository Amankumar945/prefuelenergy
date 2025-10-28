import { useState } from 'react'
import { api } from '../utils/api.js'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand/10 via-blue-50 to-white p-4">
      <div className="absolute inset-x-0 -top-20 -z-10 h-64 bg-gradient-to-r from-brand to-blue-500 opacity-20 blur-3xl" />
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-8 border border-gray-100 animate-fadein">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand to-blue-500 animate-float" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Green Tree • Prefuel Energy</h1>
            <p className="text-xs text-gray-500">Solar Rooftop Scheme — India</p>
          </div>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand text-white py-2 font-medium hover:bg-brand-dark transition disabled:opacity-60 shadow-sm"
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>
        <div className="mt-6 text-[10px] text-gray-400 text-center">© Green Tree • Prefuel Energy — Since 2015</div>
      </div>
    </div>
  )
}


