import api from '../app/axios'

export const examsApi = {
  listByTerm: (termId) => api.get('/exams', { params: { termId } }).then(r => r.data.data),
  create: (data) => api.post('/exams', data).then(r => r.data.data),
  getSubjects: (examId) => api.get('/exams/' + examId + '/subjects').then(r => r.data.data),
  addSubject: (examId, data) => api.post('/exams/' + examId + '/subjects', data).then(r => r.data.data),
  getMarks: (examSubjectId) => api.get('/exam-subjects/' + examSubjectId + '/marks').then(r => r.data.data),
  enterMark: (examSubjectId, data) =>
    api.post('/exam-subjects/' + examSubjectId + '/marks', data).then(r => r.data.data),
  getReportCard: (studentId, termId) =>
    api.get('/students/' + studentId + '/report-card', { params: { termId } }).then(r => r.data.data),
}
