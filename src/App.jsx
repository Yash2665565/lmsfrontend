import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import PortalPage from './pages/PortalPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import AdminDashboard from './pages/AdminDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import ParentDashboard from './pages/ParentDashboard'
import StudentsPage from './features/students/StudentsPage'
import TeachersPage from './features/teachers/TeachersPage'
import AttendancePage from './features/attendance/AttendancePage'
import AttendanceReport from './features/attendance/AttendanceReport'
import AcademicsPage from './features/academics/AcademicsPage'
import EnrollmentPage from './features/academics/EnrollmentPage'
import ExamsPage from './features/exams/ExamsPage'
import ReportCardPage from './features/exams/ReportCardPage'
import MarksEntryPage from './features/marks/MarksEntryPage'
import NoticesPage from './features/notices/NoticesPage'
import TimetablePage from './features/timetable/TimetablePage'
import LessonsPage from './features/content/LessonsPage'
import TransportPage from './features/transport/TransportPage'
import StudentTransportPage from './features/transport/StudentTransportPage'
import FeesPage from './features/fees/FeesPage'
import StudentFeesPage from './features/fees/StudentFeesPage'
import InventoryPage from './features/inventory/InventoryPage'
import LmsDashboard from './lms/LmsDashboard'
import LmsCoursesPage from './lms/LmsCoursesPage'
import LmsCourseDetail from './lms/LmsCourseDetail'
import LmsUnitDetail from './lms/LmsUnitDetail'
import LmsLayout from './components/layout/LmsLayout'

const ADMIN = ['ADMIN','SUPER_ADMIN']
const TEACHER = ['CLASS_TEACHER','SUBJECT_TEACHER']
const ADMIN_TEACHER = [...ADMIN, ...TEACHER]

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={ADMIN}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute roles={ADMIN}><Layout><StudentsPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/teachers" element={<ProtectedRoute roles={ADMIN}><Layout><TeachersPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/academics" element={<ProtectedRoute roles={ADMIN}><Layout><AcademicsPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/enrollment" element={<ProtectedRoute roles={ADMIN}><Layout><EnrollmentPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/exams" element={<ProtectedRoute roles={ADMIN}><Layout><ExamsPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/attendance" element={<ProtectedRoute roles={ADMIN_TEACHER}><Layout><AttendancePage /></Layout></ProtectedRoute>} />
      <Route path="/admin/reports/attendance" element={<ProtectedRoute roles={ADMIN_TEACHER}><Layout><AttendanceReport /></Layout></ProtectedRoute>} />
      <Route path="/admin/notices" element={<ProtectedRoute roles={ADMIN}><Layout><NoticesPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/timetable" element={<ProtectedRoute roles={ADMIN}><Layout><TimetablePage /></Layout></ProtectedRoute>} />
      <Route path="/admin/transport" element={<ProtectedRoute roles={ADMIN}><Layout><TransportPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/fees" element={<ProtectedRoute roles={ADMIN}><Layout><FeesPage /></Layout></ProtectedRoute>} />
      <Route path="/admin/inventory" element={<ProtectedRoute roles={ADMIN}><Layout><InventoryPage /></Layout></ProtectedRoute>} />

      {/* Teacher routes */}
      <Route path="/teacher" element={<ProtectedRoute roles={TEACHER}><Layout><TeacherDashboard /></Layout></ProtectedRoute>} />
      <Route path="/teacher/attendance" element={<ProtectedRoute roles={ADMIN_TEACHER}><Layout><AttendancePage /></Layout></ProtectedRoute>} />
      <Route path="/teacher/marks" element={<ProtectedRoute roles={[...TEACHER, ...ADMIN]}><Layout><MarksEntryPage /></Layout></ProtectedRoute>} />
      <Route path="/teacher/timetable" element={<ProtectedRoute roles={TEACHER}><Layout><TimetablePage /></Layout></ProtectedRoute>} />
      <Route path="/teacher/notices" element={<ProtectedRoute roles={TEACHER}><Layout><NoticesPage /></Layout></ProtectedRoute>} />
      <Route path="/teacher/reports" element={<ProtectedRoute roles={ADMIN_TEACHER}><Layout><AttendanceReport /></Layout></ProtectedRoute>} />

      {/* Student routes */}
      <Route path="/student" element={<ProtectedRoute roles={['STUDENT']}><Layout><StudentDashboard /></Layout></ProtectedRoute>} />
      <Route path="/student/timetable" element={<ProtectedRoute roles={['STUDENT']}><Layout><TimetablePage /></Layout></ProtectedRoute>} />
      <Route path="/student/attendance" element={<ProtectedRoute roles={['STUDENT']}><Layout><AttendanceReport /></Layout></ProtectedRoute>} />
      <Route path="/student/marks" element={<ProtectedRoute roles={['STUDENT']}><Layout><ReportCardPage /></Layout></ProtectedRoute>} />
      <Route path="/student/transport" element={<ProtectedRoute roles={['STUDENT']}><Layout><StudentTransportPage /></Layout></ProtectedRoute>} />
      <Route path="/student/fees" element={<ProtectedRoute roles={['STUDENT']}><Layout><StudentFeesPage /></Layout></ProtectedRoute>} />
      <Route path="/student/lessons" element={<ProtectedRoute roles={['STUDENT']}><Layout><LessonsPage /></Layout></ProtectedRoute>} />
      <Route path="/student/notices" element={<ProtectedRoute roles={['STUDENT']}><Layout><NoticesPage /></Layout></ProtectedRoute>} />
      {/* LMS routes — use LmsLayout (top navbar, no sidebar) */}
      <Route path="/student/lms" element={<ProtectedRoute roles={['STUDENT','CLASS_TEACHER','SUBJECT_TEACHER','ADMIN','SUPER_ADMIN']}><LmsLayout><LmsDashboard /></LmsLayout></ProtectedRoute>} />
      <Route path="/student/lms/courses" element={<ProtectedRoute roles={['STUDENT','CLASS_TEACHER','SUBJECT_TEACHER','ADMIN','SUPER_ADMIN']}><LmsLayout><LmsCoursesPage /></LmsLayout></ProtectedRoute>} />
      <Route path="/student/lms/courses/:subjectId" element={<ProtectedRoute roles={['STUDENT','CLASS_TEACHER','SUBJECT_TEACHER','ADMIN','SUPER_ADMIN']}><LmsLayout><LmsCourseDetail /></LmsLayout></ProtectedRoute>} />
      <Route path="/student/lms/courses/:subjectId/units/:unitId" element={<ProtectedRoute roles={['STUDENT','CLASS_TEACHER','SUBJECT_TEACHER','ADMIN','SUPER_ADMIN']}><LmsLayout><LmsUnitDetail /></LmsLayout></ProtectedRoute>} />

      {/* Parent routes */}
      <Route path="/parent" element={<ProtectedRoute roles={['PARENT']}><Layout><ParentDashboard /></Layout></ProtectedRoute>} />
      <Route path="/parent/report" element={<ProtectedRoute roles={['PARENT']}><Layout><ReportCardPage /></Layout></ProtectedRoute>} />
      <Route path="/parent/attendance" element={<ProtectedRoute roles={['PARENT']}><Layout><AttendanceReport /></Layout></ProtectedRoute>} />
      <Route path="/parent/notices" element={<ProtectedRoute roles={['PARENT']}><Layout><NoticesPage /></Layout></ProtectedRoute>} />

      <Route path="/" element={<PortalPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
