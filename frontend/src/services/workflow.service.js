import api from './api'

export const workflowService = {
  getAll:     (params)     => api.get('/workflows', { params }),
  getOne:     (id)         => api.get(`/workflows/${id}`),
  create:     (data)       => api.post('/workflows', data),
  update:     (id, data)   => api.put(`/workflows/${id}`, data),
  delete:     (id)         => api.delete(`/workflows/${id}`),
  activate:   (id)         => api.put(`/workflows/${id}/activate`),
  pause:      (id)         => api.put(`/workflows/${id}/pause`),
  run:        (id, data)   => api.post(`/workflows/${id}/run`, data),
  duplicate:  (id)         => api.post(`/workflows/${id}/duplicate`),
  getLogs:    (id, params) => api.get(`/workflows/${id}/logs`, { params }),
  getStats:   (id)         => api.get(`/workflows/${id}/stats`),
}

export const triggerService = {
  create: (data)     => api.post('/triggers', data),
  get:    (id)       => api.get(`/triggers/${id}`),
  update: (id, data) => api.put(`/triggers/${id}`, data),
  test:   (id)       => api.post(`/triggers/${id}/test`),
}

export const actionService = {
  create:    (data)       => api.post('/actions', data),
  getByWorkflow: (id)     => api.get(`/actions/workflow/${id}`),
  update:    (id, data)   => api.put(`/actions/${id}`, data),
  delete:    (id)         => api.delete(`/actions/${id}`),
  reorder:   (data)       => api.put('/actions/reorder', data),
  test:      (id)         => api.post(`/actions/${id}/test`),
  getTemplates: ()        => api.get('/actions/templates'),
}
