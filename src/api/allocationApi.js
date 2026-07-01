import api from '../app/axios'

export const allocationApi = {
  getSectionSubjects: (sid) => api.get(`/sections/${sid}/subject-teachers`).then(r => r.data.data ?? []),
  assign:             (b)   => api.post('/subject-teachers', b),
  unassign:           (id)  => api.delete(`/subject-teachers/${id}`),
  getTeacherReport:   (tid) => api.get(`/teachers/${tid}/allocation`).then(r => r.data.data),
  getSections:        ()    => api.get('/sections').then(r => r.data.data ?? []),
  getTeachers:        ()    => api.get('/teachers').then(r => r.data.data ?? []),
  getSubjects:        ()    => api.get('/subjects').then(r => r.data.data ?? []),

  // teacher subject expertise
  getExpertise:       (tid) => api.get(`/teachers/${tid}/subjects`).then(r => r.data.data ?? []),
  setExpertise:       (tid, subjectIds) => api.put(`/teachers/${tid}/subjects`, { subjectIds }),
  teachersForSubject: (topicId) => api.get(`/subjects/${topicId}/teachers`).then(r => r.data.data ?? []),

  // class ↔ subject mapping
  addClassSubject:    (classGradeId, subjectId) => api.post(`/classes/${classGradeId}/subjects`, { subjectId }),
  removeClassSubject: (classGradeId, subjectId) => api.delete(`/classes/${classGradeId}/subjects/${subjectId}`),
}

export const teacherLabel = (t) =>
  !t ? '' : (t.name || [t.firstName, t.lastName].filter(Boolean).join(' ') || t.email || `Teacher #${t.id}`)

export const sectionLabel = (s) =>
  s ? `${s.classGrade?.name ?? s.className ?? 'Class'} — ${s.name}` : ''
