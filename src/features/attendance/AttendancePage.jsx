import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../app/axios'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'

// ─── Status config ────────────────────────────────────────────
const STATUS_CONFIG = {
  PRESENT:  { label: 'P', full: 'Present',  active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'border-slate-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-600' },
  ABSENT:   { label: 'A', full: 'Absent',   active: 'bg-red-600 text-white border-red-600',         inactive: 'border-slate-200 text-slate-500 hover:border-red-400 hover:text-red-600' },
  LATE:     { label: 'L', full: 'Late',     active: 'bg-amber-500 text-white border-amber-500',     inactive: 'border-slate-200 text-slate-500 hover:border-amber-400 hover:text-amber-600' },
  EXCUSED:  { label: 'E', full: 'Excused',  active: 'bg-sky-600 text-white border-sky-600',         inactive: 'border-slate-200 text-slate-500 hover:border-sky-400 hover:text-sky-600' },
  HALF_DAY: { label: 'H', full: 'Half Day', active: 'bg-orange-500 text-white border-orange-500',   inactive: 'border-slate-200 text-slate-500 hover:border-orange-400 hover:text-orange-600' },
}
const STATUS_KEYS = Object.keys(STATUS_CONFIG)

// ─── Toast ────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
        ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
      role="alert"
      aria-live="polite"
    >
      <span aria-hidden="true">{type === 'success' ? '✓' : '✕'}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-75 hover:opacity-100 text-lg leading-none" aria-label="Dismiss">&times;</button>
    </div>
  )
}

