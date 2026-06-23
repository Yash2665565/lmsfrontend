import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../app/axios'
import StatusBadge from '../../components/ui/StatusBadge'
import Spinner from '../../components/ui/Spinner'

// ── Helpers ────────────────────────────────────────────────────────────────────

function toList(data) {
  return Array.isArray(data) ? data : data?.content ?? []
}

function StepLabel({ n, label, active, done }) {
  return (
    <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${active ? 'text-indigo-600' : done ? 'text-slate-400' : 'text-slate-300'}`}>
      <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-semibold shrink-0 ${active ? 'bg-indigo-600 text-white' : done ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-300'}`}>
        {done ? '✓' : n}
      </span>
      {label}
    </div>
  )
}

// ── Enroll Modal ───────────────────────────────────────────────────────────────

function EnrollModal({ sectionId, academicYearId, onClose, onSuccess }) {
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [rollNo, setRollNo] = useState('')
  const [error, setError] = useState('')

  const { data: searchData, isFetching } = useQuery({
    queryKey: ['students-search', search],
    queryFn: () => api.get('/students', { params: { search, size: 10 } }).then(r => r.data.data),
    enabled: search.length >= 2,
    staleTime: 10_000,
  })
  const results = toList(searchData)

  const mutation = useMutation({
    mutationFn: () => api.post('/enrollments', { studentId: selectedStudent.id, sectionId, academicYearId, rollNo }),
    onSuccess: () => onSuccess(),
    onError: err => setError(err?.response?.data?.message ?? 'Enrollment failed. Please try again.'),
  })

  function submit(e) {
    e.preventDefault()
    if (!selectedStudent) { setError('Select a student first.'); return }
    if (!rollNo.trim()) { setError('Roll number is required.'); return }
    setError('')
    mutation.mutate()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(33,30,24,0.42)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">Enroll Student</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {/* Student search */}
          <div>
            <label className="label">Search Student</label>
            <input
              className="input"
              placeholder="Name or admission number…"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedStudent(null) }}
              autoFocus
            />
            {search.length >= 2 && (
              <div className="mt-1 border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {isFetching && (
                  <div className="px-4 py-3 text-sm text-slate-400 text-center">Searching…</div>
                )}
                {!isFetching && results.length === 0 && (
                  <div className="px-4 py-3 text-sm text-slate-400 text-center">No students found.</div>
                )}
                {!isFetching && results.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedStudent?.id === s.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-50 text-slate-700'}`}
                    onClick={() => { setSelectedStudent(s); setSearch(`${s.firstName} ${s.lastName}`) }}
                  >
                    <span className="font-medium">{s.firstName} {s.lastName}</span>
                    <span className="ml-2 text-xs text-slate-400">{s.admissionNo}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedStudent && (
              <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {selectedStudent.firstName} {selectedStudent.lastName} selected
              </div>
            )}
          </div>

          {/* Roll No */}
          <div>
            <label className="label">Roll Number</label>
            <input
              className="input"
              placeholder="e.g. 21"
              value={rollNo}
              onChange={e => setRollNo(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Enrolling…' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Status Update Dropdown ─────────────────────────────────────────────────────

const STATUS_OPTIONS = ['ACTIVE', 'TRANSFERRED', 'GRADUATED']

function StatusMenu({ enrollmentId, currentStatus, onUpdate }) {
  const [open, setOpen] = useState(false)
  const mutation = useMutation({
    mutationFn: status => api.patch(`/enrollments/${enrollmentId}/status`, { status }),
    onSuccess: () => { setOpen(false); onUpdate() },
  })
  return (
    <div className="relative inline-block">
      <button
        className="btn-ghost text-xs py-1 px-2"
        onClick={() => setOpen(v => !v)}
      >
        Change Status
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
          {STATUS_OPTIONS.filter(s => s !== currentStatus).map(s => (
            <button
              key={s}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => mutation.mutate(s)}
              disabled={mutation.isPending}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function EnrollmentPage() {
  const qc = useQueryClient()
  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [showEnroll, setShowEnroll] = useState(false)

  // Academic Years
  const { data: yearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then(r => r.data.data),
  })
  const years = toList(yearsData)

  // Classes
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(r => r.data.data),
  })
  const classes = toList(classesData)

  // Sections for selected class
  const { data: sectionsData } = useQuery({
    queryKey: ['sections', selectedClassId],
    queryFn: () => api.get('/sections', { params: { classGradeId: selectedClassId } }).then(r => r.data.data),
    enabled: !!selectedClassId,
  })
  const sections = toList(sectionsData)

  // Enrollments for selected section + year
  const { data: enrollmentsData, isLoading: enrollLoading, refetch: refetchEnrollments } = useQuery({
    queryKey: ['enrollments', selectedSectionId, selectedYearId],
    queryFn: () => api.get(`/sections/${selectedSectionId}/enrollments`, { params: { academicYearId: selectedYearId } }).then(r => r.data.data),
    enabled: !!selectedSectionId && !!selectedYearId,
  })
  const enrollments = toList(enrollmentsData)

  // Derived
  const step = !selectedYearId ? 1 : !selectedClassId ? 2 : !selectedSectionId ? 3 : 4

  function resetBelow(level) {
    if (level <= 1) { setSelectedYearId(''); setSelectedClassId(''); setSelectedSectionId('') }
    else if (level <= 2) { setSelectedClassId(''); setSelectedSectionId('') }
    else if (level <= 3) { setSelectedSectionId('') }
  }

  const selectedSection = sections.find(s => String(s.id) === String(selectedSectionId))
  const selectedYear = years.find(y => String(y.id) === String(selectedYearId))

  return (
    <div className="page">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-800">Enrollment</h1>
          <p className="text-sm text-slate-500 mt-0.5">Select a section to view and manage student enrollment.</p>
        </div>

        {/* Step selectors */}
        <div className="card mb-6">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <StepLabel n={1} label="Academic Year" active={step === 1} done={step > 1} />
            <span className="text-slate-200 hidden sm:block">›</span>
            <StepLabel n={2} label="Class" active={step === 2} done={step > 2} />
            <span className="text-slate-200 hidden sm:block">›</span>
            <StepLabel n={3} label="Section" active={step === 3} done={step > 3} />
            <span className="text-slate-200 hidden sm:block">›</span>
            <StepLabel n={4} label="Roster" active={step === 4} done={false} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Academic Year</label>
              <select
                className="input"
                value={selectedYearId}
                onChange={e => { resetBelow(1); setSelectedYearId(e.target.value) }}
              >
                <option value="">Select year…</option>
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Class</label>
              <select
                className="input"
                value={selectedClassId}
                disabled={!selectedYearId}
                onChange={e => { resetBelow(2); setSelectedClassId(e.target.value) }}
              >
                <option value="">Select class…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Section</label>
              <select
                className="input"
                value={selectedSectionId}
                disabled={!selectedClassId}
                onChange={e => { resetBelow(3); setSelectedSectionId(e.target.value) }}
              >
                <option value="">Select section…</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Roster */}
        {step < 4 && (
          <div className="card text-center py-16 text-slate-400 text-sm">
            Complete all three selectors above to view the enrollment roster.
          </div>
        )}

        {step === 4 && (
          <div className="card p-0 overflow-hidden">
            {/* Roster header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  {selectedSection?.name ?? 'Section'} — {selectedYear?.name ?? 'Year'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {enrollLoading ? 'Loading…' : `${enrollments.length} student${enrollments.length !== 1 ? 's' : ''} enrolled`}
                </p>
              </div>
              <button
                className="btn-primary text-sm"
                onClick={() => setShowEnroll(true)}
              >
                + Enroll Student
              </button>
            </div>

            {enrollLoading ? (
              <Spinner />
            ) : enrollments.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                No students enrolled yet. Use "Enroll Student" to add the first one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['Roll No', 'Student Name', 'Adm No', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {enrollments.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-600 text-xs">{e.rollNo ?? '—'}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {e.student?.firstName ?? e.studentName ?? '—'} {e.student?.lastName ?? ''}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{e.student?.admissionNo ?? e.admissionNo ?? '—'}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={e.status ?? 'ACTIVE'} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusMenu
                            enrollmentId={e.id}
                            currentStatus={e.status}
                            onUpdate={() => {
                              qc.invalidateQueries({ queryKey: ['enrollments', selectedSectionId, selectedYearId] })
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {showEnroll && (
          <EnrollModal
            sectionId={selectedSectionId}
            academicYearId={selectedYearId}
            onClose={() => setShowEnroll(false)}
            onSuccess={() => {
              setShowEnroll(false)
              qc.invalidateQueries({ queryKey: ['enrollments', selectedSectionId, selectedYearId] })
            }}
          />
        )}
      </div>
    </div>
  )
}
