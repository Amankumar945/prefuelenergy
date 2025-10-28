import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import DigitalClock from './DigitalClock.jsx'

export default function TopNav() {
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [online, setOnline] = useState(true)
  useEffect(()=>{
    function handler(e){ setOnline(!!e?.detail?.online) }
    window.addEventListener('sse:status', handler)
    return ()=> window.removeEventListener('sse:status', handler)
  },[])

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 min-h-24 py-3 flex items-start justify-between relative">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand to-blue-500 animate-float" />
          <div className="flex flex-col leading-tight">
            <div className="font-semibold">Green Tree • Prefuel Energy</div>
            <div className="mt-0.5"><DigitalClock /></div>
          </div>
        </div>
        <nav className="w-full flex flex-wrap items-center gap-x-3 gap-y-1 text-sm pr-44">
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
          <Link
            to="/reports"
            className={`px-3 py-1.5 rounded-lg hover:bg-gray-50 ${isActive('/reports') ? 'text-brand font-medium' : 'text-gray-700'}`}
          >
            Reports
          </Link>
          <Link
            to="/announcements"
            className={`px-3 py-1.5 rounded-lg hover:bg-gray-50 ${isActive('/announcements') ? 'text-brand font-medium' : 'text-gray-700'}`}
          >
            Announcements
          </Link>
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
          <span className="mx-2 text-gray-200">|</span>
          <div className="absolute right-4 top-3 flex flex-col items-end gap-1 shrink-0 whitespace-nowrap">
            <span className="inline-flex items-center gap-2 text-xs text-gray-600">
              <span className={`h-2 w-2 rounded-full ${online?'bg-emerald-500':'bg-gray-400'}`}></span>
              <span>{online?'Live':'Offline'}</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-2 text-gray-700">
              <span className="px-2 py-0.5 rounded-md bg-gray-100 border text-xs">
                <span className="font-medium">{user?.name || 'User'}</span>
                <span className="mx-1 text-gray-400">•</span>
                <span className="uppercase tracking-wide text-[10px] px-1.5 py-0.5 rounded bg-white border">{user?.role || 'role'}</span>
              </span>
            </span>
            <button onClick={logout} className="px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-dark">
              Logout
            </button>
          </div>
        </nav>
      </div>
      <div id="toast-area" className="fixed bottom-4 right-4 z-50 space-y-2"></div>
    </header>
  )
}
