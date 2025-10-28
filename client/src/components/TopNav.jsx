import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import DigitalClock from './DigitalClock.jsx'

export default function TopNav() {
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [online, setOnline] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
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
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      {/* Desktop & Mobile Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Brand - Mobile Optimized */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-brand to-blue-500 animate-float flex-shrink-0" />
            <div className="flex flex-col leading-tight min-w-0">
              <div className="font-semibold text-xs sm:text-sm lg:text-base truncate">Green Tree • Prefuel Energy</div>
              <div className="mt-0.5"><DigitalClock /></div>
            </div>
          </div>

          {/* Desktop Navigation - Hidden on Mobile */}
          <nav className="hidden lg:flex items-center gap-2 xl:gap-3 text-sm mx-4 flex-wrap">
            {(user?.role === 'admin' || user?.role === 'staff') && (
              <Link to="/" className={`px-2 xl:px-3 py-1.5 rounded-lg hover:bg-gray-50 whitespace-nowrap ${isActive('/') ? 'text-brand font-medium' : 'text-gray-700'}`}>
                Dashboard
              </Link>
            )}
            {(user?.role === 'admin' || user?.role === 'staff') && (
              <Link to="/leads" className={`px-2 xl:px-3 py-1.5 rounded-lg hover:bg-gray-50 whitespace-nowrap ${isActive('/leads') ? 'text-brand font-medium' : 'text-gray-700'}`}>
                Leads
              </Link>
            )}
            {user?.role === 'hr' && (
              <Link to="/hr" className={`px-2 xl:px-3 py-1.5 rounded-lg hover:bg-gray-50 whitespace-nowrap ${isActive('/hr') ? 'text-brand font-medium' : 'text-gray-700'}`}>
                HR
              </Link>
            )}
            {(user?.role === 'admin' || user?.role === 'staff') && (
              <Link to="/projects" className={`px-2 xl:px-3 py-1.5 rounded-lg hover:bg-gray-50 whitespace-nowrap ${isActive('/projects') ? 'text-brand font-medium' : 'text-gray-700'}`}>
                Projects
              </Link>
            )}
            <Link to="/reports" className={`px-2 xl:px-3 py-1.5 rounded-lg hover:bg-gray-50 whitespace-nowrap ${isActive('/reports') ? 'text-brand font-medium' : 'text-gray-700'}`}>
              Reports
            </Link>
            <Link to="/announcements" className={`px-2 xl:px-3 py-1.5 rounded-lg hover:bg-gray-50 whitespace-nowrap ${isActive('/announcements') ? 'text-brand font-medium' : 'text-gray-700'}`}>
              Announcements
            </Link>
            {(user?.role === 'admin' || user?.role === 'staff') && (
              <>
                <Link to="/service" className={`px-2 xl:px-3 py-1.5 rounded-lg hover:bg-gray-50 whitespace-nowrap ${isActive('/service') ? 'text-brand font-medium' : 'text-gray-700'}`}>
                  Service
                </Link>
                <Link to="/invoices" className={`px-2 xl:px-3 py-1.5 rounded-lg hover:bg-gray-50 whitespace-nowrap ${isActive('/invoices') ? 'text-brand font-medium' : 'text-gray-700'}`}>
                  Invoices
                </Link>
                <Link to="/inventory" className={`px-2 xl:px-3 py-1.5 rounded-lg hover:bg-gray-50 whitespace-nowrap ${isActive('/inventory') ? 'text-brand font-medium' : 'text-gray-700'}`}>
                  Inventory
                </Link>
                <Link to="/procurement" className={`px-2 xl:px-3 py-1.5 rounded-lg hover:bg-gray-50 whitespace-nowrap ${isActive('/procurement') ? 'text-brand font-medium' : 'text-gray-700'}`}>
                  Procurement
                </Link>
                <Link to="/quotes" className={`px-2 xl:px-3 py-1.5 rounded-lg hover:bg-gray-50 whitespace-nowrap ${isActive('/quotes') ? 'text-brand font-medium' : 'text-gray-700'}`}>
                  Quotes
                </Link>
              </>
            )}
          </nav>

          {/* Right Side - Status & User Info */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Live Status */}
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
              <span className={`h-2 w-2 rounded-full ${online?'bg-emerald-500':'bg-gray-400'}`}></span>
              <span className="hidden sm:inline">{online?'Live':'Offline'}</span>
            </span>

            {/* User Info - Desktop Only */}
            <span className="hidden lg:inline-flex items-center gap-2 text-gray-700">
              <span className="px-2 py-0.5 rounded-md bg-gray-100 border text-xs">
                <span className="font-medium">{user?.name || 'User'}</span>
                <span className="mx-1 text-gray-400">•</span>
                <span className="uppercase tracking-wide text-[10px] px-1.5 py-0.5 rounded bg-white border">{user?.role || 'role'}</span>
              </span>
            </span>

            {/* Logout Button - Desktop */}
            <button onClick={logout} className="hidden lg:flex px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-dark text-sm whitespace-nowrap">
              Logout
            </button>

            {/* Hamburger Menu - Mobile/Tablet Only */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex flex-col gap-1 p-2 rounded-lg hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              <span className={`w-5 h-0.5 bg-gray-700 transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
              <span className={`w-5 h-0.5 bg-gray-700 transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-5 h-0.5 bg-gray-700 transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pb-2 border-t border-gray-100 pt-3">
            <nav className="flex flex-col gap-1">
              {/* User Info - Mobile */}
              <div className="px-3 py-2 mb-2 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-sm font-medium text-gray-900">{user?.name || 'User'}</div>
                <div className="text-xs text-gray-500 uppercase mt-0.5">{user?.role || 'role'}</div>
              </div>

              {(user?.role === 'admin' || user?.role === 'staff') && (
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2.5 rounded-lg hover:bg-gray-50 ${isActive('/') ? 'text-brand font-medium bg-brand/5' : 'text-gray-700'}`}>
                  Dashboard
                </Link>
              )}
              {(user?.role === 'admin' || user?.role === 'staff') && (
                <Link to="/leads" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2.5 rounded-lg hover:bg-gray-50 ${isActive('/leads') ? 'text-brand font-medium bg-brand/5' : 'text-gray-700'}`}>
                  Leads
                </Link>
              )}
              {user?.role === 'hr' && (
                <Link to="/hr" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2.5 rounded-lg hover:bg-gray-50 ${isActive('/hr') ? 'text-brand font-medium bg-brand/5' : 'text-gray-700'}`}>
                  HR Dashboard
                </Link>
              )}
              {(user?.role === 'admin' || user?.role === 'staff') && (
                <Link to="/projects" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2.5 rounded-lg hover:bg-gray-50 ${isActive('/projects') ? 'text-brand font-medium bg-brand/5' : 'text-gray-700'}`}>
                  Projects
                </Link>
              )}
              <Link to="/reports" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2.5 rounded-lg hover:bg-gray-50 ${isActive('/reports') ? 'text-brand font-medium bg-brand/5' : 'text-gray-700'}`}>
                Reports
              </Link>
              <Link to="/announcements" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2.5 rounded-lg hover:bg-gray-50 ${isActive('/announcements') ? 'text-brand font-medium bg-brand/5' : 'text-gray-700'}`}>
                Announcements
              </Link>
              {(user?.role === 'admin' || user?.role === 'staff') && (
                <>
                  <Link to="/service" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2.5 rounded-lg hover:bg-gray-50 ${isActive('/service') ? 'text-brand font-medium bg-brand/5' : 'text-gray-700'}`}>
                    Service
                  </Link>
                  <Link to="/invoices" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2.5 rounded-lg hover:bg-gray-50 ${isActive('/invoices') ? 'text-brand font-medium bg-brand/5' : 'text-gray-700'}`}>
                    Invoices
                  </Link>
                  <Link to="/inventory" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2.5 rounded-lg hover:bg-gray-50 ${isActive('/inventory') ? 'text-brand font-medium bg-brand/5' : 'text-gray-700'}`}>
                    Inventory
                  </Link>
                  <Link to="/procurement" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2.5 rounded-lg hover:bg-gray-50 ${isActive('/procurement') ? 'text-brand font-medium bg-brand/5' : 'text-gray-700'}`}>
                    Procurement
                  </Link>
                  <Link to="/quotes" onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2.5 rounded-lg hover:bg-gray-50 ${isActive('/quotes') ? 'text-brand font-medium bg-brand/5' : 'text-gray-700'}`}>
                    Quotes
                  </Link>
                </>
              )}
              
              {/* Logout Button - Mobile */}
              <button onClick={logout} className="mt-3 px-3 py-2.5 rounded-lg bg-brand text-white hover:bg-brand-dark font-medium w-full text-left">
                Logout
              </button>
            </nav>
          </div>
        )}
      </div>
      <div id="toast-area" className="fixed bottom-4 right-4 z-50 space-y-2"></div>
    </header>
  )
}
