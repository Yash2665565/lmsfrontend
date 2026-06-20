import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../app/axios'
import StatCard from '../components/ui/StatCard'
import PageHeader from '../components/ui/PageHeader'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../auth/AuthContext'

const QUICK_ACTIONS = [
  { to: '/teacher/attendance', icon: '✅', label: 'Mark Attendance', desc: 'Record today\'s register', color: 'green' },
  { to: '/teacher/marks', icon: '📝', label: 'Enter Marks', desc: 'Post exam scores', color: 'indigo' },
  { to: '/teacher/timetable', icon: '🗓️', label: 'View Timetable', desc: 'Your weekly schedule', color: 'blue' },
  { to: '/teacher/reports', icon: '📊', label: 'Attendance Reports', desc: 'Analytics & summaries', color: 'amber' },
]

function NoticeItem({ notice }) {
  const title = notice.name ?? notice.title ?? 'Untitled'
  const mandatory = notice.mandatory === 1 || notice.mandatory === true
  const date = notice.createdAt
    ? new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : notice.date ?? ''

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-800 leading-snug">{title}</p>
          {mandatory && <span className="badge badge-red flex-shrink-0">Required</span>}
        </div>
        {date && <p className="text-xs text-slate-400 mt-0.5">{date}</p>}
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function TeacherDashboard() {
  const { user } = useAuth()

  const today = new Date()
  const todayFormatted = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
    queryKey: ['teacher-sections'],
    queryFn: () => api.get('/sections').then(r => r.data.data),
  })

  const { data: notices, isLoading: noticesLoading } = useQuery({
    queryKey: ['teacher-notices-recent'],
    queryFn: () => api.get('/notices').then(r => r.data.data),
  })

  const sections = Array.isArray(sectionsData) ? sectionsData : []
  const recentNotices = Array.isArray(notices) ? notices.slice(0, 3) : []
  const noticeCount = Array.isArray(notices) ? notices.length : null

  if (sectionsLoading) {
    return (
      <div className="page">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader
        title={`${getGreeting()}, ${user?.name?.split(' ')[0] ?? 'Teacher'}`}
        subtitle={todayFormatted}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="My Sections"
          value={sections.length}
          icon="🏫"
          color="indigo"
          sub="assigned to you"
        />
        <StatCard
          label="Today"
          value={today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          icon="📅"
          color="blue"
          sub={today.toLocaleDateString('en-IN', { weekday: 'long' })}
        />
        <StatCard
          label="Notices"
          value={noticesLoading ? null : noticeCount}
          icon="📢"
          color="amber"
          sub="school announcements"
        />
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(action => (
              <Link
                key={action.to}
                to={action.to}
                className="group flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
              >
                <span
                  className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                    action.color === 'green'  ? 'bg-green-50' :
                    action.color === 'blue'   ? 'bg-blue-50'  :
                    action.color === 'amber'  ? 'bg-amber-50' : 'bg-indigo-50'
                  }`}
                >
                  {action.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Sections list */}
          {sections.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Assigned Sections
              </p>
              <div className="space-y-2">
                {sections.map(section => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      {section.classGrade?.name ?? section.className ?? 'Class'} — {section.name}
                    </p>
                    <span className="badge badge-blue">
                      {section.studentCount ?? '—'} students
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Notices */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">Recent Notices</h2>
            <Link
              to="/teacher/notices"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all →
            </Link>
          </div>

          {noticesLoading ? (
            <Spinner />
          ) : recentNotices.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No notices yet.</p>
          ) : (
            <div>
              {recentNotices.map(notice => (
                <NoticeItem key={notice.id} notice={notice} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
