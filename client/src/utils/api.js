import axios from 'axios'

// Prefer env, fallback to dev convention (5173 -> 5000) or localhost
const baseURL = (typeof import !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL)
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


