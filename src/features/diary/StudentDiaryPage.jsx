import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { diaryApi } from '../../api/diaryApi'
import { useAuth } from '../../auth/AuthContext'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import { IconClipboard } from '../../components/ui/Icons'

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function DiaryStudentCard({ entry: e, studentId }) {
  const qc = useQueryClient()
  const done = e.myStatus === 'DONE'
  const [noteOpen, setNoteOpen] = useState(false)
  const [draft, setDraft] = useState(e.myNote || '')

  const respond = useMutation({
    mutationFn: (body) => diaryApi.respond(e.id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-diary', studentId] }),
  })

  const toggleDone = () => respond.mutate({ status: done ? 'NOT_DONE' : 'DONE' })
  const saveNote = () => respond.mutate({ note: draft }, { onSuccess: () => { setNoteOpen(false); qc.invalidateQueries({ queryKey: ['my-diary', studentId] }) } })

  return (
    <div className="card" style={{ padding: '16px 18px', borderLeft: `3px solid ${done ? 'var(--accent)' : 'var(--brass, #b07a3c)'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <p style={{ fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{e.title}</p>
        {e.subjectName && <span className="badge badge-green">{e.subjectName}</span>}
        {done && <span style={{ fontSize: 11.5, fontWeight: 600, padding: '2px 9px', borderRadius: 999, background: 'var(--success-tint, #e7efe9)', color: 'var(--accent)', border: '1px solid var(--success-line, #cfe0d4)' }}>✓ Done</span>}
      </div>
      {e.description && <p style={{ fontSize: 13.5, color: 'var(--ink-2, #4a4639)', margin: '6px 0 0', lineHeight: 1.55 }}>{e.description}</p>}
      <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12, color: 'var(--faint)', flexWrap: 'wrap' }}>
        {e.teacherName && <span>By {e.teacherName}</span>}
        <span>Posted {fmtDate(e.createdAt)}</span>
        {e.dueDate && <span style={{ color: 'var(--danger)' }}>Due {fmtDate(e.dueDate)}</span>}
      </div>

      {/* existing note (when not editing) */}
      {e.myNote && !noteOpen && (
        <div style={{ marginTop: 12, background: 'var(--canvas-sunk, #ece4d4)', borderRadius: 8, padding: '8px 11px' }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your note</p>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{e.myNote}</p>
        </div>
      )}

      {/* note editor */}
      {noteOpen && (
        <div style={{ marginTop: 12 }}>
          <textarea className="input" rows={2} autoFocus value={draft} onChange={ev => setDraft(ev.target.value)}
            placeholder="Leave a note for your teacher — e.g. a question, or why it couldn't be done…" />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary btn-sm" disabled={respond.isPending} onClick={saveNote}>{respond.isPending ? 'Saving…' : 'Save note'}</button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setNoteOpen(false); setDraft(e.myNote || '') }}>Cancel</button>
          </div>
        </div>
      )}

      {/* actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingTop: 12 }}>
        <button className={done ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'} disabled={respond.isPending} onClick={toggleDone}>
          {done ? 'Mark as not done' : '✓ Mark as done'}
        </button>
        {!noteOpen && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setDraft(e.myNote || ''); setNoteOpen(true) }}>
            {e.myNote ? 'Edit note' : 'Leave a note'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function StudentDiaryPage() {
  const { user } = useAuth()
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['my-diary', user?.studentId],
    queryFn: () => diaryApi.getStudentDiary(user.studentId),
    enabled: !!user?.studentId,
  })

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <PageHeader eyebrow="Academics" title="Class Diary" subtitle="Homework and classwork from your class teacher — mark it done and leave a note" />

      {isLoading ? <Spinner /> : entries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--canvas-sunk)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--faint)' }}><IconClipboard size={22} /></div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>No diary entries yet</p>
          <p style={{ fontSize: 13, color: 'var(--faint)', marginTop: 4 }}>Work given by your teacher will show up here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map(e => <DiaryStudentCard key={e.id} entry={e} studentId={user.studentId} />)}
        </div>
      )}
    </div>
  )
}
