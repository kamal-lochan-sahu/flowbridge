import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, (error) => Promise.reject(error))

// Response interceptor — handle errors + token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        const res = await axios.post('/api/auth/refresh-token', { refreshToken })
        const { accessToken, refreshToken: newRefresh } = res.data.data

        localStorage.setItem('accessToken',  accessToken)
        localStorage.setItem('refreshToken', newRefresh)

        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    // Show error toast
    const message = error.response?.data?.message || 'Something went wrong'
    if (error.response?.status !== 401) toast.error(message)

    return Promise.reject(error)
  }
)

export default api
