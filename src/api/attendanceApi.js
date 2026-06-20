import api from '../app/axios'

export const attendanceApi = {
  getDailyRegister: (sectionId, date) =>
    api.get('/sections/' + sectionId + '/attendance', { params: { date } }).then(r => r.data.data),
  submit: (sectionId, data) =>
    api.post('/sections/' + sectionId + '/attendance', data).then(r => r.data.data),
  getStudentSummary: (studentId) =>
    api.get('/students/' + studentId + '/attendance-summary').then(r => r.data.data),
  getLowAttendance: (termId, threshold) =>
    api.get('/reports/attendance/low', { params: { termId, threshold } }).then(r => r.data.data),
  getDailyAbsentees: (date) =>
    api.get('/reports/attendance/daily', { params: { date } }).then(r => r.data.data),
}
