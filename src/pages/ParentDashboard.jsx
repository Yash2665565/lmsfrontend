import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../app/axios'
import StatCard from '../components/ui/StatCard'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../auth/AuthContext'
import { IconChart, IconCheck, IconX, IconNotice, IconCalendar, IconChevronR } from '../components/ui/Icons'

const GRID_CSS = `
  .par-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
  .par-two   { display:grid; grid-template-columns:1fr 1fr;       gap:22px; }
  @media(max-width:900px){
    .par-stats { grid-template-columns:repeat(2,1fr) !important; }
    .par-two   { grid-template-columns:1fr !important; }
  }
  @media(max-width:480px){ .par-stats { grid-template-columns:1fr !important; } }
`

function AttendanceBar({ pct }) {
  const good = pct >= 75, warn = pct >= 60 && pct < 75
  const bar = good ? 'var(--success)' : warn ? 'var(--brass)' : 'var(--danger)'
  const txt = good ? 'var(--success)' : warn ? '#8a5e2a' : 'var(--danger)'
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Overall attendance</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: txt, fontFamily: "'Fraunces', Georgia, serif" }}>{pct}%</span>
      </div>
      <div style={{ height: 9, background: 'var(--canvas-sunk)', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: bar, borderRadius: 5, transition: 'width 0.5s' }} />
      </div>
      <p style={{ fontSize: 12, marginTop: 9, fontWeight: 500, color: txt }}>
        {good ? "Your child's attendance is in good standing."
          : warn ? 'Attendance is below the 75% required threshold.'
          : 'Critical: attendance is very low. Please contact the school.'}
      </p>
    </div>
  )
}

function NoticeItem({ notice }) {
  const title = notice.name ?? notice.title ?? 'Untitled'
  const mandatory = notice.mandatory === 1 || notice.mandatory === true
  const date = notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : notice.date ?? ''
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '11px 0', borderBottom: '1px solid var(--line-2)' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: mandatory ? 'var(--danger)' : 'var(--brass)', flexShrink: 0, marginTop: 6 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
          {mandatory && <span className="badge badge-red" style={{ flexShrink: 0 }}>Required</span>}
        </div>
        {date && <p style={{ fontSize: 11.5, color: 'var(--faint)', margin: '2px 0 0' }}>{date}</p>}
      </div>
    </div>
  )
}

