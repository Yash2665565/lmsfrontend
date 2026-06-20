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

// ─── Validation ───────────────────────────────────────────────
const baseSchema = z.object({
  firstName:   z.string().min(1, 'First name is required'),
  lastName:    z.string().min(1, 'Last name is required'),
  admissionNo: z.string().min(1, 'Admission number is required'),
  dob:         z.string().optional(),
  gender:      z.enum(['MALE', 'FEMALE', 'OTHER']).default('MALE'),
  phone:       z.string().optional(),
  address:     z.string().optional(),
  email:       z.string().email('Enter a valid email'),
  password:    z.string().optional(),
})

const createSchema = baseSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// ─── Field wrapper ────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ─── Student form ─────────────────────────────────────────────
function StudentForm({ defaultValues, onSubmit, isPending, submitLabel }) {
  const isEdit = Boolean(defaultValues?.id)
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(isEdit ? baseSchema : createSchema),
    defaultValues: defaultValues ?? { gender: 'MALE' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name *" error={errors.firstName?.message}>
          <input className="input" placeholder="Ravi" {...register('firstName')} />
        </Field>
        <Field label="Last Name *" error={errors.lastName?.message}>
          <input className="input" placeholder="Sharma" {...register('lastName')} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
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
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date of Birth" error={errors.dob?.message}>
          <input type="date" className="input" {...register('dob')} />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <input className="input" placeholder="+91 98765 43210" {...register('phone')} />
        </Field>
      </div>
      <Field label="Email *" error={errors.email?.message}>
        <input type="email" className="input" placeholder="student@school.edu" {...register('email')} />
      </Field>
      <Field label="Address" error={errors.address?.message}>
        <textarea className="input" rows={2} placeholder="House No., Street, City" {...register('address')} />
      </Field>
      {!isEdit && (
        <Field label="Password *" error={errors.password?.message}>
          <input type="password" className="input" placeholder="Min. 6 characters" {...register('password')} />
        </Field>
      )}
      <div className="flex justify-end pt-1">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

// ─── Delete confirm ───────────────────────────────────────────
function DeleteConfirm({ name, isPending, onConfirm, onCancel }) {
  return (
    <div className="text-center space-y-4 py-2">
      <p className="text-sm text-slate-600">
        Remove <strong className="text-slate-800">{name}</strong> from the system?
        This cannot be undone.
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

// ─── Gender badge ─────────────────────────────────────────────
function GenderBadge({ gender }) {
  const map = {
    MALE:   'badge-gray',
    FEMALE: 'badge-blue',
    OTHER:  'badge-yellow',
  }
  const label = gender
    ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()
    : '—'
  return <span className={map[gender] ?? 'badge-gray'}>{label}</span>
}

// ─── Main page ────────────────────────────────────────────────
export default function StudentsPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()

  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(0)
  const [showAdd, setShowAdd]         = useState(false)
  const [editStudent, setEditStudent] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [apiError, setApiError]       = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['students', search, page],
    queryFn: () =>
      api.get('/students', { params: { search, page, size: 20 } }).then(r => r.data.data),
    keepPreviousData: true,
  })

  const students    = data?.content ?? data ?? []
  const totalPages  = data?.totalPages ?? 0
  const totalCount  = data?.totalElements ?? students.length

  const invalidate = () => qc.invalidateQueries({ queryKey: ['students'] })

  const createMutation = useMutation({
    mutationFn: body => api.post('/students', body).then(r => r.data),
    onSuccess: () => { invalidate(); setShowAdd(false); setApiError('') },
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
      key: 'admissionNo',
      label: 'Admission No.',
      render: row => (
        <span className="font-mono text-xs text-slate-500">{row.admissionNo}</span>
      ),
    },
    {
      key: 'name',
      label: 'Full Name',
      render: row => (
        <span className="font-medium text-slate-800">
          {row.firstName} {row.lastName}
        </span>
      ),
    },
    {
      key: 'gender',
      label: 'Gender',
      render: row => <GenderBadge gender={row.gender} />,
    },
    {
      key: 'phone',
      label: 'Phone',
      render: row => <span className="text-slate-600">{row.phone ?? '—'}</span>,
    },
    {
      key: 'guardian',
      label: 'Guardian',
      render: row => (
        <span className="text-slate-600">{row.guardianName ?? row.guardian ?? '—'}</span>
      ),
    },
    ...(isAdmin()
      ? [{
          key: 'actions',
          label: '',
          render: row => (
            <div className="flex justify-end gap-1">
              <button
                className="btn-ghost !py-1 !px-2 text-xs text-indigo-600 hover:bg-indigo-50"
                onClick={() => { setApiError(''); setEditStudent(row) }}
                aria-label={`Edit ${row.firstName}`}
              >
                {/* Pencil icon */}
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828L7.5 15.328l-4 1 1-4 8.086-8.742z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="ml-1">Edit</span>
              </button>
              <button
                className="btn-ghost !py-1 !px-2 text-xs text-red-500 hover:bg-red-50"
                onClick={() => setDeleteTarget(row)}
                aria-label={`Delete ${row.firstName}`}
              >
                {/* Trash icon */}
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M9 3h2a1 1 0 011 1v1H8V4a1 1 0 011-1zM4 6h12M6 6l1 11h6l1-11" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="ml-1">Delete</span>
              </button>
            </div>
          ),
        }]
      : []),
  ]

  return (
    <div className="page space-y-5">
      <PageHeader
        title="Students"
        subtitle={totalCount > 0 ? `${totalCount} enrolled` : 'Manage student records'}
        actions={
          <div className="flex items-center gap-3">
            <input
              className="input w-64"
              placeholder="Search by name, admission no…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
            />
            {isAdmin() && (
              <button
                className="btn-primary"
                onClick={() => { setApiError(''); setShowAdd(true) }}
              >
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
        emptyMessage={
          search
            ? `No students match "${search}".`
            : 'No students yet. Add the first one.'
        }
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-500">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              className="btn-secondary !py-1 !px-3 text-xs"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <button
              className="btn-secondary !py-1 !px-3 text-xs"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setApiError('') }} title="Add Student">
        <StudentForm
          submitLabel="Add Student"
          isPending={createMutation.isPending}
          onSubmit={data => createMutation.mutate(data)}
        />
        {apiError && <p className="text-xs text-red-500 mt-2">{apiError}</p>}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={Boolean(editStudent)}
        onClose={() => { setEditStudent(null); setApiError('') }}
        title="Edit Student"
      >
        <StudentForm
          defaultValues={editStudent}
          submitLabel="Save Changes"
          isPending={updateMutation.isPending}
          onSubmit={data => updateMutation.mutate({ id: editStudent.id, ...data })}
        />
        {apiError && <p className="text-xs text-red-500 mt-2">{apiError}</p>}
      </Modal>

      {/* Delete modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Student"
        size="sm"
      >
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
