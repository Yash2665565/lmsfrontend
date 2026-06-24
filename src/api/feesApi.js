import api from '../app/axios'

export const feesApi = {
  // Fee heads
  getHeads:    ()      => api.get('/fees/heads').then(r => r.data.data ?? []),
  createHead:  (b)     => api.post('/fees/heads', b).then(r => r.data.data),
  updateHead:  (id, b) => api.put(`/fees/heads/${id}`, b).then(r => r.data.data),
  deleteHead:  (id)    => api.delete(`/fees/heads/${id}`),

  // Structure per section
  getStructures:   (sectionId) => api.get('/fees/structures', { params: { sectionId } }).then(r => r.data.data ?? []),
  upsertStructure: (b)         => api.post('/fees/structures', b).then(r => r.data.data),
  deleteStructure: (id)        => api.delete(`/fees/structures/${id}`),

  // Student sheet + admin collections
  getStudentFees: (sid)       => api.get(`/fees/student/${sid}`).then(r => r.data.data),
  getCollections: (sectionId) => api.get('/fees/collections', { params: { sectionId } }).then(r => r.data.data ?? []),
  updateStatus:   (b)         => api.post('/fees/student-status', b).then(r => r.data.data),

  // sections for the dropdowns
  getSections: () => api.get('/sections').then(r => r.data.data ?? []),
}

export const sectionLabel = (s) =>
  s ? `${s.classGrade?.name ?? s.className ?? 'Class'} — ${s.name}` : ''
