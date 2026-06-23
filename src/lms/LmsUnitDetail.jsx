import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { lmsApi } from '../api/lmsApi'
import api from '../app/axios'
import { useAuth } from '../auth/AuthContext'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import { IconPlus, IconFileText, IconClipboard, IconCheck } from '../components/ui/Icons'

const TABS = ['Notes', 'Assignments', 'Surprise Tests']

/* Warm note-type palette: [bg, fg] */
const NOTE_COLORS = {
  PDF:   ['#f6e6e0', '#a23b2c'],
  VIDEO: ['#e3eeec', '#2a6056'],
  LINK:  ['#f4e9d6', '#8a5e2a'],
  TEXT:  ['#f1ece1', '#726b5c'],
}

function NoteTypeIcon({ type }) {
  const paths = {
    PDF:   <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>,
    VIDEO: <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>,
    LINK:  <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>,
    TEXT:  <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>,
  }
  const [bg, fg] = NOTE_COLORS[type] || NOTE_COLORS.TEXT
  return (
    <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[type] || paths.TEXT}</svg>
    </div>
  )
}

function EmptyState({ Icon, label, hint }) {
  return (
    <div style={{ textAlign: 'center', padding: '3.5rem 0' }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--canvas-sunk)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'var(--faint)' }}>
        <Icon size={21} />
      </div>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>{label}</p>
      {hint && <p style={{ color: 'var(--faint)', fontSize: 12, marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

function AddNoteModal({ open, onClose, unitId }) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset } = useForm()
  const mutation = useMutation({
    mutationFn: body => lmsApi.createNote(unitId, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes', String(unitId)] }); onClose(); reset() },
  })
  return (
    <Modal open={open} onClose={onClose} title="Add Note / Resource">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="label">Title *</label>
          <input className="input" placeholder="Chapter 1 Notes" {...register('title', { required: true })} />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" {...register('noteType')}>
            <option value="TEXT">Text</option>
            <option value="PDF">PDF</option>
            <option value="VIDEO">Video</option>
            <option value="LINK">Link</option>
          </select>
        </div>
        <div>
          <label className="label">Content / URL</label>
          <textarea className="input" rows={3} placeholder="Enter content or URL..." {...register('content')} />
        </div>
        <div>
          <label className="label">File URL</label>
          <input className="input" placeholder="https://..." {...register('fileUrl')} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Adding…' : 'Add Note'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AddAssignmentModal({ open, onClose, unitId }) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset } = useForm()
  const mutation = useMutation({
    mutationFn: body => lmsApi.createAssignment(unitId, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assignments', String(unitId)] }); onClose(); reset() },
  })
  return (
    <Modal open={open} onClose={onClose} title="Add Assignment">
      <form onSubmit={handleSubmit(d => mutation.mutate({ ...d, maxMarks: Number(d.maxMarks) || 100 }))} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="label">Title *</label>
          <input className="input" placeholder="Assignment 1" {...register('title', { required: true })} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} placeholder="Describe the assignment..." {...register('description')} />
        </div>
        <div className="form-row">
          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" {...register('dueDate')} />
          </div>
          <div>
            <label className="label">Max Marks</label>
            <input type="number" className="input" placeholder="100" {...register('maxMarks')} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Adding…' : 'Add Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AddSurpriseTestModal({ open, onClose, unitId }) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset } = useForm()
  const mutation = useMutation({
    mutationFn: body => lmsApi.createSurpriseTest(unitId, { ...body, durationMinutes: Number(body.durationMinutes) || 20, maxMarks: Number(body.maxMarks) || 20 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['surprise-tests', String(unitId)] }); onClose(); reset() },
  })
  return (
    <Modal open={open} onClose={onClose} title="Add Surprise Test">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="label">Title *</label>
          <input className="input" placeholder="Surprise Test 3" {...register('title', { required: true })} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} placeholder="Topics covered..." {...register('description')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label className="label">Test Date</label>
            <input type="date" className="input" {...register('testDate')} />
          </div>
          <div>
            <label className="label">Duration (min)</label>
            <input type="number" className="input" defaultValue={20} {...register('durationMinutes')} />
          </div>
          <div>
            <label className="label">Max Marks</label>
            <input type="number" className="input" defaultValue={20} {...register('maxMarks')} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Adding…' : 'Add Surprise Test'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function SubmitModal({ open, onClose, assignment, studentId }) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset } = useForm()
  const mutation = useMutation({
    mutationFn: body => lmsApi.submit(assignment?.id, { studentId, content: body.content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', String(assignment?.unitId)] })
      onClose(); reset()
    },
  })
  return (
    <Modal open={open} onClose={onClose} title={`Submit: ${assignment?.title ?? ''}`}>
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="label">Your Answer / Submission</label>
          <textarea className="input" rows={5} placeholder="Write your answer here..." {...register('content', { required: true })} />
        </div>
        {assignment?.dueDate && (
          <p style={{ fontSize: 12, color: 'var(--faint)', margin: 0 }}>Due: {new Date(assignment.dueDate).toLocaleDateString('en-IN')}</p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting…' : 'Submit Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function LmsUnitDetail() {
  const { subjectId, unitId } = useParams()
  const { user, isAdmin, isTeacher } = useAuth()
  const [activeTab, setActiveTab] = useState('Notes')
  const [addNoteOpen, setAddNoteOpen]     = useState(false)
  const [addAssignOpen, setAddAssignOpen] = useState(false)
  const [addTestOpen, setAddTestOpen]     = useState(false)
  const [submitTarget, setSubmitTarget]   = useState(null)

  const canManage = isAdmin?.() || isTeacher?.()

  const { data: units = [] } = useQuery({
    queryKey: ['units', subjectId],
    queryFn: () => lmsApi.getUnits(subjectId),
    enabled: !!subjectId,
  })
  const unit = units.find(u => String(u.id) === unitId)
  const unitIndex = units.findIndex(u => String(u.id) === unitId)

  const { data: subjects = [] } = useQuery({
    queryKey: ['lms-subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data.data ?? []),
  })
  const subject = subjects.find(s => String(s.id) === subjectId)

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['notes', unitId],
    queryFn: () => lmsApi.getNotes(unitId),
    enabled: activeTab === 'Notes' && !!unitId,
  })

  const { data: assignments = [], isLoading: assignLoading } = useQuery({
    queryKey: ['assignments', unitId],
    queryFn: () => lmsApi.getAssignments(unitId, user?.studentId),
    enabled: activeTab === 'Assignments' && !!unitId,
  })

  const { data: surpriseTests = [], isLoading: testsLoading } = useQuery({
    queryKey: ['surprise-tests', unitId],
    queryFn: () => lmsApi.getSurpriseTests(unitId),
    enabled: activeTab === 'Surprise Tests' && !!unitId,
  })

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--faint)', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <Link to="/student/lms" style={{ color: 'var(--accent)', textDecoration: 'none' }}>LMS</Link>
        <span>/</span>
        <Link to="/student/lms/courses" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Courses</Link>
        <span>/</span>
        <Link to={`/student/lms/courses/${subjectId}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{subject?.name ?? 'Course'}</Link>
        <span>/</span>
        <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{unit?.title ?? 'Unit'}</span>
      </div>

      {/* Unit header */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--accent)', color: '#f4efe4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500, fontSize: 18, flexShrink: 0 }}>
          {String(unitIndex + 1).padStart(2, '0')}
        </div>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Fraunces', Georgia, serif", fontSize: 21, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{unit?.title ?? 'Unit'}</h1>
          {unit?.description && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>{unit.description}</p>}
        </div>
      </div>

      {/* Tabs card */}
      <div className="table-container">
        <div style={{ borderBottom: '1px solid var(--line)', display: 'flex' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '13px 24px', fontSize: 13.5,
                fontWeight: activeTab === tab ? 600 : 500,
                color: activeTab === tab ? 'var(--accent)' : 'var(--muted)',
                background: 'none', border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1, fontFamily: 'inherit',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ padding: '1.25rem 1.5rem' }}>

          {/* Notes */}
          {activeTab === 'Notes' && (
            <div>
              {canManage && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                  <button onClick={() => setAddNoteOpen(true)} className="btn btn-primary btn-sm"><IconPlus size={14} /> Add Note</button>
                </div>
              )}
              {notesLoading ? <Spinner /> : notes.length === 0 ? (
                <EmptyState Icon={IconFileText} label="No notes uploaded yet" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {notes.map(note => {
                    const [bg, fg] = NOTE_COLORS[note.noteType] || NOTE_COLORS.TEXT
                    return (
                      <div key={note.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 15px', background: bg, borderRadius: 10, border: `1px solid ${fg}22` }}>
                        <NoteTypeIcon type={note.noteType} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{note.title}</p>
                            <span style={{ background: fg + '22', color: fg, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.04em' }}>{note.noteType}</span>
                          </div>
                          {note.content && <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>{note.content}</p>}
                          {note.fileUrl && (
                            <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: fg, fontSize: 12, fontWeight: 600, marginTop: 7, textDecoration: 'none' }}>↗ Open Resource</a>
                          )}
                        </div>
                        {note.createdAt && <p style={{ margin: 0, fontSize: 11, color: 'var(--faint)', flexShrink: 0 }}>{new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>}
                      </div>
                    )
                  })}
                </div>
              )}
              <AddNoteModal open={addNoteOpen} onClose={() => setAddNoteOpen(false)} unitId={unitId} />
            </div>
          )}

          {/* Assignments */}
          {activeTab === 'Assignments' && (
            <div>
              {canManage && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                  <button onClick={() => setAddAssignOpen(true)} className="btn btn-primary btn-sm"><IconPlus size={14} /> Add Assignment</button>
                </div>
              )}
              {assignLoading ? <Spinner /> : assignments.length === 0 ? (
                <EmptyState Icon={IconClipboard} label="No assignments yet" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {assignments.map(a => {
                    const sub = a.mySubmission
                    const overdue = a.dueDate && new Date(a.dueDate) < new Date() && !sub
                    const [statusBg, statusFg, statusLabel] = sub
                      ? sub.status === 'GRADED'
                        ? ['#e5f0e8', '#2e6b4c', `Graded: ${sub.marksObtained}/${a.maxMarks}`]
                        : ['#e5f0e8', '#2e6b4c', 'Submitted']
                      : overdue
                        ? ['#f6e6e0', '#a23b2c', 'Overdue']
                        : ['#f4e9d6', '#8a5e2a', 'Pending']
                    return (
                      <div key={a.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{a.title}</p>
                              <span style={{ background: statusBg, color: statusFg, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{statusLabel}</span>
                            </div>
                            {a.description && <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>{a.description}</p>}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: 6, fontSize: 12, color: 'var(--faint)' }}>
                              {a.dueDate && <span>Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                              <span>Max Marks: {a.maxMarks}</span>
                            </div>
                            {sub?.feedback && (
                              <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--success-tint)', borderRadius: 7, fontSize: 13, color: 'var(--success)' }}>
                                <strong>Feedback:</strong> {sub.feedback}
                              </div>
                            )}
                          </div>
                          {!sub && !canManage && (
                            <button onClick={() => setSubmitTarget(a)} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>Submit</button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <AddAssignmentModal open={addAssignOpen} onClose={() => setAddAssignOpen(false)} unitId={unitId} />
              <SubmitModal open={!!submitTarget} onClose={() => setSubmitTarget(null)} assignment={submitTarget} studentId={user?.studentId} />
            </div>
          )}

          {/* Surprise Tests */}
          {activeTab === 'Surprise Tests' && (
            <div>
              {canManage && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                  <button onClick={() => setAddTestOpen(true)} className="btn btn-sm" style={{ background: '#6b4e78', color: '#fff' }}><IconPlus size={14} /> Add Surprise Test</button>
                </div>
              )}
              {testsLoading ? <Spinner /> : surpriseTests.length === 0 ? (
                <EmptyState Icon={IconCheck} label="No surprise tests yet" hint={canManage ? 'Click "Add Surprise Test" to schedule one.' : undefined} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {surpriseTests.map(t => (
                    <div key={t.id} className="card" style={{ padding: '1rem 1.25rem', borderLeft: '3px solid #6b4e78' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{t.title}</p>
                          {t.description && <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>{t.description}</p>}
                          <div style={{ display: 'flex', gap: '1.25rem', fontSize: 12, color: 'var(--faint)', flexWrap: 'wrap' }}>
                            {t.testDate && <span>Date: {new Date(t.testDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                            <span>Duration: {t.durationMinutes} min</span>
                            <span>Max Marks: {t.maxMarks}</span>
                          </div>
                        </div>
                        <span className="badge badge-purple" style={{ flexShrink: 0 }}>Surprise Test</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <AddSurpriseTestModal open={addTestOpen} onClose={() => setAddTestOpen(false)} unitId={unitId} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
