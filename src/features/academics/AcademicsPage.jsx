import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '../../app/axios'
import { allocationApi, teacherLabel } from '../../api/allocationApi'
import Modal from '../../components/ui/Modal'

// ── Helpers ────────────────────────────────────────────────────────────────────

// Per-section panel: add subjects to the class + assign a teacher to each subject.
function SectionSubjectsModal({ section, classGradeId, onClose }) {
  const qc = useQueryClient()
  const open = Boolean(section)
  const sectionId = section?.id
  const [adding, setAdding] = useState('')
  const inv = () => { qc.invalidateQueries({ queryKey: ['section-subjects', String(sectionId)] }) }

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['section-subjects', String(sectionId)],
    queryFn: () => allocationApi.getSectionSubjects(sectionId),
    enabled: open,
  })
  const { data: allSubjects = [] } = useQuery({ queryKey: ['all-subjects'], queryFn: allocationApi.getSubjects, enabled: open })
  const { data: allTeachers = [] } = useQuery({ queryKey: ['all-teachers'], queryFn: allocationApi.getTeachers, enabled: open })

  const assignedIds = new Set(rows.map(r => r.topicId))
  const available = allSubjects.filter(s => !assignedIds.has(s.id))

  const addSub = useMutation({ mutationFn: (sid) => allocationApi.addClassSubject(classGradeId, sid), onSuccess: () => { inv(); setAdding('') } })
  const removeSub = useMutation({ mutationFn: (sid) => allocationApi.removeClassSubject(classGradeId, sid), onSuccess: inv })
  const assignTeacher = useMutation({ mutationFn: (b) => allocationApi.assign(b), onSuccess: inv })

  return (
    <Modal open={open} onClose={onClose} title={section ? `Subjects — ${section.classGrade?.name ?? 'Class'} ${section.name}` : ''} size="lg">
      {/* Add subject to the class */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select className="input" value={adding} onChange={e => setAdding(e.target.value)}>
          <option value="">— Add a subject to this class —</option>
          {available.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" disabled={!adding || addSub.isPending} onClick={() => addSub.mutate(Number(adding))}>Add</button>
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--faint)', margin: '0 0 12px' }}>Subjects apply to the whole class ({section?.classGrade?.name}); teacher assignment is per this section.</p>

      {isLoading ? <p style={{ color: 'var(--faint)' }}>Loading…</p> : rows.length === 0 ? (
        <p style={{ color: 'var(--faint)', textAlign: 'center', padding: '20px 0' }}>No subjects yet. Add one above.</p>
      ) : (
        <table className="data-table" style={{ border: '1px solid var(--line)', borderRadius: 8 }}>
          <thead><tr><th>Subject</th><th style={{ width: 300 }}>Teacher</th><th></th></tr></thead>
          <tbody>
            {rows.map(r => (
              <SubjRow key={r.topicId} row={r} sectionId={sectionId} allTeachers={allTeachers}
                onAssign={(teacherId) => assignTeacher.mutate({ sectionId: Number(sectionId), topicId: r.topicId, teacherId })}
                onRemove={() => removeSub.mutate(r.topicId)} busy={assignTeacher.isPending} />
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  )
}

function SubjRow({ row, sectionId, allTeachers, onAssign, onRemove, busy }) {
  const [sel, setSel] = useState(row.teacherId ? String(row.teacherId) : '')
  const { data: eligible = [] } = useQuery({
    queryKey: ['subject-teachers-for', row.topicId],
    queryFn: () => allocationApi.teachersForSubject(row.topicId),
  })
  const opts = eligible.length ? eligible.map(t => ({ id: t.teacherId, name: t.teacherName })) : allTeachers.map(t => ({ id: t.id, name: teacherLabel(t) }))
  return (
    <tr>
      <td style={{ fontWeight: 600 }}>{row.subjectName}<div style={{ fontSize: 11, color: 'var(--faint)' }}>{row.teacherName ? `Assigned: ${row.teacherName}` : 'Not assigned'}</div></td>
      <td>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="input" value={sel} onChange={e => setSel(e.target.value)}>
            <option value="">— Select teacher —</option>
            {opts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" disabled={!sel || busy} onClick={() => onAssign(Number(sel))}>Save</button>
        </div>
      </td>
      <td style={{ textAlign: 'right' }}>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={onRemove}>Remove</button>
      </td>
    </tr>
  )
}

// Students in a section: roster → full details + credentials (set/reveal).
function StudentDetailView({ studentId, onBack }) {
  const { data: s, isLoading } = useQuery({
    queryKey: ['student-detail', studentId],
    queryFn: () => api.get(`/students/${studentId}`).then(r => r.data.data),
    enabled: !!studentId,
  })
  const { register, handleSubmit } = useForm()
  const [cred, setCred] = useState(null)
  const save = useMutation({
    mutationFn: (b) => api.put(`/students/${studentId}/credentials`, b).then(r => r.data),
    onSuccess: (_d, vars) => setCred(vars),
  })
  if (isLoading || !s) return <p style={{ color: 'var(--faint)', padding: '16px 0' }}>Loading…</p>
  const rows = [
    ['Name', `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim()], ['Admission No', s.admissionNo],
    ['Gender', s.gender], ['Date of Birth', s.dob], ['Phone', s.phone], ['Address', s.address],
    ['Guardian', s.guardianName], ['Login Email', s.email || '—'],
  ]
  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 10 }}>← Back to list</button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: 16 }}>
        {rows.map(([k, v]) => (
          <div key={k}><p style={{ fontSize: 11, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{k}</p>
            <p style={{ fontSize: 13.5, color: 'var(--ink)', margin: '2px 0 0', fontWeight: 500 }}>{v || '—'}</p></div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
        <p className="section-title" style={{ marginBottom: 8 }}>Login Credentials</p>
        <p style={{ fontSize: 11.5, color: 'var(--faint)', margin: '0 0 8px' }}>Passwords are stored encrypted and can't be shown — set or reset one here to reveal it.</p>
        <form onSubmit={handleSubmit(d => save.mutate(d))} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 180 }}><label className="label">Email</label><input className="input" defaultValue={s.email || ''} {...register('email', { required: true })} /></div>
          <div style={{ flex: 1, minWidth: 150 }}><label className="label">Password</label><input className="input" placeholder="e.g. School@123" {...register('password', { required: true })} /></div>
          <button className="btn btn-primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save & Reveal'}</button>
        </form>
        {cred && (
          <div style={{ marginTop: 12, background: 'var(--success-tint)', border: '1px solid var(--success-line)', borderRadius: 8, padding: '10px 12px' }}>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--muted)' }}>Share these with the student</p>
            <p style={{ margin: '4px 0 0', fontFamily: 'monospace', color: 'var(--ink)' }}>Email: <b>{cred.email}</b></p>
            <p style={{ margin: '2px 0 0', fontFamily: 'monospace', color: 'var(--ink)' }}>Password: <b>{cred.password}</b></p>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionStudentsModal({ section, onClose }) {
  const open = Boolean(section)
  const sectionId = section?.id
  const [detailId, setDetailId] = useState(null)
  const { data: roster = [], isLoading } = useQuery({
    queryKey: ['section-roster', sectionId],
    queryFn: () => api.get(`/sections/${sectionId}/enrollments`, { params: { academicYearId: 1 } }).then(r => r.data.data ?? []),
    enabled: open,
  })
  return (
    <Modal open={open} onClose={() => { setDetailId(null); onClose() }}
      title={section ? `Students — ${section.classGrade?.name ?? 'Class'} ${section.name}` : ''} size="lg">
      {detailId ? (
        <StudentDetailView studentId={detailId} onBack={() => setDetailId(null)} />
      ) : isLoading ? <p style={{ color: 'var(--faint)', padding: '16px 0' }}>Loading…</p>
        : roster.length === 0 ? <p style={{ color: 'var(--faint)', textAlign: 'center', padding: '24px 0' }}>No students enrolled in this section.</p>
        : (
          <table className="data-table" style={{ border: '1px solid var(--line)', borderRadius: 8 }}>
            <thead><tr><th style={{ width: 60 }}>Roll</th><th>Name</th><th>Adm. No</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {roster.map(r => (
                <tr key={r.studentId}>
                  <td>{r.rollNo ?? '—'}</td>
                  <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                  <td style={{ color: 'var(--muted)' }}>{r.admissionNo ?? '—'}</td>
                  <td><span className="badge badge-green">{r.status ?? 'ACTIVE'}</span></td>
                  <td style={{ textAlign: 'right' }}><button className="btn btn-secondary btn-sm" onClick={() => setDetailId(r.studentId)}>Details &amp; Login</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </Modal>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function TableShell({ cols, children, emptyMessage }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {cols.map(c => (
              <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {children ?? (
            <tr>
              <td colSpan={cols.length} className="text-center py-12 text-slate-400 text-sm">
                {emptyMessage ?? 'No data.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function SkeletonRows({ cols, count = 3 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i}>
      <td colSpan={cols}>
        <div className="h-9 bg-slate-100 m-2 rounded animate-pulse" />
      </td>
    </tr>
  ))
}

function SectionHeader({ title, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      {onAdd && (
        <button className="btn-primary text-sm" onClick={onAdd}>
          + {addLabel ?? 'Add'}
        </button>
      )}
    </div>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(33,30,24,0.42)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function DeleteConfirm({ message, onConfirm, onCancel, loading }) {
  return (
    <ModalShell title="Confirm Delete" onClose={onCancel}>
      <p className="text-sm text-slate-600 mb-5">{message}</p>
      <div className="flex justify-end gap-3">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </ModalShell>
  )
}

function toList(data) {
  return Array.isArray(data) ? data : data?.content ?? []
}

// ── Academic Years Tab ─────────────────────────────────────────────────────────

function AcademicYearsTab() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then(r => r.data.data),
  })
  const list = toList(data)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', startDate: '', endDate: '', isCurrent: false },
  })

  const createMutation = useMutation({
    mutationFn: body => api.post('/academic-years', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic-years'] })
      setShowAdd(false)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/academic-years/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic-years'] })
      setDeleteId(null)
    },
  })

  return (
    <div>
      <SectionHeader title="Academic Years" onAdd={() => setShowAdd(true)} addLabel="Add Year" />
      <TableShell cols={['Name', 'Start', 'End', 'Status', '']}>
        {isLoading
          ? <SkeletonRows cols={5} />
          : list.length === 0
            ? null
            : list.map(y => (
                <tr key={y.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{y.name}</td>
                  <td className="px-4 py-3 text-slate-500">{y.startDate}</td>
                  <td className="px-4 py-3 text-slate-500">{y.endDate}</td>
                  <td className="px-4 py-3">
                    {y.isCurrent
                      ? <span className="badge-green">Current</span>
                      : <span className="badge-gray">Inactive</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      onClick={() => setDeleteId(y.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
        }
      </TableShell>

      {showAdd && (
        <ModalShell title="Add Academic Year" onClose={() => { setShowAdd(false); reset() }}>
          <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
            <Field label="Name" error={errors.name?.message}>
              <input className="input" {...register('name', { required: 'Name is required' })} placeholder="e.g. 2025-26" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Start Date" error={errors.startDate?.message}>
                <input type="date" className="input" {...register('startDate', { required: 'Required' })} />
              </Field>
              <Field label="End Date" error={errors.endDate?.message}>
                <input type="date" className="input" {...register('endDate', { required: 'Required' })} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
              <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" {...register('isCurrent')} />
              Mark as current year
            </label>
            {createMutation.isError && (
              <p className="text-xs text-red-600">{createMutation.error?.response?.data?.message ?? 'Failed to save.'}</p>
            )}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" className="btn-secondary" onClick={() => { setShowAdd(false); reset() }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving…' : 'Add Year'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {deleteId && (
        <DeleteConfirm
          message="Delete this academic year? Terms and related data may also be affected."
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

// ── Terms Tab ──────────────────────────────────────────────────────────────────

function TermsTab() {
  const qc = useQueryClient()
  const [selectedYearId, setSelectedYearId] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const { data: yearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then(r => r.data.data),
  })
  const years = toList(yearsData)

  const { data: termsData, isLoading } = useQuery({
    queryKey: ['terms', selectedYearId],
    queryFn: () => api.get('/terms', { params: { yearId: selectedYearId } }).then(r => r.data.data),
    enabled: !!selectedYearId,
  })
  const terms = toList(termsData)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { name: '', startDate: '', endDate: '', academicYearId: '' },
  })

  const createMutation = useMutation({
    mutationFn: body => api.post('/terms', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['terms'] })
      setShowAdd(false)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/terms/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['terms'] })
      setDeleteId(null)
    },
  })

  function openAdd() {
    setValue('academicYearId', selectedYearId)
    setShowAdd(true)
  }

  return (
    <div>
      <SectionHeader title="Terms" onAdd={selectedYearId ? openAdd : undefined} addLabel="Add Term" />
      <div className="mb-4">
        <select
          className="input max-w-xs"
          value={selectedYearId}
          onChange={e => setSelectedYearId(e.target.value)}
        >
          <option value="">Select academic year…</option>
          {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select>
      </div>

      {selectedYearId ? (
        <TableShell cols={['Name', 'Start', 'End', '']} emptyMessage="No terms for this year.">
          {isLoading
            ? <SkeletonRows cols={4} />
            : terms.length === 0
              ? null
              : terms.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{t.name}</td>
                    <td className="px-4 py-3 text-slate-500">{t.startDate}</td>
                    <td className="px-4 py-3 text-slate-500">{t.endDate}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50" onClick={() => setDeleteId(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))
          }
        </TableShell>
      ) : (
        <p className="text-sm text-slate-400 py-10 text-center">Choose an academic year to view its terms.</p>
      )}

      {showAdd && (
        <ModalShell title="Add Term" onClose={() => { setShowAdd(false); reset() }}>
          <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
            <Field label="Academic Year" error={errors.academicYearId?.message}>
              <select className="input" {...register('academicYearId', { required: 'Required' })}>
                <option value="">Select…</option>
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </Field>
            <Field label="Term Name" error={errors.name?.message}>
              <input className="input" {...register('name', { required: 'Name is required' })} placeholder="e.g. Term 1" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Start Date" error={errors.startDate?.message}>
                <input type="date" className="input" {...register('startDate', { required: 'Required' })} />
              </Field>
              <Field label="End Date" error={errors.endDate?.message}>
                <input type="date" className="input" {...register('endDate', { required: 'Required' })} />
              </Field>
            </div>
            {createMutation.isError && (
              <p className="text-xs text-red-600">{createMutation.error?.response?.data?.message ?? 'Failed to save.'}</p>
            )}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" className="btn-secondary" onClick={() => { setShowAdd(false); reset() }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving…' : 'Add Term'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {deleteId && (
        <DeleteConfirm
          message="Delete this term? Associated exam data will be affected."
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

// ── Classes Tab ────────────────────────────────────────────────────────────────

function ClassesTab() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(r => r.data.data),
  })
  const list = toList(data)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '' },
  })

  const createMutation = useMutation({
    mutationFn: body => api.post('/classes', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      setShowAdd(false)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/classes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      setDeleteId(null)
    },
  })

  return (
    <div>
      <SectionHeader title="Classes" onAdd={() => setShowAdd(true)} addLabel="Add Class" />
      <TableShell cols={['Class Name', '']} emptyMessage="No classes found.">
        {isLoading
          ? <SkeletonRows cols={2} />
          : list.length === 0
            ? null
            : list.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50" onClick={() => setDeleteId(c.id)}>Delete</button>
                  </td>
                </tr>
              ))
        }
      </TableShell>

      {showAdd && (
        <ModalShell title="Add Class" onClose={() => { setShowAdd(false); reset() }}>
          <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
            <Field label="Class Name" error={errors.name?.message}>
              <input className="input" {...register('name', { required: 'Name is required' })} placeholder="e.g. Grade 5" />
            </Field>
            {createMutation.isError && (
              <p className="text-xs text-red-600">{createMutation.error?.response?.data?.message ?? 'Failed to save.'}</p>
            )}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" className="btn-secondary" onClick={() => { setShowAdd(false); reset() }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving…' : 'Add Class'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {deleteId && (
        <DeleteConfirm
          message="Delete this class? Sections assigned to it may also be removed."
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

// ── Sections Tab ───────────────────────────────────────────────────────────────

function SectionsTab() {
  const qc = useQueryClient()
  const [selectedClassId, setSelectedClassId] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [subjTarget, setSubjTarget] = useState(null)
  const [studentsTarget, setStudentsTarget] = useState(null)

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(r => r.data.data),
  })
  const classes = toList(classesData)

  const { data: teachersData } = useQuery({
    queryKey: ['teachers-all'],
    queryFn: () => api.get('/teachers', { params: { size: 200 } }).then(r => r.data.data),
  })
  const teachers = toList(teachersData)

  const { data: sectionsData, isLoading } = useQuery({
    queryKey: ['sections', selectedClassId],
    queryFn: () => api.get('/sections', { params: { classGradeId: selectedClassId } }).then(r => r.data.data),
    enabled: !!selectedClassId,
  })
  const sections = toList(sectionsData)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { name: '', classGradeId: '', classTeacherId: '' },
  })

  const createMutation = useMutation({
    mutationFn: body => api.post('/sections', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sections'] })
      setShowAdd(false)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/sections/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sections'] })
      setDeleteId(null)
    },
  })

  function openAdd() {
    setValue('classGradeId', selectedClassId)
    setShowAdd(true)
  }

  return (
    <div>
      <SectionHeader title="Sections" onAdd={selectedClassId ? openAdd : undefined} addLabel="Add Section" />
      <div className="mb-4">
        <select
          className="input max-w-xs"
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
        >
          <option value="">Select class…</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {selectedClassId ? (
        <TableShell cols={['Name', 'Class', 'Class Teacher', '']} emptyMessage="No sections for this class.">
          {isLoading
            ? <SkeletonRows cols={4} />
            : sections.length === 0
              ? null
              : sections.map(s => {
                  const cls = classes.find(c => String(c.id) === String(s.classGradeId ?? s.classGrade?.id))
                  const teacher = s.classTeacher
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                      <td className="px-4 py-3 text-slate-500">{cls?.name ?? s.classGrade?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {teacher ? `${teacher.firstName} ${teacher.lastName}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded hover:bg-indigo-50 mr-1" onClick={() => setStudentsTarget(s)}>Students</button>
                        <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded hover:bg-indigo-50 mr-1" onClick={() => setSubjTarget(s)}>Subjects</button>
                        <button className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50" onClick={() => setDeleteId(s.id)}>Delete</button>
                      </td>
                    </tr>
                  )
                })
          }
        </TableShell>
      ) : (
        <p className="text-sm text-slate-400 py-10 text-center">Choose a class to view its sections.</p>
      )}

      {showAdd && (
        <ModalShell title="Add Section" onClose={() => { setShowAdd(false); reset() }}>
          <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
            <Field label="Class" error={errors.classGradeId?.message}>
              <select className="input" {...register('classGradeId', { required: 'Required' })}>
                <option value="">Select…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Section Name" error={errors.name?.message}>
              <input className="input" {...register('name', { required: 'Name is required' })} placeholder="e.g. A" />
            </Field>
            <Field label="Class Teacher (optional)">
              <select className="input" {...register('classTeacherId')}>
                <option value="">None assigned</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
              </select>
            </Field>
            {createMutation.isError && (
              <p className="text-xs text-red-600">{createMutation.error?.response?.data?.message ?? 'Failed to save.'}</p>
            )}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" className="btn-secondary" onClick={() => { setShowAdd(false); reset() }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving…' : 'Add Section'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {deleteId && (
        <DeleteConfirm
          message="Delete this section? Student assignments will be removed."
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
          loading={deleteMutation.isPending}
        />
      )}

      <SectionSubjectsModal section={subjTarget} classGradeId={Number(selectedClassId)} onClose={() => setSubjTarget(null)} />
      <SectionStudentsModal section={studentsTarget} onClose={() => setStudentsTarget(null)} />
    </div>
  )
}

// ── Subjects Tab ───────────────────────────────────────────────────────────────

function SubjectsTab() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data.data),
  })
  const list = toList(data)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', code: '', description: '' },
  })

  const createMutation = useMutation({
    mutationFn: body => api.post('/subjects', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] })
      setShowAdd(false)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/subjects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] })
      setDeleteId(null)
    },
  })

  return (
    <div>
      <SectionHeader title="Subjects" onAdd={() => setShowAdd(true)} addLabel="Add Subject" />
      <TableShell cols={['Code', 'Name', 'Description', '']} emptyMessage="No subjects found.">
        {isLoading
          ? <SkeletonRows cols={4} />
          : list.length === 0
            ? null
            : list.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded">{s.code}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{s.description || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50" onClick={() => setDeleteId(s.id)}>Delete</button>
                  </td>
                </tr>
              ))
        }
      </TableShell>

      {showAdd && (
        <ModalShell title="Add Subject" onClose={() => { setShowAdd(false); reset() }}>
          <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Subject Name" error={errors.name?.message}>
                <input className="input" {...register('name', { required: 'Name is required' })} placeholder="e.g. Mathematics" />
              </Field>
              <Field label="Code" error={errors.code?.message}>
                <input className="input" {...register('code', { required: 'Code is required' })} placeholder="e.g. MTH101" />
              </Field>
            </div>
            <Field label="Description">
              <textarea className="input" rows={2} {...register('description')} placeholder="Optional description" />
            </Field>
            {createMutation.isError && (
              <p className="text-xs text-red-600">{createMutation.error?.response?.data?.message ?? 'Failed to save.'}</p>
            )}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" className="btn-secondary" onClick={() => { setShowAdd(false); reset() }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving…' : 'Add Subject'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {deleteId && (
        <DeleteConfirm
          message="Delete this subject? It will be removed from exam configurations."
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

// ── Page Shell ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'years', label: 'Academic Years' },
  { key: 'terms', label: 'Terms' },
  { key: 'classes', label: 'Classes' },
  { key: 'sections', label: 'Sections' },
  { key: 'subjects', label: 'Subjects' },
]

export default function AcademicsPage() {
  const [activeTab, setActiveTab] = useState('years')

  return (
    <div className="page">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-800">Academics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage years, terms, classes, sections, and subjects.</p>
        </div>

        {/* Pill tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={[
                'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === t.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'years' && <AcademicYearsTab />}
        {activeTab === 'terms' && <TermsTab />}
        {activeTab === 'classes' && <ClassesTab />}
        {activeTab === 'sections' && <SectionsTab />}
        {activeTab === 'subjects' && <SubjectsTab />}
      </div>
    </div>
  )
}
