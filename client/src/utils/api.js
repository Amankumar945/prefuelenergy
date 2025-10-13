import axios from 'axios'

// Use Vite env first, then smart fallback to localhost server
const baseURL = (import.meta?.env?.VITE_API_BASE_URL)
  || (typeof window !== 'undefined' ? (window.__API_BASE_URL__ || window.location.origin.replace(':5173', ':5000')) : 'http://localhost:5000')

export const api = axios.create({
  baseURL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    if (status === 403) {
      try {
        const area = document.getElementById('toast-area')
        if (area) {
          const el = document.createElement('div')
          el.className = 'px-3 py-2 rounded-lg bg-red-600 text-white text-xs shadow'
          el.textContent = error?.response?.data?.message || 'Forbidden'
          area.appendChild(el)
          setTimeout(()=>{ area.removeChild(el) }, 3000)
        }
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


