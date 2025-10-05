import { Link, useLocation } from 'react-router-dom'
import DigitalClock from './DigitalClock.jsx'

export default function TopNav() {
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand to-solar.amber animate-float" />
          <div className="font-semibold">Green Tree • Prefuel Energy</div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg hover:bg-gray-50 ${isActive('/') ? 'text-brand font-medium' : 'text-gray-700'}`}
            >
              Dashboard
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <Link
              to="/leads"
              className={`px-3 py-1.5 rounded-lg hover:bg-gray-50 ${isActive('/leads') ? 'text-brand font-medium' : 'text-gray-700'}`}
            >
              Leads
            </Link>
          )}
          {user?.role === 'hr' && (
            <Link
              to="/hr"
              className={`px-3 py-1.5 rounded-lg hover:bg-gray-50 ${isActive('/hr') ? 'text-brand font-medium' : 'text-gray-700'}`}
            >
              HR
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <Link
              to="/projects"
              className={`px-3 py-1.5 rounded-lg hover:bg-gray-50 ${isActive('/projects') ? 'text-brand font-medium' : 'text-gray-700'}`}
            >
              Projects
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <Link
              to="/service"
              className={`px-3 py-1.5 rounded-lg hover:bg-gray-50 ${isActive('/service') ? 'text-brand font-medium' : 'text-gray-700'}`}
            >
              Service
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <Link
              to="/invoices"
              className={`px-3 py-1.5 rounded-lg hover:bg-gray-50 ${isActive('/invoices') ? 'text-brand font-medium' : 'text-gray-700'}`}
            >
              Invoices
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <Link
              to="/inventory"
              className={`px-3 py-1.5 rounded-lg hover:bg-gray-50 ${isActive('/inventory') ? 'text-brand font-medium' : 'text-gray-700'}`}
            >
              Inventory
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <Link
              to="/procurement"
              className={`px-3 py-1.5 rounded-lg hover:bg-gray-50 ${isActive('/procurement') ? 'text-brand font-medium' : 'text-gray-700'}`}
            >
              Procurement
            </Link>
          )}
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <Link
              to="/quotes"
              className={`px-3 py-1.5 rounded-lg hover:bg-gray-50 ${isActive('/quotes') ? 'text-brand font-medium' : 'text-gray-700'}`}
            >
              Quotes
            </Link>
          )}
          <span className="mx-2 text-gray-300">|</span>
          <span className="text-gray-600 hidden sm:inline">{user?.name} • {user?.role}</span>
          <DigitalClock />
          <button onClick={logout} className="ml-2 px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-dark">
            Logout
          </button>
        </nav>
      </div>
    </header>
  )
}
