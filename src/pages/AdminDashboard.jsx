import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../app/axios'
import StatCard from '../components/ui/StatCard'
import PageHeader from '../components/ui/PageHeader'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../auth/AuthContext'

const QUICK_ACTIONS = [
  {
    to: '/admin/students',
    icon: '👤',
    label: 'Add Student',
    desc: 'Enrol a new student',
    accent: '#4f46e5',
  },
  {
    to: '/admin/attendance',
    icon: '📋',
    label: 'Mark Attendance',
    desc: 'Record today\'s register',
    accent: '#0ea5e9',
  },
  {
    to: '/teacher/marks',
    icon: '📝',
    label: 'Enter Marks',
    desc: 'Post exam scores',
    accent: '#8b5cf6',
  },
  {
    to: '/admin/reports/attendance',
    icon: '📊',
    label: 'View Reports',
    desc: 'Attendance analytics',
    accent: '#10b981',
  },
  {
    to: '/admin/academics',
    icon: '🏫',
    label: 'Manage Classes',
    desc: 'Years, terms, subjects',
    accent: '#f59e0b',
  },
  {
    to: '/admin/notices',
    icon: '📢',
    label: 'Post Notice',
    desc: 'Announce to school',
    accent: '#ef4444',
  },
]

function QuickActionCard({ to, icon, label, desc, accent }) {
  return (
    <Link
      to={to}
      className="group relative flex items-start gap-3 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-200 transition-all"
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5"
        style={{ background: accent }}
      />
      <div className="pl-5 pr-4 py-4 flex items-start gap-3 w-full">
        <span
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg"
          style={{ background: accent + '18' }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
            {label}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{desc}</p>
        </div>
      </div>
    </Link>
  )
}

function NoticeItem({ notice }) {
  const title = notice.name ?? notice.title ?? 'Untitled'
  const date = notice.createdAt
    ? new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : notice.date ?? ''
  const mandatory = notice.mandatory === 1 || notice.mandatory === true

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="flex-shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-800 leading-snug">{title}</p>
          {mandatory && (
            <span className="badge badge-red flex-shrink-0">Required</span>
          )}
        </div>
        {date && <p className="text-xs text-slate-400 mt-0.5">{date}</p>}
        {notice.content && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{notice.content}</p>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['admin-students-count'],
    queryFn: () => api.get('/students', { params: { page: 0, size: 1 } }).then(r => r.data),
  })

  const { data: teachersData, isLoading: teachersLoading } = useQuery({
    queryKey: ['admin-teachers-count'],
    queryFn: () => api.get('/teachers').then(r => r.data.data),
  })

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['admin-classes'],
    queryFn: () => api.get('/classes').then(r => r.data.data),
  })

  const { data: notices, isLoading: noticesLoading } = useQuery({
    queryKey: ['admin-notices-recent'],
    queryFn: () => api.get('/notices').then(r => r.data.data),
  })

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then(r => r.data.data),
  })

  // Resolve counts — API may return paginated or array
  const totalStudents =
    studentsData?.data?.totalElements ??
    studentsData?.totalElements ??
    (Array.isArray(studentsData) ? studentsData.length : null)

  const totalTeachers = Array.isArray(teachersData)
    ? teachersData.length
    : (teachersData?.totalElements ?? null)

  const activeClasses = Array.isArray(classesData)
    ? classesData.length
    : (classesData?.totalElements ?? null)

  const recentNotices = Array.isArray(notices) ? notices.slice(0, 5) : []
  const noticeCount = Array.isArray(notices) ? notices.length : null

  const currentYear = Array.isArray(academicYears)
    ? academicYears.find(y => y.current || y.active || y.isCurrent) ?? academicYears[0]
    : null

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name ?? 'Administrator'} — ${todayFormatted}`}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Students"
          value={studentsLoading ? null : totalStudents}
          icon="👤"
          color="indigo"
          sub={currentYear ? `Academic year ${currentYear.name ?? currentYear.year}` : undefined}
        />
        <StatCard
          label="Total Teachers"
          value={teachersLoading ? null : totalTeachers}
          icon="🎓"
          color="green"
        />
        <StatCard
          label="Active Classes"
          value={classesLoading ? null : activeClasses}
          icon="🏫"
          color="blue"
        />
        <StatCard
          label="Notices Posted"
          value={noticesLoading ? null : noticeCount}
          icon="📢"
          color="amber"
        />
      </div>

      {/* Lower two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notices */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">Recent Notices</h2>
            <Link
              to="/admin/notices"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all →
            </Link>
          </div>

          {noticesLoading ? (
            <Spinner />
          ) : recentNotices.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">No notices posted yet.</p>
              <Link to="/admin/notices" className="btn-primary mt-3 text-xs">
                Post the first notice →
              </Link>
            </div>
          ) : (
            <div>
              {recentNotices.map(notice => (
                <NoticeItem key={notice.id} notice={notice} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(action => (
              <QuickActionCard key={action.to} {...action} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
