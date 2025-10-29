export function subscribeToLive(baseURL = (typeof window !== 'undefined' && window.__API_BASE_URL__) || (import.meta?.env?.VITE_API_BASE_URL) || (typeof window !== 'undefined' ? (()=>{
  const { protocol, hostname } = window.location
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
  if (isLocal) return `${protocol}//${hostname}:5000`
  const apiHost = hostname.startsWith('api.') ? hostname : `api.${hostname}`
  return `${protocol}//${apiHost}`
})() : ''), onEvent) {
  let stopped = false
  let delayMs = 1000 // start with 1s
  const maxDelay = 30000 // 30s
  let errorsInRow = 0
  let healthTimer = null

  function dispatchStatus(online) {
    try { window.dispatchEvent(new CustomEvent('sse:status', { detail: { online } })) } catch (_) {}
  }

  async function healthCheck() {
    if (stopped) return
    try {
      const url = `${baseURL.replace(/\/$/, '')}/healthz`
      const res = await fetch(url, { cache: 'no-store', credentials: 'omit', mode: 'cors' })
      if (res.ok) {
        dispatchStatus(true)
        return
      }
    } catch (_) {}
    if (errorsInRow >= 2) dispatchStatus(false)
  }

  function startHealth() {
    try { clearInterval(healthTimer) } catch (_) {}
    healthTimer = setInterval(healthCheck, 10000)
  }

  function stopHealth() {
    try { clearInterval(healthTimer) } catch (_) {}
    healthTimer = null
  }

  function connect() {
    if (stopped) return () => {}
    try {
      const url = `${baseURL.replace(/\/$/, '')}/api/stream`
      const es = new EventSource(url, { withCredentials: false })
      es.onopen = () => {
        delayMs = 1000
        errorsInRow = 0
        dispatchStatus(true)
      }
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          onEvent?.(data)
        } catch (_) {}
      }
      es.onerror = () => {
        errorsInRow += 1
        // Only flip to offline after at least 2 consecutive errors and when browser is online
        try {
          if (typeof navigator !== 'undefined' ? navigator.onLine : true) {
            if (errorsInRow >= 2) dispatchStatus(false)
          }
        } catch (_) {}
        es.close()
        if (!stopped) setTimeout(connect, delayMs)
        delayMs = Math.min(maxDelay, delayMs * 2)
      }
      // Kick off periodic health fallback
      startHealth()
      return () => { stopped = true; stopHealth(); try { es.close() } catch (_) {} }
    } catch (_) {
      errorsInRow += 1
      try {
        if (typeof navigator !== 'undefined' ? navigator.onLine : true) {
          if (errorsInRow >= 2) dispatchStatus(false)
        }
      } catch (_) {}
      setTimeout(connect, delayMs)
      delayMs = Math.min(maxDelay, delayMs * 2)
      return () => { stopped = true; stopHealth() }
    }
  }

  // Reflect browser online/offline quickly in the UI
  if (typeof window !== 'undefined') {
    try {
      window.addEventListener('online', () => { if (!stopped) { dispatchStatus(true); } })
      window.addEventListener('offline', () => { dispatchStatus(false) })
    } catch (_) {}
  }

  return connect()
}

