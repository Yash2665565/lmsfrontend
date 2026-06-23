import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '../../app/axios'
import { useAuth } from '../../auth/AuthContext'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'

const DAYS = [
  { label: 'Monday',    short: 'Mon', value: 1 },
  { label: 'Tuesday',   short: 'Tue', value: 2 },
  { label: 'Wednesday', short: 'Wed', value: 3 },
  { label: 'Thursday',  short: 'Thu', value: 4 },
  { label: 'Friday',    short: 'Fri', value: 5 },
  { label: 'Saturday',  short: 'Sat', value: 6 },
]

const SLOT_COLORS = [
  '#e7efe9', '#e5f0e8', '#f4e9d6', '#efe9f0', '#f4e9d6', '#e3eeec',
]
const SLOT_TEXT = [
  '#1f4b38', '#1f4b38', '#8a5e2a', '#6b4e78', '#71491f', '#2a6056',
]

function slotColor(subjectId, idx = 0) {
  const i = (typeof subjectId === 'number' ? subjectId : parseInt(subjectId) || idx) % SLOT_COLORS.length
  return { bg: SLOT_COLORS[i], fg: SLOT_TEXT[i] }
}

// ── Timetable grid (shared for all roles) ────────────────────────────────────
function TimetableGrid({ slots, periods, showTeacher = true, showSection = false, onCellClick, canEdit }) {
  const today = new Date().getDay()
  const todayDow = today === 0 || today === 6 ? null : today

  const lookup = useMemo(() => {
    const m = {}
    ;(slots ?? []).forEach(s => {
      const dow = s.dayOfWeek
      const pid = s.periodId ?? s.period?.id
      if (!m[dow]) m[dow] = {}
      m[dow][pid] = s
    })
    return m
  }, [slots])

  if (!periods.length) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--faint)' }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--canvas-sunk)', color: 'var(--faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        </div>
        <p style={{ fontWeight: 600, color: 'var(--ink-2)' }}>No periods configured</p>
        <p style={{ fontSize: '13px', marginTop: '4px' }}>
          {canEdit ? 'Add periods using the "Manage Periods" button above.' : 'Admin needs to set up periods first.'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
        <thead>
          <tr>
            <th style={{ width: '110px', padding: '10px 14px', textAlign: 'left', background: '#fbf8f1', borderBottom: '2px solid #e3dac9', borderRight: '1px solid #e3dac9', fontSize: '11px', fontWeight: 700, color: '#726b5c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Period
            </th>
            {DAYS.map(d => (
              <th key={d.value} style={{
                padding: '10px 8px', textAlign: 'center',
                background: d.value === todayDow ? '#e7efe9' : '#fbf8f1',
                borderBottom: '2px solid #e3dac9', borderRight: '1px solid #e3dac9',
                fontSize: '12px', fontWeight: 700,
                color: d.value === todayDow ? '#1f4b38' : '#726b5c',
                minWidth: '130px',
              }}>
                {d.short}
                {d.value === todayDow && <span style={{ display: 'block', fontSize: '10px', fontWeight: 400, color: '#1f4b38' }}>today</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period, ri) => (
            <tr key={period.id} style={{ background: ri % 2 === 0 ? '#fff' : '#fbf8f1' }}>
              <td style={{ padding: '10px 14px', borderRight: '1px solid #e3dac9', borderBottom: '1px solid #ede5d6', whiteSpace: 'nowrap' }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#211e18' }}>{period.name}</p>
                {(period.startTime || period.endTime) && (
                  <p style={{ margin: 0, fontSize: '11px', color: '#9c9482' }}>
                    {period.startTime}{period.startTime && period.endTime ? ' – ' : ''}{period.endTime}
                  </p>
                )}
              </td>
              {DAYS.map(d => {
                const slot = lookup[d.value]?.[period.id]
                const isToday = d.value === todayDow
                const { bg, fg } = slot ? slotColor(slot.subjectId ?? slot.subject?.id) : {}
                return (
                  <td key={d.value} style={{
                    padding: '6px 6px', borderRight: '1px solid #e3dac9', borderBottom: '1px solid #ede5d6',
                    textAlign: 'center', verticalAlign: 'middle',
                    background: isToday ? 'rgba(31,75,56,0.04)' : undefined,
                  }}>
                    {slot ? (
                      <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                        <div style={{ background: bg, borderRadius: '6px', padding: '6px 8px', textAlign: 'left' }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '12px', color: fg, lineHeight: 1.3 }}>
                            {slot.subjectName ?? slot.subject?.name ?? 'Subject'}
                          </p>
                          {showTeacher && (slot.teacherName ?? slot.teacher?.name) && (
                            <p style={{ margin: 0, fontSize: '11px', color: fg, opacity: 0.7, marginTop: '2px' }}>
                              {slot.teacherName ?? slot.teacher?.name}
                            </p>
                          )}
                          {showSection && (slot.sectionName ?? slot.section?.name) && (
                            <p style={{ margin: 0, fontSize: '11px', color: fg, opacity: 0.7, marginTop: '2px' }}>
                              {slot.sectionName ?? slot.section?.name}
                            </p>
                          )}
                        </div>
                        {canEdit && (
                          <button
                            onClick={() => onCellClick?.({ day: d.value, period, slot, action: 'delete' })}
                            style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: '4px', width: '18px', height: '18px', cursor: 'pointer', fontSize: '11px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                            title="Remove slot"
                          >×</button>
                        )}
                      </div>
                    ) : (
                      canEdit ? (
                        <button
                          onClick={() => onCellClick?.({ day: d.value, period, slot: null, action: 'add' })}
                          style={{ background: 'none', border: '1.5px dashed #c2bba9', borderRadius: '6px', width: '100%', minHeight: '36px', cursor: 'pointer', color: '#9c9482', fontSize: '18px', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#1f4b38'; e.currentTarget.style.color = '#1f4b38' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#c2bba9'; e.currentTarget.style.color = '#9c9482' }}
                          title="Add slot"
                        >+</button>
                      ) : (
                        <span style={{ color: '#e3dac9', fontSize: '16px' }}>—</span>
                      )
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Manage Periods Modal ─────────────────────────────────────────────────────
function PeriodsModal({ open, onClose, periods }) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset } = useForm()
  const mutation = useMutation({
    mutationFn: body => api.post('/periods', body).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['periods'] }); reset() },
  })
  return (
    <Modal open={open} onClose={onClose} title="Manage Periods">
      <div className="space-y-4">
        <div className="space-y-2">
          {periods.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#fbf8f1', borderRadius: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', flex: 1 }}>{p.name}</span>
              <span style={{ fontSize: '12px', color: '#9c9482' }}>{p.startTime && p.endTime ? `${p.startTime} – ${p.endTime}` : 'No time set'}</span>
            </div>
          ))}
          {periods.length === 0 && <p style={{ color: '#9c9482', fontSize: '13px', textAlign: 'center', padding: '1rem 0' }}>No periods yet</p>}
        </div>
        <div style={{ borderTop: '1px solid #e3dac9', paddingTop: '1rem' }}>
          <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px' }}>Add Period</p>
          <form onSubmit={handleSubmit(d => mutation.mutate({ name: d.name, startTime: d.startTime || null, endTime: d.endTime || null, sortOrder: periods.length + 1 }))} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Name *</label>
                <input className="input" placeholder="Period 1" {...register('name', { required: true })} />
              </div>
              <div>
                <label className="label">Start Time</label>
                <input type="time" className="input" {...register('startTime')} />
              </div>
              <div>
                <label className="label">End Time</label>
                <input type="time" className="input" {...register('endTime')} />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Adding…' : '+ Add Period'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  )
}

// ── Add Slot Modal ────────────────────────────────────────────────────────────
function AddSlotModal({ open, onClose, cell, sectionId, yearId }) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset } = useForm()

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data.data ?? []),
    enabled: open,
  })
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(r => {
      const d = r.data.data; return d?.content ?? (Array.isArray(d) ? d : [])
    }),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: body => api.post('/timetable-slots', body).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable-section', String(sectionId), String(yearId)] })
      onClose(); reset()
    },
  })

  if (!cell) return null

  return (
    <Modal open={open} onClose={() => { onClose(); reset() }} title={`Assign: ${DAYS.find(d => d.value === cell.day)?.label} · ${cell.period?.name}`}>
      <form onSubmit={handleSubmit(d => mutation.mutate({
        sectionId: Number(sectionId),
        dayOfWeek: cell.day,
        periodId: Number(cell.period.id),
        subjectId: Number(d.subjectId),
        teacherId: Number(d.teacherId),
        academicYearId: Number(yearId),
      }))} className="space-y-4">
        <div>
          <label className="label">Subject *</label>
          <select className="input" {...register('subjectId', { required: true })}>
            <option value="">Select subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Teacher *</label>
          <select className="input" {...register('teacherId', { required: true })}>
            <option value="">Select teacher</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name ?? `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim()}</option>)}
          </select>
        </div>
        {mutation.isError && (
          <p style={{ color: '#a23b2c', fontSize: '12px' }}>{mutation.error?.response?.data?.message ?? 'Could not save slot'}</p>
        )}
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => { onClose(); reset() }}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Assign'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Admin view ────────────────────────────────────────────────────────────────
function AdminTimetable() {
  const qc = useQueryClient()
  const [yearId, setYearId]       = useState('')
  const [classId, setClassId]     = useState('')
  const [sectionId, setSectionId] = useState('')
  const [periodsOpen, setPeriodsOpen] = useState(false)
  const [addCell, setAddCell]     = useState(null)

  const { data: years = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then(r => r.data.data ?? []),
    onSuccess: list => {
      const cur = list.find(y => y.isCurrent) ?? list[0]
      if (cur && !yearId) setYearId(String(cur.id))
    },
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(r => r.data.data ?? []),
  })

  const { data: sections = [] } = useQuery({
    queryKey: ['sections-by-class', classId],
    queryFn: () => api.get(`/sections?classGradeId=${classId}`).then(r => r.data.data ?? []),
    enabled: !!classId,
  })

  const { data: periods = [] } = useQuery({
    queryKey: ['periods'],
    queryFn: () => api.get('/periods').then(r => {
      const list = r.data?.data
      return Array.isArray(list) ? [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) : []
    }),
  })

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['timetable-section', sectionId, yearId],
    queryFn: () => api.get(`/sections/${sectionId}/timetable?academicYearId=${yearId}`).then(r => r.data.data ?? []),
    enabled: !!sectionId && !!yearId,
  })

  const deleteMutation = useMutation({
    mutationFn: ({ sId, day, pId }) =>
      api.delete(`/sections/${sId}/timetable?dayOfWeek=${day}&periodId=${pId}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable-section', sectionId, yearId] }),
  })

  const selSection = sections.find(s => String(s.id) === sectionId)

  return (
    <div className="page space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable Manager</h1>
          <p className="text-sm text-gray-500 mt-0.5">Build and assign weekly schedules for each class section</p>
        </div>
        <button className="btn-secondary" onClick={() => setPeriodsOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
          Manage Periods
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Academic Year *</label>
            <select className="input" value={yearId} onChange={e => setYearId(e.target.value)}>
              <option value="">Select year</option>
              {years.map(y => (
                <option key={y.id} value={y.id}>{y.name}{y.isCurrent ? ' (Current)' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Class *</label>
            <select className="input" value={classId} onChange={e => { setClassId(e.target.value); setSectionId('') }}>
              <option value="">Select class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Section *</label>
            <select className="input" value={sectionId} onChange={e => setSectionId(e.target.value)} disabled={!classId}>
              <option value="">{classId ? 'Select section' : '— Select class first —'}</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.name}{s.classTeacherName ? ` (CT: ${s.classTeacherName})` : ''}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {!sectionId || !yearId ? (
        <div className="card flex flex-col items-center justify-center py-16 text-gray-400">
          <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">Select year, class, and section to manage timetable</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {/* Card header */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #e3dac9', display: 'flex', alignItems: 'center', gap: '10px', background: '#fbf8f1' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1f4b38', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#211e18' }}>
              {selSection ? `${selSection.classGradeName ?? ''} – Section ${selSection.name}` : 'Timetable'}
            </span>
            {selSection?.classTeacherName && (
              <span style={{ fontSize: '12px', color: '#726b5c' }}>· Class Teacher: {selSection.classTeacherName}</span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#9c9482' }}>Click + to add · Click × to remove</span>
          </div>
          {slotsLoading ? <div style={{ padding: '3rem', textAlign: 'center' }}><Spinner /></div> : (
            <TimetableGrid
              slots={slots}
              periods={periods}
              showTeacher={true}
              canEdit={true}
              onCellClick={({ day, period, slot, action }) => {
                if (action === 'add') setAddCell({ day, period })
                else if (action === 'delete' && slot) {
                  deleteMutation.mutate({ sId: sectionId, day, pId: period.id })
                }
              }}
            />
          )}
        </div>
      )}

      {/* Legend */}
      {slots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[...new Map(slots.map(s => [s.subjectId, s.subjectName])).entries()].map(([id, name]) => {
            const { bg, fg } = slotColor(id)
            return (
              <span key={id} style={{ background: bg, color: fg, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '5px' }}>
                {name}
              </span>
            )
          })}
        </div>
      )}

      <PeriodsModal open={periodsOpen} onClose={() => setPeriodsOpen(false)} periods={periods} />
      <AddSlotModal
        open={Boolean(addCell)}
        onClose={() => setAddCell(null)}
        cell={addCell}
        sectionId={sectionId}
        yearId={yearId}
      />
    </div>
  )
}

// ── Teacher view ──────────────────────────────────────────────────────────────
function TeacherTimetable() {
  const { user } = useAuth()

  const { data: periods = [] } = useQuery({
    queryKey: ['periods'],
    queryFn: () => api.get('/periods').then(r => {
      const list = r.data?.data
      return Array.isArray(list) ? [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) : []
    }),
  })

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['timetable-teacher', user?.teacherId],
    queryFn: () => api.get(`/teachers/${user.teacherId}/timetable`).then(r => r.data.data ?? []),
    enabled: !!user?.teacherId,
  })

  return (
    <div className="page space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Teaching Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">Your weekly class assignments</p>
      </div>

      {!user?.teacherId ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex items-center justify-center" style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--brass-tint)', color: '#8a5e2a' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <p className="text-slate-600 font-medium">Teacher profile not linked</p>
          <p className="text-slate-400 text-sm mt-1">Contact admin to link your account to a teacher profile.</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          {slots.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Total Periods/Week', value: slots.length },
                { label: 'Subjects', value: new Set(slots.map(s => s.subjectId)).size },
                { label: 'Sections', value: new Set(slots.map(s => s.sectionId)).size },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#fff', border: '1px solid #e3dac9', borderRadius: '8px', padding: '1rem 1.25rem' }}>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#211e18' }}>{value}</p>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#726b5c' }}>{label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="card p-0 overflow-hidden">
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #e3dac9', background: '#fbf8f1' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#211e18' }}>Weekly Schedule</span>
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#726b5c' }}>Each cell shows subject · section</span>
            </div>
            {isLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}><Spinner /></div>
            ) : (
              <TimetableGrid slots={slots} periods={periods} showTeacher={false} showSection={true} canEdit={false} />
            )}
          </div>

          {/* Subject-wise breakdown */}
          {slots.length > 0 && (
            <div className="card">
              <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#211e18' }}>Assignments by Subject</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[...new Map(slots.map(s => [s.subjectId, { name: s.subjectName, slots: slots.filter(x => x.subjectId === s.subjectId) }])).entries()].map(([id, { name, slots: ss }]) => {
                  const { bg, fg } = slotColor(id)
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: bg, borderRadius: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: fg, flex: 1 }}>{name}</span>
                      <span style={{ fontSize: '12px', color: fg, opacity: 0.7 }}>
                        {[...new Set(ss.map(s => s.sectionName))].join(', ')}
                      </span>
                      <span style={{ background: fg + '22', color: fg, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                        {ss.length} period{ss.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Student view ──────────────────────────────────────────────────────────────
function StudentTimetable() {
  const { user } = useAuth()

  const { data: periods = [] } = useQuery({
    queryKey: ['periods'],
    queryFn: () => api.get('/periods').then(r => {
      const list = r.data?.data
      return Array.isArray(list) ? [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) : []
    }),
  })

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['timetable-student', user?.studentId],
    queryFn: () => api.get(`/students/${user.studentId}/timetable`).then(r => r.data.data ?? []),
    enabled: !!user?.studentId,
  })

  return (
    <div className="page space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
        <p className="text-sm text-gray-500 mt-1">Your weekly class schedule</p>
      </div>

      {!user?.studentId ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex items-center justify-center" style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--brass-tint)', color: '#8a5e2a' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <p className="text-slate-600 font-medium">Student profile not linked</p>
          <p className="text-slate-400 text-sm mt-1">Contact admin to link your account.</p>
        </div>
      ) : (
        <>
          {/* Legend */}
          {slots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {[...new Map(slots.map(s => [s.subjectId, s.subjectName])).entries()].map(([id, name]) => {
                const { bg, fg } = slotColor(id)
                return (
                  <span key={id} style={{ background: bg, color: fg, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '5px' }}>
                    {name}
                  </span>
                )
              })}
            </div>
          )}

          <div className="card p-0 overflow-hidden">
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #e3dac9', background: '#fbf8f1' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#211e18' }}>Weekly Schedule</span>
            </div>
            {isLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}><Spinner /></div>
            ) : (
              <TimetableGrid slots={slots} periods={periods} showTeacher={true} canEdit={false} />
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function TimetablePage() {
  const { isAdmin, isTeacher, isStudent } = useAuth()
  if (isAdmin?.())   return <AdminTimetable />
  if (isTeacher?.()) return <TeacherTimetable />
  return <StudentTimetable />
}
