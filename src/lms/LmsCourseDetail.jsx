import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import api from '../app/axios'
import { lmsApi } from '../api/lmsApi'
import { useAuth } from '../auth/AuthContext'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import { IconBook, IconFileText, IconClipboard, IconChevronR, IconPlus } from '../components/ui/Icons'

function AddUnitModal({ open, onClose, subjectId }) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const mutation = useMutation({
    mutationFn: body => lmsApi.createUnit(subjectId, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['units', String(subjectId)] }); onClose(); reset() },
  })
  return (
    <Modal open={open} onClose={onClose} title="Add Unit">
      <form onSubmit={handleSubmit(d => mutation.mutate({ title: d.title, description: d.description, orderNo: Number(d.orderNo) || 0 }))} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="label">Unit Title *</label>
          <input className="input" placeholder="e.g. Introduction to Algebra" {...register('title', { required: true })} />
          {errors.title && <span className="field-error">Required</span>}
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={2} placeholder="Brief description..." {...register('description')} />
        </div>
        <div>
          <label className="label">Order</label>
          <input type="number" className="input" placeholder="1" {...register('orderNo')} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Adding…' : 'Add Unit'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function LmsCourseDetail() {
  const { subjectId } = useParams()
  const { isAdmin, isTeacher } = useAuth()
  const [addUnitOpen, setAddUnitOpen] = useState(false)

  const { data: subjects = [] } = useQuery({
    queryKey: ['lms-subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data.data ?? []),
  })
  const subject = subjects.find(s => String(s.id) === subjectId)

  const { data: units = [], isLoading } = useQuery({
    queryKey: ['units', subjectId],
    queryFn: () => lmsApi.getUnits(subjectId),
    enabled: !!subjectId,
  })

  const canManage = isAdmin?.() || isTeacher?.()

  return (
    <div>
      <style>{`.unit-row:hover{background:var(--surface-2)!important}`}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--faint)', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <Link to="/student/lms" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>LMS</Link>
        <span>/</span>
        <Link to="/student/lms/courses" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Courses</Link>
        <span>/</span>
        <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{subject?.name ?? 'Course'}</span>
      </div>

      {/* Course banner — pine */}
      <div style={{ background: 'linear-gradient(150deg,#1f4b38,#173829)', borderRadius: 13, padding: '1.5rem 1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 54, height: 54, borderRadius: 12, background: 'rgba(244,239,228,0.13)', border: '1px solid rgba(200,154,91,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e9d5b3', fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, fontSize: 24, flexShrink: 0 }}>
            {(subject?.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin: 0, color: '#f4efe4', fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em' }}>{subject?.name ?? 'Course'}</h1>
            {subject?.code && (
              <span style={{ display: 'inline-block', background: 'rgba(244,239,228,0.13)', color: 'rgba(244,239,228,0.85)', fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 5, marginTop: 6, letterSpacing: '0.04em' }}>{subject.code}</span>
            )}
            {subject?.description && <p style={{ margin: '6px 0 0', color: 'rgba(216,225,214,0.65)', fontSize: 13 }}>{subject.description}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#f4efe4', fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500, fontSize: 26 }}>{units.length}</p>
            <p style={{ margin: 0, color: 'rgba(216,225,214,0.55)', fontSize: 11 }}>Units</p>
          </div>
          {canManage && (
            <button onClick={() => setAddUnitOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#c89a5b', color: '#211e18', border: 'none', padding: '8px 15px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <IconPlus size={14} /> Add Unit
            </button>
          )}
        </div>
      </div>

      {/* Units header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 className="card-title" style={{ fontSize: 15 }}>Course Units</h2>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--faint)' }}>Click a unit to view notes, assignments, and tests</p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}><Spinner /></div>
      ) : units.length === 0 ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--canvas-sunk)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--faint)' }}>
            <IconBook size={22} />
          </div>
          <p style={{ color: 'var(--ink)', fontWeight: 600, fontSize: 15, margin: 0 }}>No units yet</p>
          <p style={{ color: 'var(--faint)', fontSize: 13, marginTop: 4 }}>Units will be added by your teacher.</p>
          {canManage && (
            <button onClick={() => setAddUnitOpen(true)} className="btn btn-primary" style={{ marginTop: 16 }}>Add First Unit</button>
          )}
        </div>
      ) : (
        <div className="table-container">
          {units.map((unit, i) => (
            <Link key={unit.id} to={`/student/lms/courses/${subjectId}/units/${unit.id}`} style={{ textDecoration: 'none' }}>
              <div className="unit-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '14px 18px', borderBottom: i < units.length - 1 ? '1px solid var(--line-2)' : 'none', transition: 'background 0.15s', cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 9, background: 'var(--accent-tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, fontSize: 15, flexShrink: 0 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{unit.title}</p>
                  {unit.description && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{unit.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--accent-tint)', color: 'var(--accent)', fontSize: 11.5, fontWeight: 500, padding: '3px 9px', borderRadius: 5 }}>
                    <IconFileText size={12} /> {unit.notesCount ?? 0} notes
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--brass-tint)', color: '#8a5e2a', fontSize: 11.5, fontWeight: 500, padding: '3px 9px', borderRadius: 5 }}>
                    <IconClipboard size={12} /> {unit.assignmentsCount ?? 0} tasks
                  </span>
                </div>
                <IconChevronR size={16} color="var(--faint)" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <AddUnitModal open={addUnitOpen} onClose={() => setAddUnitOpen(false)} subjectId={subjectId} />
    </div>
  )
}
