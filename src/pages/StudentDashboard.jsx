import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import api from '../app/axios'
import Spinner from '../components/ui/Spinner'
import {
  IconClipboard, IconChart, IconCalendar, IconNotice,
  IconBookOpen, IconChevronR,
} from '../components/ui/Icons'

const GRID_CSS = `
  .std-quick-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:14px; }
  .std-main-grid  { display:grid; grid-template-columns:1fr 1fr 1fr;   gap:22px; }
  @media(max-width:1024px){ .std-main-grid { grid-template-columns:1fr 1fr !important; } }
  @media(max-width:720px) {
    .std-quick-grid { grid-template-columns:repeat(3,1fr) !important; }
    .std-main-grid  { grid-template-columns:1fr !important; }
  }
  @media(max-width:480px) { .std-quick-grid { grid-template-columns:repeat(2,1fr) !important; } }
  .std-qa-tile:hover { box-shadow:0 4px 14px rgba(64,52,28,0.10) !important; transform:translateY(-1px); border-color:#d6cab2 !important; }
  .std-course-row:hover .std-course-label { color:var(--accent) !important; }
`

const QUICK_LINKS = [
  { Icon: IconBookOpen,  label: 'LMS',         to: '/student/lms' },
  { Icon: IconClipboard, label: 'Attendance',  to: '/student/attendance' },
  { Icon: IconChart,     label: 'Report Card', to: '/student/marks' },
  { Icon: IconCalendar,  label: 'Timetable',   to: '/student/timetable' },
  { Icon: IconNotice,    label: 'Notices',     to: '/student/notices' },
]

function AttendancePill({ pct }) {
  const p = Number(pct ?? 0)
  const isGood = p >= 75
  const isWarn = p >= 60 && p < 75
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 5, fontSize: 12, fontWeight: 600,
      background: isGood ? 'var(--success-tint)' : isWarn ? 'var(--brass-tint)' : 'var(--danger-tint)',
      color: isGood ? 'var(--success)' : isWarn ? '#8a5e2a' : 'var(--danger)',
      border: `1px solid ${isGood ? 'var(--success-line)' : isWarn ? 'var(--brass-line)' : 'var(--danger-line)'}`,
    }}>
      {p.toFixed(1)}%
    </span>
  )
}

