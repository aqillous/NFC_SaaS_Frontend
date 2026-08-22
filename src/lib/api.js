import axios from 'axios'

// Vite exposes env vars prefixed with VITE_ on import.meta.env.
// Set VITE_API_URL in a .env file at the frontend root to point at your
// backend (defaults to the local FastAPI dev server).
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const TOKEN_STORAGE_KEY = 'tapline_admin_token'

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

// --- Auth ---
export const login = (email, password) => api.post('/api/auth/login', { email, password })
export const getMe = () => api.get('/api/auth/me')

// --- Dashboard ---
export const getDashboardStats = () => api.get('/api/dashboard/stats')

// --- Entities ---
export const listEntities = (params) => api.get('/api/entities', { params })
export const getEntity = (id) => api.get(`/api/entities/${id}`)
export const createEntity = (payload) => api.post('/api/entities', payload)
export const updateEntity = (id, payload) => api.put(`/api/entities/${id}`, payload)
export const deleteEntity = (id) => api.delete(`/api/entities/${id}`)

// --- Subscriptions ---
export const listSubscriptions = (params) => api.get('/api/subscriptions', { params })
export const getSubscription = (id) => api.get(`/api/subscriptions/${id}`)
export const createSubscription = (payload) => api.post('/api/subscriptions', payload)
export const updateSubscription = (id, payload) => api.put(`/api/subscriptions/${id}`, payload)
export const deleteSubscription = (id) => api.delete(`/api/subscriptions/${id}`)

export default api
