import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../app/axios'
import StatCard from '../components/ui/StatCard'
import PageHeader from '../components/ui/PageHeader'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../auth/AuthContext'

function AttendanceBar({ pct }) {
  const color =
    pct >= 75 ? { bar: '#10b981', label: 'text-emerald-600', bg: 'bg-emerald-50' } :
    pct >= 60 ? { bar: '#f59e0b', label: 'text-amber-600', bg: 'bg-amber-50' } :
                { bar: '#ef4444', label: 'text-red-600', bg: 'bg-red-50' }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-600">Overall attendance</span>
        <span className={`text-sm font-bold ${color.label}`}>{pct}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%`, background: color.bar }}
        />
      </div>
      <p className={`text-xs mt-2 font-medium ${color.label}`}>
        {pct >= 75
          ? 'Attendance is in good standing.'
          : pct >= 60
          ? 'Attendance is below the 75% threshold — act now.'
          : 'Critical: attendance is very low. Contact your class teacher.'}
      </p>
    </div>
  )
}

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

export default function StudentDashboard() {
  const { user } = useAuth()

  // Get current user profile to find student ID
  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['student-me'],
    queryFn: () => api.get('/me').then(r => r.data.data),
  })

  const studentId = meData?.studentId ?? meData?.id ?? user?.studentId ?? null

  const { data: attendanceSummaryData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['student-attendance-summary', studentId],
    queryFn: () =>
      api.get(`/students/${studentId}/attendance-summary`).then(r => r.data.data),
    enabled: !!studentId,
  })

  const { data: notices, isLoading: noticesLoading } = useQuery({
    queryKey: ['student-notices'],
    queryFn: () => api.get('/notices').then(r => r.data.data),
  })

  // Resolve summary — may be array of terms or single object
  const summary = Array.isArray(attendanceSummaryData)
    ? attendanceSummaryData[attendanceSummaryData.length - 1] // latest term
    : attendanceSummaryData

  const presentDays  = summary?.presentDays  ?? summary?.present  ?? null
  const absentDays   = summary?.absentDays   ?? summary?.absent   ?? null
  const totalDays    = summary?.totalDays    ?? summary?.total    ?? null
  const attendancePct =
    summary?.attendancePercentage ??
    summary?.percentage ??
    (presentDays !== null && totalDays ? Math.round((presentDays / totalDays) * 100) : null)

  const recentNotices = Array.isArray(notices) ? notices.slice(0, 3) : []
  const noticeCount   = Array.isArray(notices) ? notices.length : null

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  if (meLoading) {
    return (
      <div className="page">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader
        title="My Dashboard"
        subtitle={`${user?.name ?? 'Student'} — ${todayFormatted}`}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Attendance"
          value={attendanceLoading ? null : (attendancePct !== null ? `${attendancePct}%` : '—')}
          icon="📊"
          color={
            attendancePct === null ? 'indigo' :
            attendancePct >= 75 ? 'green' :
            attendancePct >= 60 ? 'amber' : 'red'
          }
          sub="this term"
        />
        <StatCard
          label="Present Days"
          value={attendanceLoading ? null : (presentDays ?? '—')}
          icon="✅"
          color="green"
        />
        <StatCard
          label="Absent Days"
          value={attendanceLoading ? null : (absentDays ?? '—')}
          icon="❌"
          color="red"
        />
        <StatCard
          label="Notices"
          value={noticesLoading ? null : noticeCount}
          icon="📢"
          color="amber"
          sub="school-wide"
        />
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance overview */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-800">Attendance Overview</h2>
            <Link
              to="/student/attendance"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Full report →
            </Link>
          </div>

          {attendanceLoading ? (
            <Spinner />
          ) : attendancePct === null ? (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-400">No attendance data available yet.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <AttendanceBar pct={attendancePct} />

              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { label: 'Present', value: presentDays, color: 'bg-emerald-50 text-emerald-700' },
                  { label: 'Absent',  value: absentDays,  color: 'bg-red-50 text-red-700' },
                  { label: 'Total',   value: totalDays,   color: 'bg-slate-50 text-slate-700' },
                ].map(stat => (
                  <div key={stat.label} className={`rounded-lg p-3 text-center ${stat.color}`}>
                    <p className="text-xl font-bold">{stat.value ?? '—'}</p>
                    <p className="text-xs font-medium mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {summary?.termName && (
                <p className="text-xs text-slate-400 text-center">
                  Term: {summary.termName}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Notices */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">Notices</h2>
            <Link
              to="/student/notices"
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