export default function ParentDashboard() {
  const { user } = useAuth()

  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['parent-me'],
    queryFn: () => api.get('/me').then(r => r.data.data),
  })

  const studentId = meData?.studentId ?? meData?.student?.id ?? meData?.children?.[0]?.id ?? meData?.guardianOf?.[0]?.id ?? null
  const studentName = meData?.studentName ?? meData?.student?.name ?? meData?.children?.[0]?.name ?? meData?.guardianOf?.[0]?.name ?? null

  const { data: attendanceSummaryData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['parent-attendance-summary', studentId],
    queryFn: () => api.get(`/students/${studentId}/attendance-summary`).then(r => r.data.data),
    enabled: !!studentId,
  })

  const { data: notices, isLoading: noticesLoading } = useQuery({
    queryKey: ['parent-notices'],
    queryFn: () => api.get('/notices').then(r => r.data.data),
  })

  const summary = Array.isArray(attendanceSummaryData) ? attendanceSummaryData[attendanceSummaryData.length - 1] : attendanceSummaryData
  const presentDays = summary?.presentDays ?? summary?.present ?? null
  const absentDays  = summary?.absentDays  ?? summary?.absent  ?? null
  const totalDays   = summary?.totalDays   ?? summary?.total   ?? null
  const attendancePct =
    summary?.attendancePercentage ?? summary?.percentage ??
    (presentDays !== null && totalDays ? Math.round((presentDays / totalDays) * 100) : null)

  const recentNotices = Array.isArray(notices) ? notices.slice(0, 3) : []
  const noticeCount   = Array.isArray(notices) ? notices.length : null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (meLoading) return <div className="page"><Spinner /></div>

  const miniStats = [
    { label: 'Present', value: presentDays, bg: 'var(--success-tint)', color: 'var(--success)' },
    { label: 'Absent',  value: absentDays,  bg: 'var(--danger-tint)',  color: 'var(--danger)' },
    { label: 'Total',   value: totalDays,   bg: 'var(--canvas-sunk)',  color: 'var(--ink-2)' },
  ]

  return (
    <div className="page">
      <style>{GRID_CSS}</style>

      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p className="eyebrow" style={{ margin: '0 0 7px' }}>{greeting}</p>
          <h1 className="display" style={{ fontSize: 30, margin: 0 }}>{user?.name ?? 'Parent'}</h1>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <IconCalendar size={13} color="var(--muted)" />
          <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>{todayLabel}</span>
        </div>
      </div>

      {/* Child banner */}
      {(studentName || studentId) && (
        <div style={{ marginBottom: 26, display: 'flex', alignItems: 'center', gap: 15, padding: '15px 18px', background: 'var(--accent-tint)', border: '1px solid var(--accent-line)', borderRadius: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: '#fff', border: '1px solid var(--accent-line)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, fontSize: 19, flexShrink: 0 }}>
            {studentName ? studentName.charAt(0).toUpperCase() : '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{studentName ?? `Student #${studentId}`}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>
              {summary?.className ?? summary?.sectionName ?? 'Your child'}{summary?.termName ? ` — ${summary.termName}` : ''}
            </p>
          </div>
          <Link to="/parent/report" className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto', textDecoration: 'none' }}>
            Report card <IconChevronR size={13} />
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="par-stats" style={{ marginBottom: 26 }}>
        <StatCard label="Attendance" value={attendanceLoading ? null : (attendancePct !== null ? `${attendancePct}%` : '—')} Icon={IconChart}
          color={attendancePct === null ? 'green' : attendancePct >= 75 ? 'green' : attendancePct >= 60 ? 'amber' : 'red'} sub="this term" />
        <StatCard label="Present Days" value={attendanceLoading ? null : (presentDays ?? '—')} Icon={IconCheck} color="teal" />
        <StatCard label="Absent Days"  value={attendanceLoading ? null : (absentDays ?? '—')}  Icon={IconX}     color="red" />
        <StatCard label="Notices"      value={noticesLoading ? null : noticeCount} Icon={IconNotice} color="brass" sub="from school" />
      </div>

      {/* Two column */}
      <div className="par-two">
        {/* Attendance overview */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className="card-title">Attendance Overview</h2>
            <Link to="/parent/attendance" style={{ fontSize: 12.5, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Full report</Link>
          </div>
          <div style={{ padding: 22 }}>
            {attendanceLoading ? <Spinner /> : !studentId ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--faint)', margin: 0 }}>No child linked to this account.</p>
                <p style={{ fontSize: 12, color: 'var(--faint)', margin: '4px 0 0' }}>Contact the school admin to link your child's profile.</p>
              </div>
            ) : attendancePct === null ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--faint)', margin: 0 }}>No attendance data available yet.</p>
              </div>
            ) : (
              <>
                <AttendanceBar pct={attendancePct} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 11, marginTop: 18 }}>
                  {miniStats.map(stat => (
                    <div key={stat.label} style={{ borderRadius: 10, padding: '13px 10px', textAlign: 'center', background: stat.bg }}>
                      <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 21, fontWeight: 600, color: stat.color, margin: 0 }}>{stat.value ?? '—'}</p>
                      <p style={{ fontSize: 11.5, fontWeight: 500, color: stat.color, margin: '3px 0 0' }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
                {summary?.termName && <p style={{ fontSize: 11.5, color: 'var(--faint)', textAlign: 'center', marginTop: 14 }}>Term: {summary.termName}</p>}
              </>
            )}
          </div>
        </div>

        {/* Notices */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className="card-title">Latest Notices</h2>
            <Link to="/parent/notices" style={{ fontSize: 12.5, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>View all</Link>
          </div>
          <div style={{ flex: 1, padding: '4px 22px 10px' }}>
            {noticesLoading ? <Spinner /> : recentNotices.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--faint)', textAlign: 'center', padding: '34px 0' }}>No notices yet</p>
            ) : recentNotices.map(notice => <NoticeItem key={notice.id} notice={notice} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
