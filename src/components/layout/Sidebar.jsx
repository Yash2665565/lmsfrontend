import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

const NavItem = ({ to, icon, label }) => (
  <NavLink to={to} className={({ isActive }) =>
    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ' +
    (isActive
      ? 'bg-indigo-600 text-white'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white')
  }>
    <span className="text-base">{icon}</span>
    <span>{label}</span>
  </NavLink>
)

const NavSection = ({ title, children }) => (
  <div className="mb-4">
    <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
    <div className="space-y-0.5">{children}</div>
  </div>
)

export default function Sidebar() {
  const { user, isAdmin, isTeacher, isStudent, isParent, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="w-60 bg-slate-900 flex flex-col h-full flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">School SMS</p>
            <p className="text-slate-500 text-xs mt-0.5">Management System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {isAdmin() && (
          <>
            <NavSection title="Overview">
              <NavItem to="/admin" icon="⊞" label="Dashboard" />
            </NavSection>
            <NavSection title="People">
              <NavItem to="/admin/students" icon="👤" label="Students" />
              <NavItem to="/admin/teachers" icon="🎓" label="Teachers" />
              <NavItem to="/admin/enrollment" icon="📋" label="Enrollment" />
            </NavSection>
            <NavSection title="Academics">
              <NavItem to="/admin/academics" icon="🏫" label="Classes & Subjects" />
              <NavItem to="/admin/timetable" icon="📅" label="Timetable" />
              <NavItem to="/admin/exams" icon="📝" label="Exams & Marks" />
            </NavSection>
            <NavSection title="Attendance">
              <NavItem to="/admin/attendance" icon="✅" label="Mark Attendance" />
              <NavItem to="/admin/reports/attendance" icon="📊" label="Reports" />
            </NavSection>
            <NavSection title="Communication">
              <NavItem to="/admin/notices" icon="📢" label="Notices" />
            </NavSection>
          </>
        )}

        {isTeacher() && !isAdmin() && (
          <>
            <NavSection title="Overview">
              <NavItem to="/teacher" icon="⊞" label="Dashboard" />
            </NavSection>
            <NavSection title="Teaching">
              <NavItem to="/teacher/attendance" icon="✅" label="Mark Attendance" />
              <NavItem to="/teacher/marks" icon="📝" label="Enter Marks" />
              <NavItem to="/teacher/timetable" icon="📅" label="My Timetable" />
            </NavSection>
            <NavSection title="Reports">
              <NavItem to="/teacher/reports" icon="📊" label="Attendance Report" />
            </NavSection>
            <NavSection title="Communication">
              <NavItem to="/teacher/notices" icon="📢" label="Notices" />
            </NavSection>
          </>
        )}

        {isStudent() && (
          <>
            <NavSection title="Overview">
              <NavItem to="/student" icon="⊞" label="Dashboard" />
            </NavSection>
            <NavSection title="My Academics">
              <NavItem to="/student/timetable" icon="📅" label="Timetable" />
              <NavItem to="/student/attendance" icon="✅" label="My Attendance" />
              <NavItem to="/student/marks" icon="📊" label="My Marks" />
              <NavItem to="/student/lessons" icon="📚" label="Lessons" />
            </NavSection>
            <NavSection title="Communication">
              <NavItem to="/student/notices" icon="📢" label="Notices" />
            </NavSection>
          </>
        )}

        {isParent() && (
          <>
            <NavSection title="Overview">
              <NavItem to="/parent" icon="⊞" label="Dashboard" />
            </NavSection>
            <NavSection title="My Child">
              <NavItem to="/parent/attendance" icon="✅" label="Attendance" />
              <NavItem to="/parent/report" icon="📊" label="Report Card" />
            </NavSection>
            <NavSection title="Communication">
              <NavItem to="/parent/notices" icon="📢" label="Notices" />
            </NavSection>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg mb-1">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.name}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-sm transition-all">
          <span>↩</span> Sign out
        </button>
      </div>
    </div>
  )
}
