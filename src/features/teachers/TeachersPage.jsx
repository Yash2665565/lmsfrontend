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
const teacherSchema = z.object({
  firstName:     z.string().min(1, 'First name is required'),
  lastName:      z.string().min(1, 'Last name is required'),
  email:         z.string().email('Enter a valid email'),
  password:      z.string().min(6, 'Password must be at least 6 characters'),
  employeeNo:    z.string().optional(),
  qualification: z.string().optional(),
  joiningDate:   z.string().optional(),
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

// ─── Teacher form ─────────────────────────────────────────────
function TeacherForm({ onSubmit, isPending }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(teacherSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name *" error={errors.firstName?.message}>
          <input className="input" placeholder="Anjali" {...register('firstName')} />
        </Field>
        <Field label="Last Name *" error={errors.lastName?.message}>
          <input className="input" placeholder="Mehta" {...register('lastName')} />
        </Field>
      </div>
      <Field label="Email *" error={errors.email?.message}>
        <input type="email" className="input" placeholder="teacher@school.edu" {...register('email')} />
      </Field>
      <Field label="Password *" error={errors.password?.message}>
        <input type="password" className="input" placeholder="Min. 6 characters" {...register('password')} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
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
      <div className="flex justify-end pt-1">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Adding…' : 'Add Teacher'}
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
        Remove <strong className="text-slate-800">{name}</strong> from the staff list?
        This cannot be undone.
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

// ─── Main page ────────────────────────────────────────────────
export default function TeachersPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()

  const [showAdd, setShowAdd]         = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [apiError, setApiError]       = useState('')

  const { data: teachersRaw, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(r => r.data.data),
  })
  const teachers = teachersRaw?.content ?? teachersRaw ?? []

  const invalidate = () => qc.invalidateQueries({ queryKey: ['teachers'] })

  const createMutation = useMutation({
    mutationFn: body => api.post('/teachers', body).then(r => r.data),
    onSuccess: () => { invalidate(); setShowAdd(false); setApiError('') },
    onError: err => setApiError(err?.response?.data?.message ?? 'Could not add teacher.'),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/teachers/${id}`).then(r => r.data),
    onSuccess: () => { invalidate(); setDeleteTarget(null) },
    onError: err => setApiError(err?.response?.data?.message ?? 'Could not remove teacher.'),
  })

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: row => (
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-indigo-600">
              {(row.firstName ?? row.name ?? '?')[0].toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-slate-800">
            {row.firstName
              ? `${row.firstName} ${row.lastName ?? ''}`.trim()
              : row.name ?? '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: row => <span className="text-slate-600">{row.email ?? '—'}</span>,
    },
    {
      key: 'employeeNo',
      label: 'Employee No.',
      render: row => (
        <span className="font-mono text-xs text-slate-500">
          {row.employeeNo ?? '—'}
        </span>
      ),
    },
    {
      key: 'qualification',
      label: 'Qualification',
      render: row => <span className="text-slate-600">{row.qualification ?? '—'}</span>,
    },
    {
      key: 'joiningDate',
      label: 'Joining Date',
      render: row => (
        <span className="text-slate-600">
          {row.joiningDate
            ? new Date(row.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'}
        </span>
      ),
    },
    ...(isAdmin()
      ? [{
          key: 'actions',
          label: '',
          render: row => (
            <div className="flex justify-end">
              <button
                className="btn-ghost !py-1 !px-2 text-xs text-red-500 hover:bg-red-50"
                onClick={() => setDeleteTarget(row)}
                aria-label={`Remove ${row.firstName ?? row.name}`}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M9 3h2a1 1 0 011 1v1H8V4a1 1 0 011-1zM4 6h12M6 6l1 11h6l1-11" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="ml-1">Remove</span>
              </button>
            </div>
          ),
        }]
      : []),
  ]

  return (
    <div className="page space-y-5">
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} staff member${teachers.length !== 1 ? 's' : ''}`}
        actions={
          isAdmin() && (
            <button
              className="btn-primary"
              onClick={() => { setApiError(''); setShowAdd(true) }}
            >
              + Add Teacher
            </button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={teachers}
        loading={isLoading}
        emptyMessage="No teachers yet. Add the first staff member."
      />

      {/* Add modal */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setApiError('') }}
        title="Add Teacher"
      >
        <TeacherForm
          isPending={createMutation.isPending}
          onSubmit={({ firstName, lastName, ...rest }) =>
            createMutation.mutate({ name: firstName, lname: lastName, ...rest })
          }
        />
        {apiError && <p className="text-xs text-red-500 mt-2">{apiError}</p>}
      </Modal>

      {/* Delete modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Remove Teacher"
        size="sm"
      >
        <DeleteConfirm
          name={
            deleteTarget
              ? (deleteTarget.firstName
                  ? `${deleteTarget.firstName} ${deleteTarget.lastName ?? ''}`.trim()
                  : deleteTarget.name ?? 'this teacher')
              : ''
          }
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      </Modal>
    </div>
  )
}
