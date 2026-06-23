import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '../../app/axios'
import { useAuth } from '../../auth/AuthContext'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'

// ── Gender normalizer ─────────────────────────────────────────────────────────
// DB may store "M"/"F" or "MALE"/"FEMALE"
function normalizeGender(g) {
  if (!g) return ''
  const u = g.toUpperCase()
  if (u === 'M' || u === 'MALE')   return 'MALE'
  if (u === 'F' || u === 'FEMALE') return 'FEMALE'
  return 'OTHER'
}
function genderLabel(g) {
  const n = normalizeGender(g)
  return n === 'MALE' ? 'Male' : n === 'FEMALE' ? 'Female' : n === 'OTHER' ? 'Other' : '—'
}

// ── Validation ────────────────────────────────────────────────────────────────
const studentSchema = z.object({
  firstName:   z.string().min(1, 'Required'),
  lastName:    z.string().min(1, 'Required'),
  admissionNo: z.string().min(1, 'Required'),
  dob:         z.string().optional(),
  gender:      z.enum(['MALE', 'FEMALE', 'OTHER']).default('MALE'),
  phone:       z.string().optional(),
  address:     z.string().optional(),
})

const credSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Min. 6 characters'),
})

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, error, children, hint }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ── Student info form (no credentials) ───────────────────────────────────────
function StudentForm({ defaultValues, onSubmit, isPending, isEdit }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: defaultValues
      ? { ...defaultValues, gender: normalizeGender(defaultValues.gender) || 'MALE' }
      : { gender: 'MALE' },
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name *" error={errors.firstName?.message}>
          <input className="input" placeholder="Ravi" {...register('firstName')} />
        </Field>
        <Field label="Last Name *" error={errors.lastName?.message}>
          <input className="input" placeholder="Sharma" {...register('lastName')} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Admission No. *" error={errors.admissionNo?.message}>
          <input className="input" placeholder="ADM-2024-001" {...register('admissionNo')} />
        </Field>
        <Field label="Gender" error={errors.gender?.message}>
          <select className="input" {...register('gender')}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date of Birth" error={errors.dob?.message}>
          <input type="date" className="input" {...register('dob')} />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <input className="input" placeholder="+91 98765 43210" {...register('phone')} />
        </Field>
      </div>
      <Field label="Address" error={errors.address?.message}>
        <textarea className="input" rows={2} placeholder="House No., Street, City" {...register('address')} />
      </Field>
      <div className="flex justify-end pt-1">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Student'}
        </button>
      </div>
    </form>
  )
}