function AttendanceBar({ pct }) {
  const p = Math.min(Number(pct ?? 0), 100)
  const barColor = p >= 75 ? 'var(--success)' : p >= 60 ? 'var(--brass)' : 'var(--danger)'
  return (
    <div style={{ height: 7, borderRadius: 4, background: 'var(--canvas-sunk)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${p}%`, background: barColor, borderRadius: 4, transition: 'width 0.4s' }} />
    </div>
  )
}

function CardShell({ title, link, linkTo, children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="card-title" style={{ fontSize: 15 }}>{title}</h2>
        {link && <Link to={linkTo} style={{ fontSize: 12.5, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>{link}</Link>}
      </div>
      {children}
    </div>
  )
}

export default function StudentDashboard() {
  const { user } = useAuth()

  const { data: attendanceData, isLoading: attLoading } = useQuery({
    queryKey: ['student-attendance', user?.studentId],
    queryFn: () => api.get(`/students/${user?.studentId}/attendance-summary`).then(r => r.data.data ?? []),
    enabled: !!user?.studentId,
  })
  const summaries = Array.isArray(attendanceData) ? attendanceData : []
  const latestSummary = summaries[summaries.length - 1] ?? null

  const { data: subjects = [] } = useQuery({
    queryKey: ['lms-subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data.data ?? []),
  })

  const { data: notices = [] } = useQuery({
    queryKey: ['student-notices'],
    queryFn: () => api.get('/notices').then(r => r.data.data ?? []),
  })
  const recentNotices = notices.slice(0, 4)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="page">
      <style>{GRID_CSS}</style>

      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 26, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p className="eyebrow" style={{ margin: '0 0 7px' }}>{greeting}</p>
          <h1 className="display" style={{ fontSize: 30, margin: 0 }}>{user?.name ?? 'Student'}</h1>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <IconCalendar size={13} color="var(--muted)" />
          <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>{todayLabel}</span>
        </div>
      </div>

      {/* Quick links */}
      <div className="std-quick-grid" style={{ marginBottom: 26 }}>
        {QUICK_LINKS.map(lk => (
          <Link
            key={lk.label}
            to={lk.to}
            className="std-qa-tile"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, padding: '16px 10px',
              background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 11,
              boxShadow: 'var(--shadow-xs)',
              transition: 'box-shadow 0.15s, transform 0.15s, border-color 0.15s', textDecoration: 'none',
            }}
          >
            <div className="icon-chip" style={{ width: 40, height: 40, borderRadius: 10 }}>
              <lk.Icon size={18} />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.3 }}>{lk.label}</span>
          </Link>
        ))}
      </div>

      {/* 3-column */}
      <div className="std-main-grid" style={{ marginBottom: 26 }}>

        {/* Announcements */}
        <CardShell title="Announcements" link="View all" linkTo="/student/notices">
          <div style={{ flex: 1 }}>
            {recentNotices.length === 0 ? (
              <p style={{ padding: '34px 20px', fontSize: 13, color: 'var(--faint)', textAlign: 'center' }}>No notices</p>
            ) : recentNotices.map(n => (
              <div key={n.id} style={{ padding: '11px 20px', borderBottom: '1px solid var(--line-2)', display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: n.mandatory ? 'var(--danger)' : 'var(--brass)', flexShrink: 0, marginTop: 6 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name ?? n.title}</p>
                  {n.createdAt && <p style={{ fontSize: 11.5, color: 'var(--faint)', margin: '2px 0 0' }}>{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardShell>

        {/* My Courses */}
        <CardShell title="My Courses" link="LMS" linkTo="/student/lms/courses">
          <div style={{ padding: '8px 20px', flex: 1 }}>
            {subjects.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--faint)', textAlign: 'center', padding: '26px 0' }}>No subjects enrolled</p>
            ) : subjects.slice(0, 5).map(s => (
              <Link key={s.id} to={`/student/lms/courses/${s.id}`} className="std-course-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line-2)', textDecoration: 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', Georgia, serif", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                  {(s.name || 'S')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="std-course-label" style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>{s.name}</p>
                  {s.code && <p style={{ fontSize: 11.5, color: 'var(--faint)', margin: '1px 0 0' }}>{s.code}</p>}
                </div>
                <IconChevronR size={13} color="#c2bba9" />
              </Link>
            ))}
          </div>
        </CardShell>

        {/* Attendance */}
        <CardShell title="Attendance" link="Details" linkTo="/student/attendance">
          <div style={{ padding: '18px 20px', flex: 1 }}>
            {attLoading ? <Spinner /> : latestSummary ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>Overall attendance</span>
                  <AttendancePill pct={latestSummary.attendancePct} />
                </div>
                <AttendanceBar pct={latestSummary.attendancePct} />
                <div style={{ display: 'flex', gap: 14, marginTop: 11, fontSize: 12 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 500 }}>{latestSummary.presentDays} Present</span>
                  <span style={{ color: 'var(--danger)', fontWeight: 500 }}>{latestSummary.absentDays} Absent</span>
                  <span style={{ color: 'var(--faint)' }}>of {latestSummary.totalDays} days</span>
                </div>
                <div style={{ marginTop: 14 }}>
                  {summaries.slice(0, 3).map(s => (
                    <div key={s.termId ?? s.term?.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--line-2)', fontSize: 12 }}>
                      <span style={{ color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.term?.name ?? s.termName ?? `Term ${s.termId}`}</span>
                      <AttendancePill pct={s.attendancePct} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--faint)', textAlign: 'center', padding: '26px 0' }}>No attendance data</p>
            )}
          </div>
        </CardShell>
      </div>

      {/* Subjects table */}
      {subjects.length > 0 && (
        <div className="table-container">
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--line)', background: 'var(--canvas-sunk)' }}>
            <h2 className="card-title" style={{ fontSize: 15 }}>Course &amp; Attendance Overview</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>#</th>
                  <th>Subject</th>
                  <th>Code</th>
                  <th>Attendance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--faint)', fontSize: 12 }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>{s.code ?? '—'}</td>
                    <td>{latestSummary ? <AttendancePill pct={latestSummary.attendancePct} /> : <span style={{ color: 'var(--disabled)' }}>—</span>}</td>
                    <td><Link to={`/student/lms/courses/${s.id}`} style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
