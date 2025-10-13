export function subscribeToLive(baseURL = (import.meta?.env?.VITE_API_BASE_URL || window.location.origin.replace(':5173', ':5000')), onEvent) {
  try {
    const url = `${baseURL.replace(/\/$/, '')}/api/stream`
    const es = new EventSource(url, { withCredentials: false })
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        onEvent?.(data)
      } catch (_) {}
    }
    es.onerror = () => {
      // Let the browser auto-reconnect
    }
    return () => es.close()
  } catch (_) {
    return () => {}
  }
}
