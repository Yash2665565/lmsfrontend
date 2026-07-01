import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { lmsApi } from '../api/lmsApi'
import { academicsApi } from '../api/academicsApi'
import { useAuth } from '../auth/AuthContext'
import Spinner from '../components/ui/Spinner'
import { IconBookOpen, IconChevronR } from '../components/ui/Icons'

/* Class + section picker. Admins see every class/section; teachers see only
   the classes & sections they're allocated to (from /lms/my-sections). */
function ClassSectionFilter({ classId, setClassId, sectionId, setSectionId, teacherScoped }) {
  // Teacher-scoped: derive both dropdowns from the teacher's allocations
  const { data: mine = [] } = useQuery({
    queryKey: ['lms-my-sections'], queryFn: lmsApi.getMySections, enabled: !!teacherScoped,
  })
  // Admin: full catalogue
  const { data: allClasses = [] } = useQuery({
    queryKey: ['ac-classes'], queryFn: academicsApi.listClasses, enabled: !teacherScoped,
  })
  const { data: allSections = [] } = useQuery({
    queryKey: ['ac-sections', classId], queryFn: () => academicsApi.listSections(classId), enabled: !teacherScoped && !!classId,
  })

  let classes, sections
  if (teacherScoped) {
    const seen = new Map()
    mine.forEach(m => { if (!seen.has(m.classId)) seen.set(m.classId, { id: m.classId, name: m.className }) })
    classes = [...seen.values()]
    sections = mine.filter(m => String(m.classId) === String(classId)).map(m => ({ id: m.sectionId, name: m.sectionName }))
  } else {
    classes = allClasses
    sections = allSections
  }

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
      <div style={{ minWidth: 200 }}>
        <label className="label">Class</label>
        <select className="input" value={classId} onChange={e => { setClassId(e.target.value); setSectionId('') }}>
          <option value="">— Select class —</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div style={{ minWidth: 200 }}>
        <label className="label">Section</label>
        <select className="input" value={sectionId} onChange={e => setSectionId(e.target.value)} disabled={!classId}>
          <option value="">— Select section —</option>
          {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
    </div>
  )
}

function CourseTable({ subjects, canManage }) {
  return (
    <div className="table-container" style={{ marginBottom: '2rem' }}>
      <div style={{ background: 'var(--canvas-sunk)', borderBottom: '1px solid var(--line)', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p className="card-title" style={{ fontSize: '15px' }}>Subjects</p>
        <span className="badge badge-green">{subjects.length}</span>
      </div>
      <table className="data-table">
        <thead><tr><th style={{ width: 56 }}>#</th><th>Subject</th><th style={{ width: 160 }}>Code</th><th style={{ width: 110 }}></th></tr></thead>
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
                {s.description && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 420 }}>{s.description}</p>}
              </td>
              <td>{s.code ? <span className="badge badge-gray" style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}>{s.code}</span> : <span style={{ color: 'var(--disabled)' }}>—</span>}</td>
              <td><Link to={`/student/lms/courses/${s.id}`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>{canManage ? 'Manage' : 'Open'}</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CourseGrid({ subjects }) {
  return (
    <>
      <style>{`.crs-card:hover{box-shadow:var(--shadow-md)!important;transform:translateY(-2px);border-color:#c8dacd!important}`}</style>
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
  )
}

function EmptyState({ title, subtitle }) {
  return (
    <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--canvas-sunk)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--faint)' }}>
        <IconBookOpen size={22} />
      </div>
      <p style={{ color: 'var(--ink)', fontWeight: 600, fontSize: '15px', margin: 0 }}>{title}</p>
      <p style={{ color: 'var(--faint)', fontSize: '13px', marginTop: '4px' }}>{subtitle}</p>
    </div>
  )
}

export default function LmsCoursesPage() {
  const { isStudent, isTeacher, isAdmin } = useAuth()
  const student = isStudent?.()
  const admin = isAdmin?.()
  const teacher = isTeacher?.()
  const needsFilter = !student   // teachers & admins pick a class + section

  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')

  const { data: subjects = [], isLoading, isFetching } = useQuery({
    queryKey: ['lms-courses', needsFilter ? sectionId : 'student'],
    queryFn: () => lmsApi.getCourses(needsFilter ? sectionId : undefined),
    enabled: needsFilter ? !!sectionId : true,
  })

  const heading = student ? 'My Courses' : admin ? 'Course Catalogue' : 'My Teaching'
  const sub = student
    ? `${subjects.length} subject${subjects.length !== 1 ? 's' : ''} for your class`
    : admin
      ? 'Pick a class & section to see its subjects'
      : 'Pick a class & section you teach to manage its content'

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p className="eyebrow" style={{ margin: '0 0 7px' }}>Learning Portal</p>
          <h1 className="display" style={{ fontSize: '28px', margin: 0 }}>{heading}</h1>
          <p style={{ margin: '5px 0 0', fontSize: '13px', color: 'var(--muted)' }}>{sub}</p>
        </div>
        <Link to="/student/lms" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Dashboard
        </Link>
      </div>

      {needsFilter && (
        <ClassSectionFilter classId={classId} setClassId={setClassId} sectionId={sectionId} setSectionId={setSectionId} teacherScoped={teacher && !admin} />
      )}

      {needsFilter && !sectionId ? (
        <EmptyState title="Select a class & section" subtitle={admin ? 'Choose above to view the subjects mapped to that class.' : 'Choose above to view the subjects you teach there.'} />
      ) : isLoading || isFetching ? (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}><Spinner /></div>
      ) : subjects.length === 0 ? (
        <EmptyState
          title="No subjects here"
          subtitle={student ? 'Subjects will appear once your class has them assigned.' : teacher ? 'You are not allocated any subject in this section.' : 'This class has no subjects mapped yet.'}
        />
      ) : (
        <>
          <CourseTable subjects={subjects} canManage={teacher || admin} />
          <h2 className="card-title" style={{ fontSize: '15px', marginBottom: '1rem' }}>Course Cards</h2>
          <CourseGrid subjects={subjects} />
        </>
      )}
    </div>
  )
}
