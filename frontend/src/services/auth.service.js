import api from './api'

export const authService = {
  register: (data)         => api.post('/auth/register', data),
  login:    (data)         => api.post('/auth/login', data),
  logout:   ()             => api.post('/auth/logout'),
  getMe:    ()             => api.get('/auth/me'),
  forgotPassword: (email)  => api.post('/auth/forgot-password', { email }),
  resetPassword:  (data)   => api.post('/auth/reset-password', data),
  changePassword: (data)   => api.post('/auth/change-password', data),
}