// ── Credential modal (set / reset login) ─────────────────────────────────────
function CredentialModal({ open, onClose, student, onSuccess }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(credSchema),
    defaultValues: { email: student?.email ?? '' },
  })
  const mutation = useMutation({
    mutationFn: ({ email, password }) =>
      api.put(`/students/${student.id}/credentials`, { email, password }).then(r => r.data),
    onSuccess: (_, vars) => {
      onSuccess({ email: vars.email, password: vars.password })
      reset()
    },
  })

  const hasLogin = Boolean(student?.email)

  return (
    <Modal open={open} onClose={() => { onClose(); reset() }} title={hasLogin ? 'Reset Login Password' : 'Set Student Login'}>
      {student && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-indigo-700">{student.firstName?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{student.firstName} {student.lastName}</p>
              <p className="text-xs text-slate-500">Admission: {student.admissionNo}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
            <Field label="Login Email *" error={errors.email?.message}
              hint="This is the email the student will use to log in">
              <input type="email" className="input" placeholder="student@school.edu" {...register('email')} />
            </Field>
            <Field label={hasLogin ? 'New Password *' : 'Password *'} error={errors.password?.message}
              hint="Min. 6 characters — share this with the student">
              <input type="text" className="input" placeholder="e.g. School@123" {...register('password')} />
            </Field>

            {mutation.isError && (
              <p className="text-xs text-red-500">{mutation.error?.response?.data?.message ?? 'Failed to set credentials'}</p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" className="btn-secondary" onClick={() => { onClose(); reset() }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : hasLogin ? 'Reset Password' : 'Create Login'}
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  )
}

// ── Credentials success popup ─────────────────────────────────────────────────
function CredentialsPopup({ open, onClose, data }) {
  return (
    <Modal open={open} onClose={onClose} title="Login Credentials" size="sm">
      {data && (
        <div className="space-y-4">
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
            Credentials set for <strong>{data.name}</strong>. Share with the student.
          </p>
          <div className="space-y-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Email (Login ID)</p>
              <p className="font-mono font-bold text-slate-900">{data.email}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Password</p>
              <p className="font-mono font-bold text-slate-900">{data.password}</p>
            </div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              Student should go to the school portal and click <strong>Student / Parent Login</strong>, then enter the above credentials.
            </p>
          </div>
          <div className="flex justify-end">
            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Delete confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ name, isPending, onConfirm, onCancel }) {
  return (
    <div className="text-center space-y-4 py-2">
      <p className="text-sm text-slate-600">
        Remove <strong>{name}</strong> from the system? This cannot be undone.
      </p>
      <div className="flex justify-center gap-3">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-danger" onClick={onConfirm} disabled={isPending}>
          {isPending ? 'Deleting…' : 'Delete student'}
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StudentsPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()

  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(0)
  const [showAdd, setShowAdd]           = useState(false)
  const [editStudent, setEditStudent]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [credTarget, setCredTarget]     = useState(null)   // student to set/reset login
  const [credPopup, setCredPopup]       = useState(null)   // { name, email, password }
  const [apiError, setApiError]         = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['students', search, page],
    queryFn: () => api.get('/students', { params: { search, page, size: 20 } }).then(r => r.data.data),
    keepPreviousData: true,
  })

  const students   = data?.content ?? data ?? []
  const totalPages = data?.totalPages ?? 0
  const totalCount = data?.totalElements ?? students.length

  const invalidate = () => qc.invalidateQueries({ queryKey: ['students'] })

  const createMutation = useMutation({
    mutationFn: body => api.post('/students', body).then(r => r.data),
    onSuccess: (res) => { invalidate(); setShowAdd(false); setApiError('') },
    onError: err => setApiError(err?.response?.data?.message ?? 'Could not create student.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/students/${id}`, body).then(r => r.data),
    onSuccess: () => { invalidate(); setEditStudent(null); setApiError('') },
    onError: err => setApiError(err?.response?.data?.message ?? 'Could not update student.'),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/students/${id}`).then(r => r.data),
    onSuccess: () => { invalidate(); setDeleteTarget(null) },
    onError: err => setApiError(err?.response?.data?.message ?? 'Could not delete student.'),
  })

  const columns = [
    {
      key: 'admissionNo', label: 'Adm. No.',
      render: row => <span className="font-mono text-xs text-slate-500">{row.admissionNo}</span>,
    },
    {
      key: 'name', label: 'Full Name',
      render: row => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-indigo-700">{row.firstName?.[0]?.toUpperCase()}</span>
          </div>
          <span className="font-semibold text-slate-800">{row.firstName} {row.lastName}</span>
        </div>
      ),
    },
    {
      key: 'gender', label: 'Gender',
      render: row => {
        const label = genderLabel(row.gender)
        const cls = normalizeGender(row.gender) === 'MALE' ? 'badge-gray' : normalizeGender(row.gender) === 'FEMALE' ? 'badge-blue' : 'badge-yellow'
        return <span className={cls}>{label}</span>
      },
    },
    {
      key: 'phone', label: 'Phone',
      render: row => <span className="text-slate-600 text-sm">{row.phone ?? '—'}</span>,
    },
    {
      key: 'login', label: 'Login',
      render: row => row.email
        ? (
          <div>
            <span className="text-xs text-slate-600">{row.email}</span>
            <span className="ml-1.5 text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
          </div>
        )
        : <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium">No login set</span>,
    },
    ...(isAdmin() ? [{
      key: 'actions', label: '',
      render: row => (
        <div className="flex justify-end gap-1 flex-wrap">
          <button
            className="btn-ghost !py-1 !px-2.5 text-xs text-indigo-600 hover:bg-indigo-50"
            onClick={() => { setApiError(''); setEditStudent(row) }}
          >Edit</button>
          <button
            className={`btn-ghost !py-1 !px-2.5 text-xs hover:bg-indigo-50 ${row.email ? 'text-slate-500' : 'text-indigo-600 font-semibold'}`}
            onClick={() => setCredTarget(row)}
          >
            {row.email ? 'Reset Login' : 'Set Login'}
          </button>
          <button
            className="btn-ghost !py-1 !px-2.5 text-xs text-red-500 hover:bg-red-50"
            onClick={() => setDeleteTarget(row)}
          >Delete</button>
        </div>
      ),
    }] : []),
  ]

  return (
    <div className="page space-y-5">
      <PageHeader
        title="Students"
        subtitle={totalCount > 0 ? `${totalCount} enrolled` : 'Manage student records'}
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <input
              className="input w-full sm:w-56"
              placeholder="Search by name, admission no…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
            />
            {isAdmin() && (
              <button className="btn-primary" onClick={() => { setApiError(''); setShowAdd(true) }}>
                + Add Student
              </button>
            )}
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={students}
        loading={isLoading}
        emptyMessage={search ? `No students match "${search}".` : 'No students yet. Add the first one.'}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-500">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button className="btn-secondary !py-1 !px-3 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button className="btn-secondary !py-1 !px-3 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {/* Add student */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setApiError('') }} title="Add Student">
        <StudentForm
          isEdit={false}
          isPending={createMutation.isPending}
          onSubmit={data => createMutation.mutate(data)}
        />
        {apiError && <p className="text-xs text-red-500 mt-2">{apiError}</p>}
      </Modal>

      {/* Edit student info */}
      <Modal open={Boolean(editStudent)} onClose={() => { setEditStudent(null); setApiError('') }} title="Edit Student">
        {editStudent && (
          <StudentForm
            isEdit={true}
            defaultValues={editStudent}
            isPending={updateMutation.isPending}
            onSubmit={data => updateMutation.mutate({ id: editStudent.id, ...data })}
          />
        )}
        {apiError && <p className="text-xs text-red-500 mt-2">{apiError}</p>}
      </Modal>

      {/* Set / Reset login credentials */}
      <CredentialModal
        open={Boolean(credTarget)}
        onClose={() => setCredTarget(null)}
        student={credTarget}
        onSuccess={({ email, password }) => {
          invalidate()
          setCredTarget(null)
          setCredPopup({ name: `${credTarget.firstName} ${credTarget.lastName}`, email, password })
        }}
      />

      {/* Credentials success popup */}
      <CredentialsPopup
        open={Boolean(credPopup)}
        onClose={() => setCredPopup(null)}
        data={credPopup}
      />

      {/* Delete */}
      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete Student" size="sm">
        <DeleteConfirm
          name={deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName}` : ''}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      </Modal>
    </div>
  )
}
