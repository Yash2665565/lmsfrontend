import api from '../app/axios'

export const transportApi = {
  // Routes
  getRoutes:    ()      => api.get('/transport/routes').then(r => r.data.data ?? []),
  createRoute:  (body)  => api.post('/transport/routes', body).then(r => r.data.data),
  updateRoute:  (id, b) => api.put(`/transport/routes/${id}`, b).then(r => r.data.data),
  deleteRoute:  (id)    => api.delete(`/transport/routes/${id}`),

  // Buses
  getBuses:     ()      => api.get('/transport/buses').then(r => r.data.data ?? []),
  createBus:    (body)  => api.post('/transport/buses', body).then(r => r.data.data),
  updateBus:    (id, b) => api.put(`/transport/buses/${id}`, b).then(r => r.data.data),
  deleteBus:    (id)    => api.delete(`/transport/buses/${id}`),

  // Assignments
  getAssignments: ()        => api.get('/transport/assignments').then(r => r.data.data ?? []),
  assign:         (body)    => api.post('/transport/assignments', body).then(r => r.data.data),
  unassign:       (sid)     => api.delete(`/transport/assignments/${sid}`),
  getStudentTransport: (sid) => api.get(`/transport/student/${sid}`).then(r => r.data.data),

  // Students (for the assign dropdown)
  getStudents: () => api.get('/students', { params: { page: 0, size: 1000 } })
    .then(r => r.data.data?.content ?? (Array.isArray(r.data.data) ? r.data.data : [])),
}
