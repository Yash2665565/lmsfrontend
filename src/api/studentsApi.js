import api from '../app/axios'

export const studentsApi = {
  list: (params) => api.get('/students', { params }).then(r => r.data.data),
  getById: (id) => api.get('/students/' + id).then(r => r.data.data),
  create: (data) => api.post('/students', data).then(r => r.data.data),
  update: (id, data) => api.put('/students/' + id, data).then(r => r.data.data),
  delete: (id) => api.delete('/students/' + id),
  getAttendanceSummary: (id) => api.get('/students/' + id + '/attendance-summary').then(r => r.data.data),
  getReportCard: (id, termId) => api.get('/students/' + id + '/report-card', { params: { termId } }).then(r => r.data.data),
}
