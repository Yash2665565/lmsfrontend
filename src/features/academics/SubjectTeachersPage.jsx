import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { allocationApi, teacherLabel, sectionLabel } from '../../api/allocationApi'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import { IconTrash } from '../../components/ui/Icons'

/* One subject row — its teacher dropdown is filtered to teachers whose
   expertise includes this subject (falls back to all teachers if none). */
function SubjectRow({ row, sectionId, allTeachers, onAssign, onRemove, busy }) {
  const [sel, setSel] = useState(row.teacherId ? String(row.teacherId) : '')
  const { data: eligible = [] } = useQuery({
    queryKey: ['subject-teachers-for', row.topicId],
    queryFn: () => allocationApi.teachersForSubject(row.topicId),
  })
  const usingFallback = eligible.length === 0
  const options = usingFallback
    ? allTeachers.map(t => ({ id: t.id, name: teacherLabel(t) }))
    : eligible.map(t => ({ id: t.teacherId, name: t.teacherName }))

  return (
    <tr>
      <td style={{ fontWeight: 600 }}>{row.subjectName}</td>
      <td style={{ color: row.teacherName ? 'var(--ink)' : 'var(--faint)' }}>{row.teacherName || 'Not assigned'}</td>
      <td>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="input" value={sel} onChange={e => setSel(e.target.value)}>
            <option value="">— Select teacher —</option>
            {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" disabled={!sel || busy}
            onClick={() => onAssign(row.topicId, Number(sel))}>Save</button>
          {row.assignmentId && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} title="Remove"
              onClick={() => onRemove(row.assignmentId)}><IconTrash size={13} /></button>
          )}
        </div>
        {usingFallback && (
          <p style={{ fontSize: 11, color: 'var(--faint)', margin: '4px 0 0' }}>No teacher has this subject as expertise yet — showing all teachers.</p>
        )}
      </td>
    </tr>
  )
}

export default function SubjectTeachersPage() {
  const qc = useQueryClient()
  const { data: sections = [] } = useQuery({ queryKey: ['alloc-sections'], queryFn: allocationApi.getSections })
  const { data: teachers = [] } = useQuery({ queryKey: ['alloc-teachers'], queryFn: allocationApi.getTeachers })
  const [sectionId, setSectionId] = useState('')

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['section-subjects', sectionId],
    queryFn: () => allocationApi.getSectionSubjects(sectionId),
    enabled: !!sectionId,
  })

  const assign = useMutation({
    mutationFn: (b) => allocationApi.assign(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['section-subjects', sectionId] }),
  })
  const remove = useMutation({
    mutationFn: (id) => allocationApi.unassign(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['section-subjects', sectionId] }),
  })

  return (
    <div className="page">
      <PageHeader eyebrow="Academics" title="Subject Teachers" subtitle="Pick a section, then assign a teacher to each of its subjects" />

      <div style={{ marginBottom: 18, maxWidth: 360 }}>
        <label className="label">Section</label>
        <select className="input" value={sectionId} onChange={e => setSectionId(e.target.value)}>
          <option value="">— Select a section —</option>
          {sections.map(s => <option key={s.id} value={s.id}>{sectionLabel(s)}</option>)}
        </select>
      </div>

      {!sectionId ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--faint)' }}>Select a section to allocate its subjects.</div>
      ) : isLoading ? <Spinner /> : rows.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--faint)' }}>No subjects mapped to this section's class.</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Subject</th><th>Current Teacher</th><th style={{ width: 380 }}>Assign</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <SubjectRow
                  key={r.topicId}
                  row={r}
                  sectionId={sectionId}
                  allTeachers={teachers}
                  busy={assign.isPending}
                  onAssign={(topicId, teacherId) => assign.mutate({ sectionId: Number(sectionId), topicId, teacherId })}
                  onRemove={(id) => remove.mutate(id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
