import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { diaryApi } from '../../api/diaryApi'
import Spinner from '../../components/ui/Spinner'

function fmt(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '' }
function fmtTime(d) { return d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '' }

const STATUS_STYLE = {
  DONE:     { label: 'Done',    bg: 'var(--success-tint, #e7efe9)', color: 'var(--accent, #1f4b38)', line: 'var(--success-line, #cfe0d4)' },
  NOT_DONE: { label: 'Not done', bg: '#fbeaea', color: '#a23b3b', line: '#f0d2d2' },
  PENDING:  { label: 'No response', bg: 'var(--canvas-sunk, #ece4d4)', color: 'var(--faint, #9c9482)', line: 'var(--line, #e3dac9)' },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.PENDING
  return <span style={{ fontSize: 11.5, fontWeight: 600, padding: '2px 9px', borderRadius: 999, background: s.bg, color: s.color, border: `1px solid ${s.line}`, whiteSpace: 'nowrap' }}>{s.label}</span>
}

function SummaryChip({ n, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
      <span style={{ fontWeight: 700, color, fontSize: 15 }}>{n}</span>
      <span style={{ fontSize: 12, color: 'var(--faint)' }}>{label}</span>
    </div>
  )
}

/**
 * Reusable homework-response report.
 * @param sections [{ sectionId, label }] — the sections this user may view
 */
export default function DiaryResponsesView({ sections = [] }) {
  const [sectionId, setSectionId] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => { if (!sectionId && sections.length) setSectionId(String(sections[0].sectionId)) }, [sections, sectionId])

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['diary-responses', sectionId, date],
    queryFn: () => diaryApi.getResponses(sectionId, date),
    enabled: !!sectionId,
  })

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
          <label className="label">Posted on (optional)</label>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        {date && <div style={{ alignSelf: 'flex-end' }}><button className="btn btn-secondary btn-sm" onClick={() => setDate('')}>Clear date</button></div>}
      </div>

      {!sectionId ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--faint)' }}>Select a section to see homework status.</div>
      ) : isLoading ? <Spinner /> : entries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--faint)' }}>
          No homework{date ? ` posted on ${fmt(date)}` : ''} for this section.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {entries.map(e => (
            <div key={e.diaryId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <p style={{ fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{e.title}</p>
                  {e.subjectName && <span className="badge badge-green">{e.subjectName}</span>}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 12, color: 'var(--faint)', flexWrap: 'wrap' }}>
                  {e.teacherName && <span>By {e.teacherName}</span>}
                  <span>Posted {fmt(e.postedAt)}</span>
                  {e.dueDate && <span>Due {fmt(e.dueDate)}</span>}
                </div>
                <div style={{ display: 'flex', gap: 18, marginTop: 12 }}>
                  <SummaryChip n={e.done} label="done" color="var(--accent)" />
                  <SummaryChip n={e.notDone} label="not done" color="#a23b3b" />
                  <SummaryChip n={e.pending} label="no response" color="var(--faint)" />
                  <SummaryChip n={e.total} label="total" color="var(--ink)" />
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ margin: 0 }}>
                  <thead><tr><th style={{ width: 56 }}>Roll</th><th>Student</th><th style={{ width: 130 }}>Status</th><th>Note from student / parent</th><th style={{ width: 130 }}>Responded</th></tr></thead>
                  <tbody>
                    {e.students.map(s => (
                      <tr key={s.studentId}>
                        <td>{s.rollNo ?? '—'}</td>
                        <td style={{ fontWeight: 500 }}>{s.studentName}</td>
                        <td><StatusBadge status={s.status} /></td>
                        <td style={{ color: s.note ? 'var(--ink-2, #4a4639)' : 'var(--faint)', maxWidth: 360, whiteSpace: 'pre-wrap' }}>{s.note || '—'}</td>
                        <td style={{ color: 'var(--faint)', fontSize: 12 }}>{s.respondedAt ? fmtTime(s.respondedAt) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
