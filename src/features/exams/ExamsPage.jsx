import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '../../app/axios'
import Spinner from '../../components/ui/Spinner'

// ── Helpers ────────────────────────────────────────────────────────────────────

function toList(data) {
  return Array.isArray(data) ? data : data?.content ?? []
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

function ModalShell({ title, onClose, size = 'md', children }) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(33,30,24,0.42)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size] ?? sizes.md}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 text-xl leading-none"
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

// ── Grade helper ───────────────────────────────────────────────────────────────

function gradeFromPct(pct) {
  if (pct >= 90) return { label: 'A+', color: 'text-emerald-700 bg-emerald-50' }
  if (pct >= 80) return { label: 'A', color: 'text-emerald-700 bg-emerald-50' }
  if (pct >= 70) return { label: 'B+', color: 'text-blue-700 bg-blue-50' }
  if (pct >= 60) return { label: 'B', color: 'text-blue-700 bg-blue-50' }
  if (pct >= 50) return { label: 'C', color: 'text-amber-700 bg-amber-50' }
  if (pct >= 40) return { label: 'D', color: 'text-orange-700 bg-orange-50' }
  return { label: 'F', color: 'text-red-700 bg-red-50' }
}

// ── Marks Table for an exam subject ───────────────────────────────────────────

function MarksRow({ row, examSubjectId, maxMarks }) {
  const [value, setValue] = useState(row.marksObtained != null ? String(row.marksObtained) : '')
  const [saved, setSaved] = useState(row.marksObtained != null)

  const mutation = useMutation({
    mutationFn: () => api.post(`/exam-subjects/${examSubjectId}/marks`, {
      studentId: row.studentId,
      marksObtained: Number(value),
    }),
    onSuccess: () => setSaved(true),
  })

  const numVal = Number(value)
  const isValid = value !== '' && !isNaN(numVal) && numVal >= 0 && numVal <= maxMarks
  const isDirty = String(row.marksObtained ?? '') !== value
  const pct = isValid ? (numVal / maxMarks) * 100 : null
  const grade = pct != null ? gradeFromPct(pct) : null

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
      <td className="py-3 pr-4 text-sm font-medium text-slate-800">{row.studentName}</td>
      <td className="py-3 px-3 text-sm text-slate-500 tabular-nums">{row.admissionNo ?? '—'}</td>
      <td className="py-3 px-3 text-sm text-center tabular-nums text-slate-500">{maxMarks}</td>
      <td className="py-3 px-3">
        <input
          type="number"
          min={0}
          max={maxMarks}
          step={0.5}
          className={`w-20 rounded-lg border px-2.5 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-1 ${
            isValid || value === ''
              ? 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
              : 'border-red-400 focus:ring-red-400'
          }`}
          value={value}
          onChange={e => { setValue(e.target.value); setSaved(false) }}
        />
      </td>
      <td className="py-3 px-3 text-center">
        {grade ? (
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${grade.color}`}>{grade.label}</span>
        ) : <span className="text-slate-300 text-xs">—</span>}
      </td>
      <td className="py-3 pl-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!isValid || !isDirty || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="btn-primary py-1.5 px-3 text-xs disabled:opacity-40"
          >
            {mutation.isPending ? (
              <span className="inline-block w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
            ) : 'Save'}
          </button>
          {saved && !isDirty && (
            <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          {mutation.isError && (
            <span className="text-red-500 text-xs">Failed</span>
          )}
        </div>
      </td>
    </tr>
  )
}

function MarksPanel({ examSubjectId, maxMarks }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['exam-marks', examSubjectId],
    queryFn: () => api.get(`/exam-subjects/${examSubjectId}/marks`).then(r => r.data.data),
  })
  const rows = toList(data)

  if (isLoading) return <Spinner />
  if (isError) return <p className="text-sm text-red-500 py-4">Failed to load marks.</p>
  if (rows.length === 0) return <p className="text-sm text-slate-400 py-4 text-center">No students enrolled.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {['Student', 'Adm No', 'Max', 'Obtained', 'Grade', 'Action'].map(h => (
              <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide first:pl-0">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <MarksRow key={row.studentId} row={row} examSubjectId={examSubjectId} maxMarks={maxMarks} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Add Exam Modal ─────────────────────────────────────────────────────────────

function AddExamModal({ termId, onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: '', examDate: '', termId },
  })
  const mutation = useMutation({
    mutationFn: body => api.post('/exams', body),
    onSuccess: () => onSuccess(),
  })
  return (
    <ModalShell title="New Exam" onClose={onClose}>
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <Field label="Exam Name" error={errors.name?.message}>
          <input className="input" {...register('name', { required: 'Required' })} placeholder="e.g. Mid-Term Examination" />
        </Field>
        <Field label="Exam Date" error={errors.examDate?.message}>
          <input type="date" className="input" {...register('examDate', { required: 'Required' })} />
        </Field>
        <input type="hidden" {...register('termId')} />
        {mutation.isError && (
          <p className="text-xs text-red-600">{mutation.error?.response?.data?.message ?? 'Failed to create exam.'}</p>
        )}
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create Exam'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Add Subject Modal ──────────────────────────────────────────────────────────

function AddSubjectModal({ examId, onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { subjectId: '', classGradeId: '', maxMarks: 100 },
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data.data),
  })
  const subjects = toList(subjectsData)

  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(r => r.data.data),
  })
  const classes = toList(classesData)

  const mutation = useMutation({
    mutationFn: body => api.post(`/exams/${examId}/subjects`, body),
    onSuccess: () => onSuccess(),
  })

  return (
    <ModalShell title="Add Subject to Exam" onClose={onClose}>
      <form onSubmit={handleSubmit(d => mutation.mutate({ ...d, maxMarks: Number(d.maxMarks) }))} className="space-y-4">
        <Field label="Subject" error={errors.subjectId?.message}>
          <select className="input" {...register('subjectId', { required: 'Required' })}>
            <option value="">Select subject…</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Class" error={errors.classGradeId?.message}>
          <select className="input" {...register('classGradeId', { required: 'Required' })}>
            <option value="">Select class…</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Maximum Marks" error={errors.maxMarks?.message}>
          <input type="number" className="input" min={1} {...register('maxMarks', { required: 'Required', min: 1 })} />
        </Field>
        {mutation.isError && (
          <p className="text-xs text-red-600">{mutation.error?.response?.data?.message ?? 'Failed to add subject.'}</p>
        )}
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Adding…' : 'Add Subject'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ExamsPage() {
  const qc = useQueryClient()

  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedTermId, setSelectedTermId] = useState('')
  const [selectedExamId, setSelectedExamId] = useState(null)
  const [selectedExamSubject, setSelectedExamSubject] = useState(null) // { id, subjectName, maxMarks }
  const [showAddExam, setShowAddExam] = useState(false)
  const [showAddSubject, setShowAddSubject] = useState(false)

  // Academic years
  const { data: yearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then(r => r.data.data),
  })
  const years = toList(yearsData)

  // Terms for year
  const { data: termsData } = useQuery({
    queryKey: ['terms', selectedYearId],
    queryFn: () => api.get('/terms', { params: { yearId: selectedYearId } }).then(r => r.data.data),
    enabled: !!selectedYearId,
  })
  const terms = toList(termsData)

  // Exams for term
  const { data: examsData, isLoading: examsLoading } = useQuery({
    queryKey: ['exams', selectedTermId],
    queryFn: () => api.get('/exams', { params: { termId: selectedTermId } }).then(r => r.data.data),
    enabled: !!selectedTermId,
  })
  const exams = toList(examsData)

  // Subjects for selected exam
  const { data: subjectsData, isLoading: subjectsLoading } = useQuery({
    queryKey: ['exam-subjects', selectedExamId],
    queryFn: () => api.get(`/exams/${selectedExamId}/subjects`).then(r => r.data.data),
    enabled: !!selectedExamId,
  })
  const examSubjects = toList(subjectsData)

  const selectedExam = exams.find(e => e.id === selectedExamId)

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Exams</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage exams, subjects, and marks entry.</p>
        </div>
      </div>

      <div className="flex gap-0 min-h-[calc(100vh-200px)] rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* ── Left panel: exam list ── */}
        <div className="w-72 shrink-0 border-r border-slate-100 flex flex-col">
          {/* Term selector */}
          <div className="px-4 py-4 border-b border-slate-100 space-y-3">
            <div>
              <label className="label text-xs">Academic Year</label>
              <select
                className="input text-sm"
                value={selectedYearId}
                onChange={e => {
                  setSelectedYearId(e.target.value)
                  setSelectedTermId('')
                  setSelectedExamId(null)
                  setSelectedExamSubject(null)
                }}
              >
                <option value="">Select year…</option>
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Term</label>
              <select
                className="input text-sm"
                value={selectedTermId}
                disabled={!selectedYearId}
                onChange={e => {
                  setSelectedTermId(e.target.value)
                  setSelectedExamId(null)
                  setSelectedExamSubject(null)
                }}
              >
                <option value="">Select term…</option>
                {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {/* Exam list */}
          <div className="flex-1 overflow-y-auto">
            {!selectedTermId ? (
              <p className="px-4 py-8 text-xs text-slate-400 text-center">Select a term to see exams.</p>
            ) : examsLoading ? (
              <div className="px-4 py-8 text-center"><span className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : exams.length === 0 ? (
              <p className="px-4 py-8 text-xs text-slate-400 text-center">No exams for this term.</p>
            ) : (
              <ul className="py-2">
                {exams.map(exam => (
                  <li key={exam.id}>
                    <button
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        selectedExamId === exam.id
                          ? 'bg-indigo-50 border-r-2 border-indigo-600'
                          : 'hover:bg-slate-50'
                      }`}
                      onClick={() => { setSelectedExamId(exam.id); setSelectedExamSubject(null) }}
                    >
                      <p className={`text-sm font-medium ${selectedExamId === exam.id ? 'text-indigo-700' : 'text-slate-800'}`}>
                        {exam.name}
                      </p>
                      {exam.examDate && (
                        <p className="text-xs text-slate-400 mt-0.5">{exam.examDate}</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* New Exam button */}
          {selectedTermId && (
            <div className="px-4 py-3 border-t border-slate-100">
              <button
                className="btn-primary w-full text-sm"
                onClick={() => setShowAddExam(true)}
              >
                + New Exam
              </button>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 overflow-y-auto">
          {!selectedExamId ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400">
              <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Select an exam from the list to view details.</p>
            </div>
          ) : (
            <div className="p-6">
              {/* Exam title + Add Subject */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">{selectedExam?.name ?? 'Exam'}</h2>
                  {selectedExam?.examDate && (
                    <p className="text-sm text-slate-500 mt-0.5">{selectedExam.examDate}</p>
                  )}
                </div>
                {!selectedExamSubject && (
                  <button className="btn-primary text-sm" onClick={() => setShowAddSubject(true)}>
                    + Add Subject
                  </button>
                )}
              </div>

              {/* Marks entry panel or subjects list */}
              {selectedExamSubject ? (
                <div>
                  {/* Back breadcrumb */}
                  <button
                    className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 mb-4"
                    onClick={() => setSelectedExamSubject(null)}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to subjects
                  </button>
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-800">{selectedExamSubject.subjectName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Maximum marks: {selectedExamSubject.maxMarks}</p>
                  </div>
                  <MarksPanel examSubjectId={selectedExamSubject.id} maxMarks={selectedExamSubject.maxMarks} />
                </div>
              ) : (
                <>
                  {subjectsLoading && <Spinner />}
                  {!subjectsLoading && examSubjects.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      No subjects added to this exam yet. Click "Add Subject" to get started.
                    </div>
                  )}
                  {!subjectsLoading && examSubjects.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {examSubjects.map(sub => (
                        <div key={sub.id} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{sub.subjectName ?? sub.subject?.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{sub.className ?? sub.classGrade?.name}</p>
                            </div>
                            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md shrink-0">
                              /{sub.maxMarks}
                            </span>
                          </div>
                          <button
                            className="btn-secondary w-full text-xs py-1.5"
                            onClick={() => setSelectedExamSubject({
                              id: sub.id,
                              subjectName: sub.subjectName ?? sub.subject?.name,
                              maxMarks: sub.maxMarks,
                            })}
                          >
                            Enter Marks
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddExam && (
        <AddExamModal
          termId={selectedTermId}
          onClose={() => setShowAddExam(false)}
          onSuccess={() => {
            setShowAddExam(false)
            qc.invalidateQueries({ queryKey: ['exams', selectedTermId] })
          }}
        />
      )}

      {showAddSubject && selectedExamId && (
        <AddSubjectModal
          examId={selectedExamId}
          onClose={() => setShowAddSubject(false)}
          onSuccess={() => {
            setShowAddSubject(false)
            qc.invalidateQueries({ queryKey: ['exam-subjects', selectedExamId] })
          }}
        />
      )}
    </div>
  )
}