// ─── Status button row ────────────────────────────────────────
function StatusButtons({ value, onChange }) {
  return (
    <div className="flex gap-1" role="group" aria-label="Attendance status">
      {STATUS_KEYS.map(s => {
        const cfg = STATUS_CONFIG[s]
        const active = value === s
        return (
          <button
            key={s}
            type="button"
            title={cfg.full}
            aria-pressed={active}
            onClick={() => onChange(s)}
            className={`w-8 h-7 rounded-md text-xs font-bold border transition-all ${active ? cfg.active : cfg.inactive}`}
          >
            {cfg.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Summary pills ─────────────────────────────────────────────
function SummaryPills({ marks }) {
  const counts = STATUS_KEYS.reduce((acc, s) => {
    acc[s] = marks.filter(m => m.status === s).length
    return acc
  }, {})
  const colorMap = {
    PRESENT: 'badge-green', ABSENT: 'badge-red', LATE: 'badge-yellow',
    EXCUSED: 'badge-blue',  HALF_DAY: 'badge-purple',
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUS_KEYS.map(s =>
        counts[s] > 0 ? (
          <span key={s} className={`badge ${colorMap[s]}`}>
            {STATUS_CONFIG[s].full}: {counts[s]}
          </span>
        ) : null
      )}
      <span className="badge badge-gray">Total: {marks.length}</span>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────
export default function AttendancePage() {
  const qc = useQueryClient()
  const today = new Date().toISOString().split('T')[0]

  const [sectionId, setSectionId]   = useState('')
  const [date, setDate]             = useState(today)
  const [periodId, setPeriodId]     = useState('')
  const [marks, setMarks]           = useState([])   // [{studentId, studentName, admissionNo, rollNo, status, remarks}]
  const [loaded, setLoaded]         = useState(false)
  const [toast, setToast]           = useState(null)

  // ── Queries ──────────────────────────────────────────────────
  const { data: sectionsRaw, isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections'],
    queryFn: () => api.get('/sections').then(r => r.data.data ?? r.data),
  })
  const sections = sectionsRaw?.content ?? sectionsRaw ?? []

  const { data: periodsRaw } = useQuery({
    queryKey: ['periods'],
    queryFn: () => api.get('/periods').then(r => r.data.data ?? r.data),
  })
  const periods = periodsRaw?.content ?? periodsRaw ?? []

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then(r => r.data.data ?? r.data),
  })
  const currentYear = Array.isArray(academicYears)
    ? academicYears.find(y => y.isCurrent || y.is_current)
    : null

  const { data: enrollmentsRaw, refetch: refetchEnrollments } = useQuery({
    queryKey: ['enrollments', sectionId, currentYear?.id],
    queryFn: () =>
      api.get(`/sections/${sectionId}/enrollments`, {
        params: currentYear?.id ? { academicYearId: currentYear.id } : {},
      }).then(r => r.data.data ?? r.data),
    enabled: false,
  })

  const { data: existingRaw, refetch: refetchExisting } = useQuery({
    queryKey: ['attendance', sectionId, date],
    queryFn: () =>
      api.get(`/sections/${sectionId}/attendance`, { params: { date } })
        .then(r => r.data.data ?? r.data ?? []),
    enabled: false,
  })

  // ── Merge enrollments + existing marks after load ─────────────
  useEffect(() => {
    if (!loaded) return
    const enrollments = enrollmentsRaw?.content ?? enrollmentsRaw ?? []
    const existingList = existingRaw?.content ?? existingRaw ?? []
    const existingMap = {}
    existingList.forEach(m => {
      const sid = m.studentId ?? m.student?.id
      existingMap[sid] = m
    })
    const merged = enrollments.map(e => {
      const studentId = e.student?.id ?? e.studentId
      const existing  = existingMap[studentId]
      return {
        studentId,
        studentName: e.student
          ? `${e.student.firstName ?? ''} ${e.student.lastName ?? ''}`.trim()
          : e.studentName ?? '—',
        admissionNo: e.student?.admissionNo ?? e.admissionNo ?? '—',
        rollNo: e.rollNo ?? e.student?.rollNo ?? '—',
        status:  existing?.status  ?? 'PRESENT',
        remarks: existing?.remarks ?? '',
      }
    })
    setMarks(merged)
  }, [enrollmentsRaw, existingRaw, loaded])

  // ── Load register ─────────────────────────────────────────────
  const handleLoad = useCallback(async () => {
    if (!sectionId) return
    setLoaded(false)
    setMarks([])
    await Promise.all([refetchEnrollments(), refetchExisting()])
    setLoaded(true)
  }, [sectionId, date, refetchEnrollments, refetchExisting])

  const updateMark = (studentId, field, value) => {
    setMarks(prev => prev.map(m => m.studentId === studentId ? { ...m, [field]: value } : m))
  }

  const markAll = (status) => {
    setMarks(prev => prev.map(m => ({ ...m, status })))
  }

  // ── Submit mutation ───────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: () =>
      api.post(`/sections/${sectionId}/attendance`, {
        date,
        periodId: periodId || null,
        marks: marks.map(m => ({
          studentId: Number(m.studentId),
          status:    m.status,
          remarks:   m.remarks || null,
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance', sectionId, date] })
      setToast({ message: 'Attendance saved successfully.', type: 'success' })
    },
    onError: err => {
      const msg = err?.response?.data?.message ?? 'Failed to save attendance.'
      setToast({ message: msg, type: 'error' })
    },
  })

  const selectedSection = sections.find(s => String(s.id) === String(sectionId))
  const selectedPeriod  = periods.find(p => String(p.id) === String(periodId))

  return (
    <div className="page space-y-5">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <PageHeader
        title="Mark Attendance"
        subtitle="Select a section and date, then load the register"
      />

      {/* Controls */}
      <div className="card p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label" htmlFor="att-section">Section *</label>
            {sectionsLoading ? (
              <div className="input text-slate-400 text-sm">Loading…</div>
            ) : (
              <select
                id="att-section"
                className="input"
                value={sectionId}
                onChange={e => {
                  setSectionId(e.target.value)
                  setLoaded(false)
                  setMarks([])
                }}
              >
                <option value="">Select section</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.classGrade?.name ?? s.className ?? ''} – {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="label" htmlFor="att-date">Date</label>
            <input
              id="att-date"
              type="date"
              className="input"
              value={date}
              max={today}
              onChange={e => { setDate(e.target.value); setLoaded(false); setMarks([]) }}
            />
          </div>

          <div>
            <label className="label" htmlFor="att-period">
              Period <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <select
              id="att-period"
              className="input"
              value={periodId}
              onChange={e => setPeriodId(e.target.value)}
            >
              <option value="">Daily (no period)</option>
              {periods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.startTime ? ` · ${p.startTime}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              className="btn-primary w-full"
              disabled={!sectionId}
              onClick={handleLoad}
            >
              Load Register
            </button>
          </div>
        </div>
      </div>

      {/* Register */}
      {loaded && (
        <div className="card p-0 overflow-hidden">
          {/* Register header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                {selectedSection
                  ? `${selectedSection.classGrade?.name ?? selectedSection.className ?? ''} – ${selectedSection.name}`
                  : 'Register'}{' '}
                <span className="font-normal text-slate-500">· {date}</span>
                {selectedPeriod && (
                  <span className="font-normal text-slate-500"> · {selectedPeriod.name}</span>
                )}
              </h2>
              {marks.length > 0 && (
                <div className="mt-1.5">
                  <SummaryPills marks={marks} />
                </div>
              )}
            </div>
            {marks.length > 0 && (
              <button
                type="button"
                className="btn-secondary text-xs !py-1.5 !px-3"
                onClick={() => markAll('PRESENT')}
              >
                Mark All Present
              </button>
            )}
          </div>

          {marks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <p className="text-sm">No students found for this section.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Roll</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Adm No.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-60">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {marks.map((m, idx) => (
                    <tr key={m.studentId} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                      <td className="px-4 py-3 text-slate-400 text-center font-mono text-xs">
                        {m.rollNo}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{m.studentName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.admissionNo}</td>
                      <td className="px-4 py-3">
                        <StatusButtons
                          value={m.status}
                          onChange={v => updateMark(m.studentId, 'status', v)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={m.remarks}
                          onChange={e => updateMark(m.studentId, 'remarks', e.target.value)}
                          placeholder="Optional note"
                          className="input text-xs !py-1.5 max-w-[200px]"
                          aria-label={`Remarks for ${m.studentName}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Submit bar */}
          {marks.length > 0 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/60">
              <p className="text-xs text-slate-500">
                {marks.length} students · {date}
                {periodId ? ` · ${selectedPeriod?.name ?? 'Period'}` : ' · Daily'}
              </p>
              <button
                className="btn-primary"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Saving…' : 'Submit Attendance'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
