import api from '../app/axios'

export const lmsApi = {
  // Courses (scoped subjects) — student: own class; teacher/admin: by section
  getCourses:      (sectionId)          => api.get('/lms/courses', { params: sectionId ? { sectionId } : {} }).then(r => r.data.data ?? []),
  // Classes & sections the current teacher is allocated to (for the teacher's filter)
  getMySections:   ()                   => api.get('/lms/my-sections').then(r => r.data.data ?? []),

  // Units
  getUnits:        (subjectId)          => api.get(`/subjects/${subjectId}/units`).then(r => r.data.data ?? []),
  createUnit:      (subjectId, body)    => api.post(`/subjects/${subjectId}/units`, body).then(r => r.data.data),
  updateUnit:      (unitId, body)       => api.put(`/units/${unitId}`, body).then(r => r.data.data),
  deleteUnit:      (unitId)             => api.delete(`/units/${unitId}`),

  // Notes
  getNotes:        (unitId)             => api.get(`/units/${unitId}/notes`).then(r => r.data.data ?? []),
  createNote:      (unitId, body)       => api.post(`/units/${unitId}/notes`, body).then(r => r.data.data),
  deleteNote:      (noteId)             => api.delete(`/notes/${noteId}`),

  // Assignments
  getAssignments:  (unitId, studentId)  => api.get(`/units/${unitId}/assignments`, { params: studentId ? { studentId } : {} }).then(r => r.data.data ?? []),
  createAssignment:(unitId, body)       => api.post(`/units/${unitId}/assignments`, body).then(r => r.data.data),
  deleteAssignment:(assignmentId)       => api.delete(`/assignments/${assignmentId}`),

  // Submissions
  submit:          (assignmentId, body) => api.post(`/assignments/${assignmentId}/submit`, body).then(r => r.data.data),
  getMySubmission: (assignmentId, studentId) => api.get(`/assignments/${assignmentId}/my-submission`, { params: { studentId } }).then(r => r.data.data),
  listSubmissions: (assignmentId)       => api.get(`/assignments/${assignmentId}/submissions`).then(r => r.data.data ?? []),
  gradeSubmission: (submissionId, body) => api.patch(`/submissions/${submissionId}/grade`, body).then(r => r.data.data),

  // Surprise Tests
  getSurpriseTests:    (unitId)         => api.get(`/units/${unitId}/surprise-tests`).then(r => r.data.data ?? []),
  createSurpriseTest:  (unitId, body)   => api.post(`/units/${unitId}/surprise-tests`, body).then(r => r.data.data),
  updateSurpriseTest:  (testId, body)   => api.put(`/surprise-tests/${testId}`, body).then(r => r.data.data),
  deleteSurpriseTest:  (testId)         => api.delete(`/surprise-tests/${testId}`),

  // Stats
  getStudentStats: (studentId)          => api.get(`/students/${studentId}/lms-stats`).then(r => r.data.data),
}
