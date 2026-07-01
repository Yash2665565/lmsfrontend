import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../auth/AuthContext'
import api from '../../app/axios'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'

// ─── Notice card ──────────────────────────────────────────────
function NoticeCard({ notice, canDelete, onDelete }) {
  const date = notice.createdAt
    ? new Date(notice.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : notice.date ?? ''

  return (
    <div className="card p-5 flex flex-col gap-3 relative group">
      {/* Mandatory badge */}
      {(notice.mandatory === '1' || notice.mandatory === true || notice.mandatory === 1) && (
        <span className="badge badge-red self-start">Mandatory</span>
      )}

      {/* Target type pill */}
      {notice.targetType && (
        <span className="badge badge-purple self-start">{notice.targetType}</span>
      )}

      <div className="flex-1">
        <h3 className="font-semibold text-slate-800 leading-snug mb-1">
          {notice.name ?? notice.title ?? 'Notice'}
        </h3>
        <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
          {notice.content ?? notice.body ?? ''}
        </p>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-400">{date}</span>
        {canDelete && (
          <button
            className="text-xs text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 px-1.5 py-0.5 rounded hover:bg-red-50"
            onClick={() => onDelete(notice.id)}
            aria-label="Delete notice"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

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

// ─── Post notice form ─────────────────────────────────────────
function PostNoticeForm({ onSubmit, isPending }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { targetType: 'SCHOOL', mandatory: false },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Title *" error={errors.name?.message}>
        <input
          className="input"
          placeholder="e.g. Holiday announcement"
          {...register('name', { required: 'Title is required' })}
        />
      
      </Field>
      <Field label="Document " >
        <input
          className="input"
          type="file"
          
          {...register('name', { required: 'Title is required' })}
        />
      
      </Field>
      <Field label="Content *" error={errors.content?.message}>
        <textarea
          className="input"
          rows={4}
          placeholder="Write the notice content here…"
          {...register('content', { required: 'Content is required' })}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Target" error={errors.targetType?.message}>
          <select className="input" {...register('targetType')}>
            <option value="SCHOOL">School-wide</option>
            <option value="CLASS">Class</option>
            <option value="SECTION">Section</option>
          </select>
        </Field>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              {...register('mandatory')}
            />
            <span className="text-sm font-medium text-slate-700">Mark as Mandatory</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end pt-1">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? 'Posting…' : 'Post Notice'}
        </button>
      </div>
    </form>
  )
}

// ─── Empty state ──────────────────────────────────────────────
function EmptyNotices({ canPost, onPost }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400" aria-hidden="true">
          <path d="M15 17H20L18.59 15.59A6 6 0 0014.5 10.05V7a2.5 2.5 0 10-5 0v3.05A6 6 0 006 16H11M12 21a2 2 0 002-2H10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-600 mb-1">No notices posted yet</p>
      {canPost && (
        <p className="text-xs text-slate-400">
          Post your first notice to inform the school community.{' '}
          <button className="text-indigo-600 hover:underline" onClick={onPost}>
            Post now
          </button>
        </p>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────
export default function NoticesPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()

  const [showPost, setShowPost] = useState(false)
  const [apiError, setApiError] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const { data: noticesRaw, isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => api.get('/notices').then(r => r.data.data),
  })
  const notices = noticesRaw?.content ?? noticesRaw ?? []

  const invalidate = () => qc.invalidateQueries({ queryKey: ['notices'] })

  const createMutation = useMutation({
    mutationFn: body => api.post('/notices', body).then(r => r.data),
    onSuccess: () => { invalidate(); setShowPost(false); setApiError('') },
    onError: err => setApiError(err?.response?.data?.message ?? 'Could not post notice.'),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/notices/${id}`).then(r => r.data),
    onSuccess: () => { invalidate(); setDeleteId(null) },
  })

  const handleDelete = (id) => {
    if (deleteMutation.isPending) return
    deleteMutation.mutate(id)
  }

  return (
    <div className="page space-y-6">
      <PageHeader
        title="Notices"
        subtitle="School-wide announcements and updates"
        actions={
          isAdmin() && (
            <button
              className="btn-primary"
              onClick={() => { setApiError(''); setShowPost(true) }}
            >
              + Post Notice
            </button>
          )
        }
      />

      {isLoading ? (
        <Spinner />
      ) : notices.length === 0 ? (
        <EmptyNotices canPost={isAdmin()} onPost={() => setShowPost(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notices.map(notice => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              canDelete={isAdmin()}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Post notice modal */}
      <Modal
        open={showPost}
        onClose={() => { setShowPost(false); setApiError('') }}
        title="Post Notice"
      >
        <PostNoticeForm
          isPending={createMutation.isPending}
          onSubmit={data => createMutation.mutate({ ...data, mandatory: data.mandatory ? '1' : '0' })}
        />
        {apiError && <p className="text-xs text-red-500 mt-2">{apiError}</p>}
      </Modal>
    </div>
  )
}
