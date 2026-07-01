import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '../../app/axios'
import { allocationApi } from '../../api/allocationApi'
import { useAuth } from '../../auth/AuthContext'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'

const addSchema = z.object({
  firstName:     z.string().min(1, 'Required'),
  lastName:      z.string().min(1, 'Required'),
  email:         z.string().email('Invalid email'),
  password:      z.string().min(6, 'Min. 6 characters'),
  employeeNo:    z.string().optional(),
  qualification: z.string().optional(),
  joiningDate:   z.string().optional(),
})

const editSchema = z.object({
  firstName:     z.string().min(1, 'Required'),
  lastName:      z.string().optional(),
  email:         z.string().email('Invalid email'),
  password:      z.string().optional(),
  employeeNo:    z.string().optional(),
  qualification: z.string().optional(),
  joiningDate:   z.string().optional(),
})

function Field({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function TeacherForm({ defaultValues, onSubmit, isPending, isEdit, subjects = [], initialSubjectIds = [] }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(isEdit ? editSchema : addSchema),
    defaultValues,
  })
  const [selected, setSelected] = useState(() => new Set(initialSubjectIds.map(Number)))
  useEffect(() => { setSelected(new Set(initialSubjectIds.map(Number))) }, [JSON.stringify(initialSubjectIds)])
  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })
  return (
    <form onSubmit={handleSubmit(d => onSubmit(d, [...selected]))} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name *" error={errors.firstName?.message}>
          <input className="input" placeholder="Anjali" {...register('firstName')} />
        </Field>
        <Field label="Last Name" error={errors.lastName?.message}>
          <input className="input" placeholder="Mehta" {...register('lastName')} />
        </Field>
      </div>
      <Field label="Email *" error={errors.email?.message}>
        <input type="email" className="input" placeholder="teacher@school.edu" {...register('email')} />
      </Field>
      <Field label={isEdit ? 'New Password (leave blank to keep)' : 'Password *'} error={errors.password?.message}>
        <input type="password" className="input" placeholder={isEdit ? 'Leave blank to keep current' : 'Min. 6 characters'} {...register('password')} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Employee No." error={errors.employeeNo?.message}>
          <input className="input" placeholder="EMP-001" {...register('employeeNo')} />
        </Field>
        <Field label="Joining Date" error={errors.joiningDate?.message}>
          <input type="date" className="input" {...register('joiningDate')} />
        </Field>
      </div>
      <Field label="Qualification" error={errors.qualification?.message}>
        <input className="input" placeholder="e.g. M.Sc Mathematics, B.Ed" {...register('qualification')} />
      </Field>
      <div>
        <label className="label">Subject Expertise (subjects this teacher can teach)</label>
        {subjects.length === 0 ? (
          <p className="text-xs text-slate-400">No subjects available.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', maxHeight: 180, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 8, padding: 10 }}>
            {subjects.map(s => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                {s.name}
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end pt-1">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? (isEdit ? 'Saving…' : 'Adding…') : (isEdit ? 'Save Changes' : 'Add Teacher')}
        </button>
      </div>
    </form>
  )
}

function TeacherAllocationModal({ teacher, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-allocation', teacher?.id],
    queryFn: () => allocationApi.getTeacherReport(teacher.id),
    enabled: !!teacher,
  })
  const { data: expertise = [] } = useQuery({
    queryKey: ['teacher-expertise', teacher?.id],
    queryFn: () => allocationApi.getExpertise(teacher.id),
    enabled: !!teacher,
  })
  const teaching = data?.teaching ?? []
  const classTeacherOf = data?.classTeacherOf ?? []
  return (
    <Modal open={Boolean(teacher)} onClose={onClose} title={teacher ? `Allocation — ${teacher.name ?? teacher.firstName ?? 'Teacher'}` : ''} size="lg">
      {isLoading ? <Spinner /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[['Sections', data?.sectionCount ?? 0], ['Subject classes', data?.subjectCount ?? 0], ['Class teacher of', classTeacherOf.length]].map(([k, v]) => (
              <div key={k} style={{ flex: 1, minWidth: 120, background: 'var(--canvas-sunk)', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ margin: 0, fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, fontWeight: 500, color: 'var(--ink)' }}>{v}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</p>
              </div>
            ))}
          </div>

          {expertise.length > 0 && (
            <div>
              <p className="section-title" style={{ marginBottom: 8 }}>Subject Expertise</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {expertise.map(e => <span key={e.topicId} className="badge badge-green">{e.subjectName}</span>)}
              </div>
            </div>
          )}

          {classTeacherOf.length > 0 && (
            <div>
              <p className="section-title" style={{ marginBottom: 8 }}>Class Teacher Of</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {classTeacherOf.map((c, i) => <span key={i} className="badge badge-amber">{c}</span>)}
              </div>
            </div>
          )}

          <div>
            <p className="section-title" style={{ marginBottom: 8 }}>Teaches</p>
            {teaching.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--faint)' }}>Not assigned to any subject yet.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Section</th><th>Subject</th></tr></thead>
                  <tbody>
                    {teaching.map(t => (
                      <tr key={t.assignmentId}><td style={{ fontWeight: 600 }}>{t.sectionLabel}</td><td>{t.subjectName}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

function DeleteConfirm({ name, isPending, onConfirm, onCancel }) {
  return (
    <div className="text-center space-y-4 py-2">
      <p className="text-sm text-slate-600">
        Remove <strong className="text-slate-800">{name}</strong> from the staff list? This cannot be undone.
      </p>
      <div className="flex justify-center gap-3">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-danger" onClick={onConfirm} disabled={isPending}>
          {isPending ? 'Removing…' : 'Remove teacher'}
        </button>
      </div>
    </div>
  )
}

export default function TeachersPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()

  const [showAdd, setShowAdd]         = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [reportTarget, setReportTarget] = useState(null)
  const [apiError, setApiError]       = useState('')

  const { data: teachersRaw, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(r => r.data.data),
  })
  const teachers = teachersRaw?.content ?? teachersRaw ?? []

  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: allocationApi.getSubjects })

  // expertise of the teacher being edited, to preselect the checkboxes
  const { data: editExpertise = [] } = useQuery({
    queryKey: ['teacher-expertise', editTarget?.id],
    queryFn: () => allocationApi.getExpertise(editTarget.id),
    enabled: !!editTarget,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['teachers'] })

  const createMutation = useMutation({
    mutationFn: async ({ body, subjectIds }) => {
      const res = await api.post('/teachers', body)
      const id = res.data?.data?.id
      if (id) await allocationApi.setExpertise(id, subjectIds ?? [])
      return res.data
    },
    onSuccess: () => { invalidate(); setShowAdd(false); setApiError('') },
    onError: err => setApiError(err?.response?.data?.message ?? 'Could not add teacher.'),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, body, subjectIds }) => {
      const res = await api.put(`/teachers/${id}`, body)
      await allocationApi.setExpertise(id, subjectIds ?? [])
      return res.data
    },
    onSuccess: () => { invalidate(); setEditTarget(null); setApiError('') },
    onError: err => setApiError(err?.response?.data?.message ?? 'Could not update teacher.'),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/teachers/${id}`).then(r => r.data),
    onSuccess: () => { invalidate(); setDeleteTarget(null) },
    onError: err => setApiError(err?.response?.data?.message ?? 'Could not remove teacher.'),
  })

  const nameOf = row => row.firstName ? `${row.firstName} ${row.lastName ?? ''}`.trim() : row.name ?? '—'

  const columns = [
    {
      key: 'name', label: 'Name',
      render: row => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-violet-700">{nameOf(row)[0]?.toUpperCase()}</span>
          </div>
          <span className="font-semibold text-slate-800">{nameOf(row)}</span>
        </div>
      ),
    },
    {
      key: 'email', label: 'Email',
      render: row => <span className="text-slate-600">{row.email ?? '—'}</span>,
    },
    {
      key: 'employeeNo', label: 'Employee No.',
      render: row => <span className="font-mono text-xs text-slate-500">{row.employeeNo ?? '—'}</span>,
    },
    {
      key: 'qualification', label: 'Qualification',
      render: row => <span className="text-slate-600 text-sm">{row.qualification ?? '—'}</span>,
    },
    {
      key: 'joiningDate', label: 'Joined',
      render: row => (
        <span className="text-slate-600">
          {row.joiningDate ? new Date(row.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    ...(isAdmin() ? [{
      key: 'actions', label: '',
      render: row => (
        <div className="flex justify-end gap-2">
          <button
            className="btn-ghost !py-1 !px-2.5 text-xs text-indigo-600 hover:bg-indigo-50"
            onClick={() => setReportTarget(row)}
          >
            Allocation
          </button>
          <button
            className="btn-ghost !py-1 !px-2.5 text-xs text-indigo-600 hover:bg-indigo-50"
            onClick={() => { setApiError(''); setEditTarget(row) }}
          >
            Edit
          </button>
          <button
            className="btn-ghost !py-1 !px-2.5 text-xs text-red-500 hover:bg-red-50"
            onClick={() => setDeleteTarget(row)}
          >
            Remove
          </button>
        </div>
      ),
    }] : []),
  ]

  return (
    <div className="page space-y-5">
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} staff member${teachers.length !== 1 ? 's' : ''}`}
        actions={isAdmin() && (
          <button className="btn-primary" onClick={() => { setApiError(''); setShowAdd(true) }}>
            + Add Teacher
          </button>
        )}
      />

      <DataTable columns={columns} data={teachers} loading={isLoading} emptyMessage="No teachers yet." />

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setApiError('') }} title="Add Teacher">
        <TeacherForm
          isEdit={false}
          isPending={createMutation.isPending}
          subjects={subjects}
          onSubmit={({ firstName, lastName, ...rest }, subjectIds) =>
            createMutation.mutate({ body: { name: firstName, lname: lastName, ...rest }, subjectIds })
          }
        />
        {apiError && <p className="text-xs text-red-500 mt-2">{apiError}</p>}
      </Modal>

      {/* Edit modal */}
      <Modal open={Boolean(editTarget)} onClose={() => { setEditTarget(null); setApiError('') }} title="Edit Teacher">
        {editTarget && (
          <TeacherForm
            isEdit={true}
            isPending={updateMutation.isPending}
            subjects={subjects}
            initialSubjectIds={editExpertise.map(e => e.topicId)}
            defaultValues={{
              firstName: editTarget.name?.split(' ')[0] ?? editTarget.firstName ?? '',
              lastName: editTarget.name?.split(' ').slice(1).join(' ') ?? editTarget.lastName ?? '',
              email: editTarget.email ?? '',
              employeeNo: editTarget.employeeNo ?? '',
              qualification: editTarget.qualification ?? '',
              joiningDate: editTarget.joiningDate ? String(editTarget.joiningDate).slice(0, 10) : '',
            }}
            onSubmit={({ firstName, lastName, password, ...rest }, subjectIds) =>
              updateMutation.mutate({
                id: editTarget.id,
                body: { name: firstName, lname: lastName, ...(password ? { password } : {}), ...rest },
                subjectIds,
              })
            }
          />
        )}
        {apiError && <p className="text-xs text-red-500 mt-2">{apiError}</p>}
      </Modal>

      {/* Allocation report modal */}
      <TeacherAllocationModal teacher={reportTarget} onClose={() => setReportTarget(null)} />

      {/* Delete modal */}
      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Remove Teacher" size="sm">
        <DeleteConfirm
          name={deleteTarget ? nameOf(deleteTarget) : ''}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      </Modal>
    </div>
  )
}
