import api from '../app/axios'

export const diaryApi = {
  getSectionDiary: (sid)  => api.get(`/diary/section/${sid}`).then(r => r.data.data ?? []),
  getStudentDiary: (sid)  => api.get(`/diary/student/${sid}`).then(r => r.data.data ?? []),
  getMySections:   ()     => api.get('/diary/my-sections').then(r => r.data.data ?? []),
  getMyAllocations:()     => api.get('/diary/my-allocations').then(r => r.data.data ?? []),
  createEntry:     (b)    => api.post('/diary', b).then(r => r.data.data),
  deleteEntry:     (id)   => api.delete(`/diary/${id}`),

  // student: mark done / not-done and/or leave a note
  respond:         (diaryId, body) => api.post(`/diary/${diaryId}/respond`, body).then(r => r.data.data),
  // teacher/admin: response report for a section (optional ?date=YYYY-MM-DD)
  getResponses:    (sid, date) => api.get(`/diary/section/${sid}/responses`, { params: date ? { date } : {} }).then(r => r.data.data ?? []),

  // admin: class-teacher assignment
  getAdminSections:   ()              => api.get('/diary/sections').then(r => r.data.data ?? []),
  assignClassTeacher: (sid, teacherId) => api.put(`/diary/sections/${sid}/class-teacher`, { teacherId }),

  // dropdown data
  getTeachers: () => api.get('/teachers').then(r => r.data.data ?? []),
  getSubjects: () => api.get('/subjects').then(r => r.data.data ?? []),
}

export const teacherLabel = (t) =>
  !t ? '' : (t.name || [t.firstName, t.lastName].filter(Boolean).join(' ') || t.email || `Teacher #${t.id}`)
