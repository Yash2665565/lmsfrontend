import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import api from '../app/axios'
import { lmsApi } from '../api/lmsApi'
import Spinner from '../components/ui/Spinner'

const COURSE_COLORS = ['#1f4b38','#2a6056','#6b4e78','#8a5e2a','#a23b2c','#2e6b4c']

const STATS = [
  { label: 'Active Courses',        key: 0, color: '#1f4b38', bg: '#e7efe9' },
  { label: 'Assignments Submitted', key: 2, color: '#2e6b4c', bg: '#e5f0e8' },
  { label: 'Pending Assignments',   key: 3, color: '#8a5e2a', bg: '#f4e9d6' },
]

function StatBox({ label, color, bg, value }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px 20px', borderLeft: `3px solid ${color}` }}>
      <p style={{ fontSize: '11.5px', fontWeight: 500, color: 'var(--text-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '30px', fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1 }}>{value ?? '—'}</p>
    </div>
  )
}

function CourseCard({ subject, index }) {
  const color = COURSE_COLORS[index % COURSE_COLORS.length]
  return (
    <Link to={`/student/lms/courses/${subject.id}`} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', transition: 'box-shadow 0.18s, transform 0.18s' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}>
        <div style={{ background: color, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.18)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
            {(subject.name || 'S')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, color: '#fff', fontWeight: 600, fontSize: '13.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subject.name}</p>
            {subject.code && <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '11px', marginTop: '2px' }}>{subject.code}</p>}
          </div>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-400)', lineHeight: 1.5, minHeight: '36px' }}>
            {subject.description || 'Explore units, notes, and assignments.'}
          </p>
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-400)' }}>View course</span>
            <span style={{ fontSize: '12px', color: color, fontWeight: 600 }}>→</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function LmsDashboard() {
  const { user } = useAuth()

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['lms-subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data.data ?? []),
  })
  const { data: stats } = useQuery({
    queryKey: ['lms-stats', user?.studentId],
    queryFn: () => lmsApi.getStudentStats(user?.studentId),
    enabled: !!user?.studentId,
  })
  const { data: notices = [] } = useQuery({
    queryKey: ['lms-notices'],
    queryFn: () => api.get('/notices').then(r => (r.data.data ?? []).slice(0, 5)),
  })

  const statValues = [stats?.activeCourses ?? subjects.length, 0, stats?.submissionsCount ?? 0, stats?.pendingAssignments ?? 0]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <p className="eyebrow" style={{ margin: '0 0 7px' }}>Learning Portal</p>
        <h1 className="display" style={{ fontSize: '28px', margin: 0 }}>Welcome back, {user?.name ?? 'Student'}</h1>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '5px' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '24px' }} className="lms-stats">
        <style>{`@media(max-width:640px){.lms-stats{grid-template-columns:1fr!important}}`}</style>
        {STATS.map(s => <StatBox key={s.label} {...s} value={statValues[s.key]} />)}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }} className="lms-main">
        <style>{`@media(max-width:820px){.lms-main{grid-template-columns:1fr!important}}`}</style>

        {/* Courses */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-900)', margin: 0 }}>My Courses</h2>
            <Link to="/student/lms/courses" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>View all</Link>
          </div>
          <div style={{ padding: '16px' }}>
            {isLoading ? (
              <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}><Spinner /></div>
            ) : subjects.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-400)', fontSize: '13.5px' }}>No courses available yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '12px' }}>
                {subjects.slice(0, 6).map((s, i) => <CourseCard key={s.id} subject={s} index={i} />)}
              </div>
            )}
          </div>
        </div>

        {/* Notices */}
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '13px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '15px 18px', borderBottom: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className="card-title" style={{ fontSize: '15px' }}>Announcements</h2>
            <Link to="/student/notices" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>View all</Link>
          </div>
          <div style={{ padding: '4px 0' }}>
            {notices.length === 0 ? (
              <p style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--faint)', fontSize: '13px' }}>No announcements</p>
            ) : notices.map((n, i) => (
              <div key={n.id} style={{ padding: '11px 18px', borderBottom: i < notices.length - 1 ? '1px solid var(--line-2)' : 'none', display: 'flex', gap: '11px', alignItems: 'flex-start' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: n.mandatory ? 'var(--danger)' : 'var(--brass)', flexShrink: 0, marginTop: '6px' }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name ?? n.title}</p>
                  {n.createdAt && <p style={{ margin: 0, fontSize: '11px', color: 'var(--faint)', marginTop: '2px' }}>{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
