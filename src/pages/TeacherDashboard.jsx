import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../app/axios'
import StatCard from '../components/ui/StatCard'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../auth/AuthContext'
import {
  IconClipboard, IconEdit, IconCalendar, IconChart, IconNotice, IconBuilding,
} from '../components/ui/Icons'

const GRID_CSS = `
  .tr-stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
  .tr-two-col    { display:grid; grid-template-columns:1fr 1fr;       gap:22px; }
  @media(max-width:900px){
    .tr-stats-grid { grid-template-columns:repeat(2,1fr) !important; }
    .tr-two-col    { grid-template-columns:1fr !important; }
  }
  @media(max-width:480px){ .tr-stats-grid { grid-template-columns:1fr !important; } }
  .tr-action-tile:hover { box-shadow:0 4px 14px rgba(64,52,28,0.10) !important; transform:translateY(-1px); border-color:#d6cab2 !important; }
`

const QUICK_ACTIONS = [
  { to: '/teacher/attendance', Icon: IconClipboard, label: 'Mark Attendance',  desc: "Record today's register" },
  { to: '/teacher/marks',      Icon: IconEdit,      label: 'Enter Marks',      desc: 'Post exam scores' },
  { to: '/teacher/timetable',  Icon: IconCalendar,  label: 'View Timetable',   desc: 'Your weekly schedule' },
  { to: '/teacher/reports',    Icon: IconChart,     label: 'Attendance Report',desc: 'Analytics & summaries' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function TeacherDashboard() {
  const { user } = useAuth()

  const today = new Date()
  const todayLabel = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const todayShort = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
    queryKey: ['teacher-sections'],
    queryFn: () => api.get('/sections').then(r => r.data.data),
  })
  const { data: notices, isLoading: noticesLoading } = useQuery({
    queryKey: ['teacher-notices-recent'],
    queryFn: () => api.get('/notices').then(r => r.data.data),
  })

  const sections      = Array.isArray(sectionsData) ? sectionsData : []
  const recentNotices = Array.isArray(notices) ? notices.slice(0, 4) : []
  const noticeCount   = Array.isArray(notices) ? notices.length : null

  if (sectionsLoading) return <div className="page"><Spinner /></div>

  return (
    <div className="page">
      <style>{GRID_CSS}</style>

      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 26, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p className="eyebrow" style={{ margin: '0 0 7px' }}>{getGreeting()}</p>
          <h1 className="display" style={{ fontSize: 30, margin: 0 }}>{user?.name ?? 'Teacher'}</h1>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <IconCalendar size={13} color="var(--muted)" />
          <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>{todayLabel}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="tr-stats-grid" style={{ marginBottom: 26 }}>
        <StatCard label="My Sections" value={sections.length} Icon={IconBuilding} color="green" sub="assigned to you" />
        <StatCard label="Today"        value={todayShort}      Icon={IconCalendar} color="teal"  sub={today.toLocaleDateString('en-IN', { weekday: 'long' })} />
        <StatCard label="Notices"      value={noticesLoading ? null : noticeCount} Icon={IconNotice} color="brass" sub="school announcements" />
      </div>

      {/* Two-column */}
      <div className="tr-two-col">

        {/* Quick Actions + Sections */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-2)' }}>
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {QUICK_ACTIONS.map(a => (
              <Link key={a.to} to={a.to} className="tr-action-tile" style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px',
                background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10,
                boxShadow: 'var(--shadow-xs)', transition: 'box-shadow 0.15s, transform 0.15s, border-color 0.15s', textDecoration: 'none',
              }}>
                <div className="icon-chip" style={{ width: 35, height: 35 }}>
                  <a.Icon size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.label}</p>
                  <p style={{ fontSize: 11.5, color: 'var(--faint)', margin: '2px 0 0', lineHeight: 1.3 }}>{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {sections.length > 0 && (
            <div style={{ borderTop: '1px solid var(--line-2)', padding: '14px 16px 16px' }}>
              <p className="section-title" style={{ marginBottom: 11 }}>Assigned Sections</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sections.map(section => (
                  <div key={section.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', margin: 0 }}>
                      {section.classGrade?.name ?? section.className ?? 'Class'} — {section.name}
                    </p>
                    <span className="badge badge-green">{section.studentCount ?? '—'} students</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Notices */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className="card-title">Recent Notices</h2>
            <Link to="/teacher/notices" style={{ fontSize: 12.5, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>View all</Link>
          </div>
          <div style={{ flex: 1, padding: '4px 22px 10px' }}>
            {noticesLoading ? <Spinner /> : recentNotices.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--faint)', textAlign: 'center', padding: '34px 0' }}>No notices yet</p>
            ) : recentNotices.map(n => {
              const title     = n.name ?? n.title ?? 'Untitled'
              const mandatory = n.mandatory === 1 || n.mandatory === true
              const date      = n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''
              return (
                <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '11px 0', borderBottom: '1px solid var(--line-2)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: mandatory ? 'var(--danger)' : 'var(--brass)', flexShrink: 0, marginTop: 6 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
                      {mandatory && <span className="badge badge-red" style={{ flexShrink: 0 }}>Required</span>}
                    </div>
                    {date && <p style={{ fontSize: 11.5, color: 'var(--faint)', margin: '2px 0 0' }}>{date}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
