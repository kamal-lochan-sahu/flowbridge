import api from './api'

export const credentialService = {
  getAll:  ()             => api.get('/credentials'),
  create:  (data)         => api.post('/credentials', data),
  update:  (id, data)     => api.put(`/credentials/${id}`, data),
  delete:  (id)           => api.delete(`/credentials/${id}`),
  test:    (id)           => api.post(`/credentials/${id}/test`),
  getGoogleOAuthUrl: ()   => api.get('/credentials/oauth/google'),
}
