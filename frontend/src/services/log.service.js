import api from './api'

export const logService = {
  getAll:   (params)  => api.get('/logs', { params }),
  getOne:   (id)      => api.get(`/logs/${id}`),
  getSteps: (id)      => api.get(`/logs/${id}/steps`),
  retry:    (id)      => api.post(`/logs/${id}/retry`),
  clear:    (params)  => api.delete('/logs/clear', { params }),
}

export const dashboardService = {
  getStats:  () => api.get('/dashboard/stats'),
  getChart:  () => api.get('/dashboard/chart'),
  getRecent: () => api.get('/dashboard/recent'),
}
