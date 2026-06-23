import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../app/axios'
import Spinner from '../components/ui/Spinner'
import { IconBookOpen, IconChevronR } from '../components/ui/Icons'

export default function LmsCoursesPage() {
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['lms-subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data.data ?? []),
  })

  return (
    <div>
      <style>{`.crs-card:hover{box-shadow:var(--shadow-md)!important;transform:translateY(-2px);border-color:#c8dacd!important}`}</style>

      {/* Page header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p className="eyebrow" style={{ margin: '0 0 7px' }}>Learning Portal</p>
          <h1 className="display" style={{ fontSize: '28px', margin: 0 }}>My Courses</h1>
          <p style={{ margin: '5px 0 0', fontSize: '13px', color: 'var(--muted)' }}>
            {subjects.length} course{subjects.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>
        <Link to="/student/lms" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Dashboard
        </Link>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}><Spinner /></div>
      ) : subjects.length === 0 ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--canvas-sunk)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--faint)' }}>
            <IconBookOpen size={22} />
          </div>
          <p style={{ color: 'var(--ink)', fontWeight: 600, fontSize: '15px', margin: 0 }}>No courses available</p>
          <p style={{ color: 'var(--faint)', fontSize: '13px', marginTop: '4px' }}>Courses will appear here once assigned by your teacher.</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="table-container" style={{ marginBottom: '2rem' }}>
            <div style={{ background: 'var(--canvas-sunk)', borderBottom: '1px solid var(--line)', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p className="card-title" style={{ fontSize: '15px' }}>All Courses</p>
              <span className="badge badge-green">{subjects.length} enrolled</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>#</th>
                  <th>Course</th>
                  <th style={{ width: 160 }}>Code</th>
                  <th style={{ width: 110 }}></th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s, i) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ width: 32, height: 32, background: 'var(--accent-tint)', color: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, fontSize: 13 }}>
                        {String(i + 1).padStart(2, '0')}
                      </div>
                    </td>
                    <td>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{s.name}</p>
                      {s.description && (
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 420 }}>{s.description}</p>
                      )}
                    </td>
                    <td>{s.code ? <span className="badge badge-gray" style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}>{s.code}</span> : <span style={{ color: 'var(--disabled)' }}>—</span>}</td>
                    <td><Link to={`/student/lms/courses/${s.id}`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card grid */}
          <h2 className="card-title" style={{ fontSize: '15px', marginBottom: '1rem' }}>Course Cards</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1rem' }}>
            {subjects.map(s => (
              <Link key={s.id} to={`/student/lms/courses/${s.id}`} style={{ textDecoration: 'none' }}>
                <div className="crs-card" style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-xs)', transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s' }}>
                  <div style={{ background: 'linear-gradient(150deg,#1f4b38,#173829)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '11px' }}>
                    <div style={{ width: 38, height: 38, background: 'rgba(244,239,228,0.14)', border: '1px solid rgba(200,154,91,0.3)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e9d5b3', fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, fontSize: 16, flexShrink: 0 }}>
                      {(s.name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, color: '#f4efe4', fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                      {s.code && <p style={{ margin: '2px 0 0', color: 'rgba(216,225,214,0.6)', fontSize: 11 }}>{s.code}</p>}
                    </div>
                  </div>
                  <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--faint)' }}>View units &amp; materials</p>
                    <IconChevronR size={14} color="var(--accent)" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
