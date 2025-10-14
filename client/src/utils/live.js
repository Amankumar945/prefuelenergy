export function subscribeToLive(baseURL = (import.meta?.env?.VITE_API_BASE_URL || window.location.origin.replace(':5173', ':5000')), onEvent) {
  let stopped = false
  let delayMs = 1000 // start with 1s
  const maxDelay = 30000 // 30s

  function dispatchStatus(online) {
    try { window.dispatchEvent(new CustomEvent('sse:status', { detail: { online } })) } catch (_) {}
  }

  function connect() {
    if (stopped) return () => {}
    try {
      const url = `${baseURL.replace(/\/$/, '')}/api/stream`
      const es = new EventSource(url, { withCredentials: false })
      es.onopen = () => { delayMs = 1000; dispatchStatus(true) }
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          onEvent?.(data)
        } catch (_) {}
      }
      es.onerror = () => {
        dispatchStatus(false)
        es.close()
        if (!stopped) setTimeout(connect, delayMs)
        delayMs = Math.min(maxDelay, delayMs * 2)
      }
      return () => { stopped = true; try { es.close() } catch (_) {} }
    } catch (_) {
      dispatchStatus(false)
      setTimeout(connect, delayMs)
      delayMs = Math.min(maxDelay, delayMs * 2)
      return () => { stopped = true }
    }
  }
  return connect()
}
