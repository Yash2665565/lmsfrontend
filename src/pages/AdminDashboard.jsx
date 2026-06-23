import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../app/axios'
import StatCard from '../components/ui/StatCard'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../auth/AuthContext'
import {
  IconUser, IconGradCap, IconBuilding, IconNotice,
  IconClipboard, IconEdit, IconChart, IconCalendar, IconUserPlus, IconChevronR,
  IconInfo,
} from '../components/ui/Icons'

const GRID_STYLES = `
  .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
  .dash-grid  { display:grid; grid-template-columns:1.05fr 1fr;     gap:22px; }
  @media(max-width:900px){
    .stats-grid { grid-template-columns:repeat(2,1fr) !important; }
    .dash-grid  { grid-template-columns:1fr           !important; }
  }
  @media(max-width:500px){ .stats-grid { grid-template-columns:1fr !important; } }
  .qa-tile:hover { box-shadow:0 4px 14px rgba(64,52,28,0.10) !important; transform:translateY(-1px); }
`

const QUICK_ACTIONS = [
  { to: '/admin/students',           Icon: IconUser,      label: 'Add Student',     desc: 'Enrol a new student' },
  { to: '/admin/attendance',         Icon: IconClipboard, label: 'Mark Attendance', desc: "Record today's register" },
  { to: '/teacher/marks',            Icon: IconEdit,      label: 'Enter Marks',     desc: 'Post exam scores' },
  { to: '/admin/reports/attendance', Icon: IconChart,     label: 'View Reports',    desc: 'Attendance analytics' },
  { to: '/admin/academics',          Icon: IconBuilding,  label: 'Manage Classes',  desc: 'Years, terms, subjects' },
  { to: '/admin/notices',            Icon: IconNotice,    label: 'Post Notice',     desc: 'Announce to school' },
]

function QuickActionTile({ to, Icon, label, desc }) {
  return (
    <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        className="qa-tile"
        style={{
          display: 'flex', alignItems: 'center', gap: 13, padding: '14px 15px',
          background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10,
          boxShadow: 'var(--shadow-xs)',
          transition: 'box-shadow 0.15s, transform 0.15s, border-color 0.15s',
          cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#c8dacd' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)' }}
      >
        <div className="icon-chip"><Icon size={17} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1.3 }}>{label}</p>
          <p style={{ fontSize: 11.5, color: 'var(--faint)', margin: '2px 0 0', lineHeight: 1.3 }}>{desc}</p>
        </div>
        <IconChevronR size={14} color="#c2bba9" />
      </div>
    </Link>
  )
}

function NoticeRow({ notice }) {
  const title = notice.name ?? notice.title ?? 'Untitled'
  const date  = notice.createdAt
    ? new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : notice.date ?? ''
  const mandatory = notice.mandatory === 1 || notice.mandatory === true

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line-2)' }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: mandatory ? 'var(--danger)' : 'var(--brass)', flexShrink: 0, marginTop: 6 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
        {notice.content && (
          <p style={{ fontSize: 12, color: 'var(--faint)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notice.content}</p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {mandatory && <span className="badge badge-red">Mandatory</span>}
        {date && <span style={{ fontSize: 11.5, color: 'var(--faint)', whiteSpace: 'nowrap' }}>{date}</span>}
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

  const totalStudents =
    studentsData?.data?.totalElements ?? studentsData?.totalElements ??
    (Array.isArray(studentsData) ? studentsData.length : null)
  const totalTeachers = Array.isArray(teachersData) ? teachersData.length : (teachersData?.totalElements ?? null)
  const activeClasses = Array.isArray(classesData)  ? classesData.length  : (classesData?.totalElements  ?? null)
  const recentNotices = Array.isArray(notices) ? notices.slice(0, 5) : []
  const noticeCount   = Array.isArray(notices) ? notices.length : null

  const currentYear = Array.isArray(academicYears)
    ? academicYears.find(y => y.current || y.active || y.isCurrent) ?? academicYears[0]
    : null

  const hour        = new Date().getHours()
  const greeting    = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const displayName = user?.name ?? 'Administrator'
  const todayLabel  = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="page">
      <style>{GRID_STYLES}</style>

      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p className="eyebrow" style={{ margin: '0 0 7px' }}>{greeting}</p>
          <h1 className="display" style={{ fontSize: 30, margin: 0 }}>{displayName}</h1>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <IconCalendar size={13} color="var(--muted)" />
          <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>{todayLabel}</span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="stats-grid" style={{ marginBottom: 26 }}>
        <StatCard label="Total Students" value={studentsLoading ? null : totalStudents} Icon={IconUser}     color="green"  sub={currentYear ? `Year ${currentYear.name ?? currentYear.year}` : undefined} />
        <StatCard label="Total Teachers" value={teachersLoading ? null : totalTeachers} Icon={IconGradCap}  color="teal" />
        <StatCard label="Active Classes" value={classesLoading ? null : activeClasses}  Icon={IconBuilding} color="purple" />
        <StatCard label="Notices"        value={noticesLoading ? null : noticeCount}    Icon={IconNotice}   color="brass" />
      </div>

      {/* Two-column */}
      <div className="dash-grid" style={{ marginBottom: 26 }}>

        {/* Quick Actions */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-2)' }}>
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {QUICK_ACTIONS.map(a => <QuickActionTile key={a.to} {...a} />)}
          </div>
        </div>

        {/* Recent Notices */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className="card-title">Recent Notices</h2>
            <Link to="/admin/notices" style={{ fontSize: 12.5, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>View all</Link>
          </div>
          <div style={{ padding: '4px 22px 10px', flex: 1 }}>
            {noticesLoading ? <Spinner /> : recentNotices.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--canvas-sunk)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconNotice size={19} color="var(--faint)" />
                </div>
                <p style={{ fontSize: 13, color: 'var(--faint)', margin: 0 }}>No notices posted yet</p>
                <Link to="/admin/notices" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', marginTop: 2 }}>Post a notice</Link>
              </div>
            ) : recentNotices.map(n => <NoticeRow key={n.id} notice={n} />)}
          </div>
        </div>
      </div>

      {/* Academic year strip */}
      {currentYear && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 18px', background: 'var(--accent-tint)', border: '1px solid var(--accent-line)', borderRadius: 10 }}>
          <IconInfo size={15} color="var(--accent)" />
          <span style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 500 }}>Current Academic Year</span>
          <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 14, color: 'var(--accent-press)', fontWeight: 600 }}>
            {currentYear.name ?? currentYear.year}
          </span>
        </div>
      )}
    </div>
  )
}
