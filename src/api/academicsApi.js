import api from '../app/axios'

export const academicsApi = {
  listYears: () => api.get('/academic-years').then(r => r.data.data),
  createYear: (data) => api.post('/academic-years', data).then(r => r.data.data),
  listTerms: (yearId) => api.get('/terms', { params: { yearId } }).then(r => r.data.data),
  createTerm: (data) => api.post('/terms', data).then(r => r.data.data),
  listClasses: () => api.get('/classes').then(r => r.data.data),
  createClass: (data) => api.post('/classes', data).then(r => r.data.data),
  listSections: (classGradeId) => api.get('/sections', { params: { classGradeId } }).then(r => r.data.data),
  createSection: (data) => api.post('/sections', data).then(r => r.data.data),
  listSubjects: () => api.get('/subjects').then(r => r.data.data),
  createSubject: (data) => api.post('/subjects', data).then(r => r.data.data),
  listEnrollments: (sectionId, academicYearId) =>
    api.get('/sections/' + sectionId + '/enrollments', { params: { academicYearId } }).then(r => r.data.data),
  enroll: (data) => api.post('/enrollments', data).then(r => r.data.data),
}
