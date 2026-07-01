import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { diaryApi, teacherLabel } from '../../api/diaryApi'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import DiaryResponsesView from './DiaryResponsesView'

const TABS = ['View Diary', 'Homework Status', 'Class Teachers']

function fmt(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '' }
function sameDay(iso, ymd) {
  if (!ymd) return true
  if (!iso) return false
  return new Date(iso).toISOString().slice(0, 10) === ymd
}

/* ── Admin viewer: pick section + date, see what work was given ── */
function ViewDiaryTab() {
  const { data: sections = [] } = useQuery({ queryKey: ['diary-admin-sections'], queryFn: diaryApi.getAdminSections })
  const [sectionId, setSectionId] = useState('')
  const [date, setDate] = useState('')

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['diary-section', sectionId],
    queryFn: () => diaryApi.getSectionDiary(sectionId),
    enabled: !!sectionId,
  })
  const filtered = entries.filter(e => sameDay(e.createdAt, date) || sameDay(e.dueDate, date))

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div style={{ minWidth: 240 }}>
          <label className="label">Class &amp; Section</label>
          <select className="input" value={sectionId} onChange={e => setSectionId(e.target.value)}>
            <option value="">— Select section —</option>
            {sections.map(s => <option key={s.sectionId} value={s.sectionId}>{s.label}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 180 }}>
          <label className="label">Date (optional)</label>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        {date && <div style={{ alignSelf: 'flex-end' }}><button className="btn btn-secondary btn-sm" onClick={() => setDate('')}>Clear date</button></div>}
      </div>

      {!sectionId ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--faint)' }}>Select a section to see the work given to it.</div>
      ) : isLoading ? <Spinner /> : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--faint)' }}>
          No diary entries{date ? ` on ${fmt(date)}` : ''} for this section.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(e => (
            <div key={e.id} className="card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <p style={{ fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{e.title}</p>
                {e.subjectName && <span className="badge badge-green">{e.subjectName}</span>}
              </div>
              {e.description && <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '6px 0 0', lineHeight: 1.55 }}>{e.description}</p>}
              <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12, color: 'var(--faint)', flexWrap: 'wrap' }}>
                {e.teacherName && <span>By {e.teacherName}</span>}
                <span>Given {fmt(e.createdAt)}</span>
                {e.dueDate && <span style={{ color: 'var(--danger)' }}>Due {fmt(e.dueDate)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Class-teacher assignment ── */
function ClassTeachersTab() {
  const qc = useQueryClient()
  const { data: sections = [], isLoading } = useQuery({ queryKey: ['diary-admin-sections'], queryFn: diaryApi.getAdminSections })
  const { data: teachers = [] } = useQuery({ queryKey: ['diary-teachers'], queryFn: diaryApi.getTeachers })
  const [draft, setDraft] = useState({})
  const assign = useMutation({
    mutationFn: ({ sectionId, teacherId }) => diaryApi.assignClassTeacher(sectionId, teacherId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diary-admin-sections'] }),
  })
  return isLoading ? <Spinner /> : (
    <div className="table-container">
      <table className="data-table">
        <thead><tr><th>Section</th><th>Current Class Teacher</th><th style={{ width: 320 }}>Assign</th></tr></thead>
        <tbody>
          {sections.map(s => {
            const sel = draft[s.sectionId] ?? s.classTeacherId ?? ''
            return (
              <tr key={s.sectionId}>
                <td style={{ fontWeight: 600 }}>{s.label}</td>
                <td style={{ color: s.teacherName ? 'var(--ink)' : 'var(--faint)' }}>{s.teacherName || 'Not assigned'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select className="input" value={sel} onChange={e => setDraft(p => ({ ...p, [s.sectionId]: e.target.value }))}>
                      <option value="">— Select teacher —</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{teacherLabel(t)}</option>)}
                    </select>
                    <button className="btn btn-primary btn-sm" disabled={!sel || assign.isPending}
                      onClick={() => assign.mutate({ sectionId: s.sectionId, teacherId: Number(sel) })}>Save</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ── Admin homework-status report ── */
function HomeworkStatusTab() {
  const { data: sections = [], isLoading } = useQuery({ queryKey: ['diary-admin-sections'], queryFn: diaryApi.getAdminSections })
  if (isLoading) return <Spinner />
  return <DiaryResponsesView sections={sections.map(s => ({ sectionId: s.sectionId, label: s.label }))} />
}

export default function AdminDiaryPage() {
  const [tab, setTab] = useState('View Diary')
  return (
    <div className="page">
      <PageHeader eyebrow="Diary" title="Diary" subtitle="View what work each section was given, and manage class teachers" />
      <div className="table-container" style={{ overflow: 'visible', marginBottom: 18 }}>
        <div style={{ borderBottom: '1px solid var(--line)', display: 'flex', background: 'var(--surface)', borderRadius: '13px 13px 0 0' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '13px 22px', fontSize: 13.5, fontWeight: tab === t ? 600 : 500,
              color: tab === t ? 'var(--accent)' : 'var(--muted)', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', marginBottom: -1, fontFamily: 'inherit',
            }}>{t}</button>
          ))}
        </div>
        <div style={{ padding: 20 }}>
          {tab === 'View Diary' && <ViewDiaryTab />}
          {tab === 'Homework Status' && <HomeworkStatusTab />}
          {tab === 'Class Teachers' && <ClassTeachersTab />}
        </div>
      </div>
    </div>
  )
}
