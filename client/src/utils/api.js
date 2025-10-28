import axios from 'axios'

// Resolve API base URL at runtime first to avoid shipping localhost in the bundle.
function resolveApiBaseUrl() {
  const fromEnv = (import.meta?.env?.VITE_API_BASE_URL);
  if (typeof window !== 'undefined') {
    // Highest priority: runtime override injected in index.html
    if (window.__API_BASE_URL__) return String(window.__API_BASE_URL__);

    // Next: build-time env if provided
    if (fromEnv) return String(fromEnv);

    // Fallback: derive API subdomain from current host in production
    const { protocol, hostname } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocal) {
      // Local dev: prefer Vite env; if missing, default to same host on :5000
      return `${protocol}//${hostname}:5000`;
    }
    const apiHost = hostname.startsWith('api.') ? hostname : `api.${hostname}`;
    return `${protocol}//${apiHost}`;
  }
  // SSR/build time: do not hardcode anything
  return fromEnv || ''
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Offline write queue: if offline and a write, store it for later
  const isWrite = ['post','put','delete','patch'].includes(String(config.method||'get').toLowerCase())
  if (isWrite && typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      const key = 'offlineQueue'
      const q = JSON.parse(localStorage.getItem(key)||'[]')
      q.push({ url: config.url, method: config.method, data: config.data, headers: config.headers })
      localStorage.setItem(key, JSON.stringify(q))
      return Promise.reject({ isOfflineQueued: true })
    } catch (_) {}
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Offline fallback: if no response and network error, surface a small toast
    if (!error?.response && typeof window !== 'undefined') {
      try {
        const area = document.getElementById('toast-area') || (()=>{ const a=document.createElement('div'); a.id='toast-area'; a.style.position='fixed'; a.style.right='16px'; a.style.top='16px'; a.style.zIndex='9999'; document.body.appendChild(a); return a })()
        const el = document.createElement('div')
        el.className = 'px-3 py-2 rounded-lg bg-gray-800 text-white text-xs shadow'
        el.textContent = 'You are offline. Changes will sync when back online.'
        area.appendChild(el)
        setTimeout(()=>{ try{ area.removeChild(el) }catch(_){ } }, 3000)
      } catch (_) {}
    }
    const status = error?.response?.status
    if (status === 403) {
      try {
        // Dispatch global event for TopNav listener
        window.dispatchEvent(new CustomEvent('403_error', { detail: { message: error?.response?.data?.message || 'Forbidden' } }))
        // Fallback inline toast (ensure area exists)
        const area = document.getElementById('toast-area') || (()=>{ const a=document.createElement('div'); a.id='toast-area'; a.style.position='fixed'; a.style.right='16px'; a.style.top='16px'; a.style.zIndex='9999'; document.body.appendChild(a); return a })()
        const el = document.createElement('div')
        el.className = 'px-3 py-2 rounded-lg bg-red-600 text-white text-xs shadow'
        el.textContent = error?.response?.data?.message || 'Forbidden'
        area.appendChild(el)
        setTimeout(()=>{ try{ area.removeChild(el) }catch(_){ } }, 3000)
      } catch (_) {}
    }
    if (status === 401) {
      // Clear and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Flush offline queue on reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    try {
      const key = 'offlineQueue'
      const q = JSON.parse(localStorage.getItem(key)||'[]')
      if (!Array.isArray(q) || q.length===0) return
      for (const job of q) {
        try { await api.request(job) } catch (_) {}
      }
      localStorage.removeItem(key)
    } catch (_) {}
  })
}


