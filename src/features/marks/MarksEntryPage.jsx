import { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { academicsApi } from '../../api/academicsApi'
import { examsApi } from '../../api/examsApi'
import { useToast, ToastContainer } from '../../components/ui/Toast'

// ── Grade helper ───────────────────────────────────────────────────────────────
function gradeFromPct(pct) {
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 40) return 'D'
  return 'F'
}

function gradeColor(grade) {
  if (grade === 'A+' || grade === 'A') return 'text-emerald-700 bg-emerald-50'
  if (grade === 'B+' || grade === 'B') return 'text-blue-700 bg-blue-50'
  if (grade === 'C') return 'text-yellow-700 bg-yellow-50'
  if (grade === 'D') return 'text-orange-700 bg-orange-50'
  return 'text-red-700 bg-red-50'
}

// ── Single marks row ───────────────────────────────────────────────────────────
function MarksRow({ row, examSubjectId, maxMarks, onSaveSuccess }) {
  const { toasts, show } = useToast()
  const [value, setValue] = useState(row.marksObtained != null ? String(row.marksObtained) : '')
  const [saved, setSaved] = useState(row.marksObtained != null)

  const mutation = useMutation({
    mutationFn: () =>
      examsApi.enterMark(examSubjectId, {
        studentId: row.studentId,
        marksObtained: Number(value),
      }),
    onSuccess: () => {
      setSaved(true)
      onSaveSuccess?.()
      show('Marks saved for ' + row.studentName, 'success')
    },
    onError: (err) => {
      show(err?.response?.data?.message ?? 'Failed to save marks.', 'error')
    },
  })

  const numVal = Number(value)
  const isValid = value !== '' && !isNaN(numVal) && numVal >= 0 && numVal <= maxMarks
  const isDirty = String(row.marksObtained ?? '') !== value
  const pct = isValid ? (numVal / maxMarks) * 100 : null
  const grade = pct != null ? gradeFromPct(pct) : null

  return (
    <>
      <ToastContainer toasts={toasts} />
      <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
        <td className="py-3 pr-4 font-medium text-gray-800 text-sm">{row.studentName}</td>
        <td className="py-3 px-3 text-sm text-gray-500 tabular-nums">{row.admissionNo ?? '—'}</td>
        <td className="py-3 px-3 text-sm text-center tabular-nums text-gray-600">{maxMarks}</td>
        <td className="py-3 px-3">
          <input
            type="number"
            min={0}
            max={maxMarks}
            step={0.5}
            className={
              'w-24 rounded-lg border px-2.5 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-1 ' +
              (isValid || value === ''
                ? 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                : 'border-red-400 focus:border-red-500 focus:ring-red-500')
            }
            value={value}
            onChange={e => { setValue(e.target.value); setSaved(false) }}
            aria-label={'Marks for ' + row.studentName}
          />
          {value !== '' && !isValid && (
            <p className="text-xs text-red-500 mt-0.5">0–{maxMarks}</p>
          )}
        </td>
        <td className="py-3 px-3 text-center">
          {grade ? (
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${gradeColor(grade)}`}>
              {grade}
            </span>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </td>
        <td className="py-3 pl-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!isValid || !isDirty || mutation.isPending}
              onClick={() => mutation.mutate()}
              className="btn-primary py-1.5 text-xs disabled:opacity-40 flex items-center gap-1.5"
            >
              {mutation.isPending ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              Save
            </button>
            {saved && !isDirty && (
              <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium" role="status">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
          </div>
        </td>
      </tr>
    </>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function MarksEntryPage() {
  const { toasts, show } = useToast()

  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedTermId, setSelectedTermId] = useState('')
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedExamSubjectId, setSelectedExamSubjectId] = useState('')

  const { data: years = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: academicsApi.listYears,
  })

  const { data: terms = [] } = useQuery({
    queryKey: ['terms', selectedYearId],
    queryFn: () => academicsApi.listTerms(selectedYearId),
    enabled: !!selectedYearId,
  })

  const { data: exams = [] } = useQuery({
    queryKey: ['exams', selectedTermId],
    queryFn: () => examsApi.listByTerm(selectedTermId),
    enabled: !!selectedTermId,
  })

  const { data: examSubjects = [] } = useQuery({
    queryKey: ['exam-subjects', selectedExamId],
    queryFn: () => examsApi.getSubjects(selectedExamId),
    enabled: !!selectedExamId,
  })

  const {
    data: marksData,
    isLoading: marksLoading,
    isError: marksError,
    refetch: refetchMarks,
  } = useQuery({
    queryKey: ['marks', selectedExamSubjectId],
    queryFn: () => examsApi.getMarks(selectedExamSubjectId),
    enabled: !!selectedExamSubjectId,
  })

  const selectedSubject = examSubjects.find(s => String(s.id) === selectedExamSubjectId)
  const maxMarks = selectedSubject?.maxMarks ?? 100
  const rows = marksData ?? []

  const handleSaveSuccess = useCallback(() => {
    // Refetch to stay in sync but don't reset UI — individual rows track saved state
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <ToastContainer toasts={toasts} />

      <div className="max-w-5xl mx-auto">

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Marks Entry</h1>
          <p className="text-sm text-gray-500 mt-1">Select an exam and subject, then enter marks for each student.</p>
        </div>

        {/* Selectors */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Academic Year</label>
              <select
                className="input"
                value={selectedYearId}
                onChange={e => {
                  setSelectedYearId(e.target.value)
                  setSelectedTermId('')
                  setSelectedExamId('')
                  setSelectedExamSubjectId('')
                }}
              >
                <option value="">Select year</option>
                {years.map(y => (
                  <option key={y.id} value={y.id}>{y.name ?? y.year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Term</label>
              <select
                className="input"
                value={selectedTermId}
                disabled={!selectedYearId}
                onChange={e => {
                  setSelectedTermId(e.target.value)
                  setSelectedExamId('')
                  setSelectedExamSubjectId('')
                }}
              >
                <option value="">Select term</option>
                {terms.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Exam</label>
              <select
                className="input"
                value={selectedExamId}
                disabled={!selectedTermId}
                onChange={e => {
                  setSelectedExamId(e.target.value)
                  setSelectedExamSubjectId('')
                }}
              >
                <option value="">Select exam</option>
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Subject</label>
              <select
                className="input"
                value={selectedExamSubjectId}
                disabled={!selectedExamId}
                onChange={e => setSelectedExamSubjectId(e.target.value)}
              >
                <option value="">Select subject</option>
                {examSubjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.subjectName} (Max: {s.maxMarks})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Marks Table */}
        {!selectedExamSubjectId && (
          <div className="card text-center text-gray-400 py-16">
            Select a subject above to begin entering marks.
          </div>
        )}

        {selectedExamSubjectId && marksLoading && (
          <div className="card text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Loading student list…</p>
          </div>
        )}

        {selectedExamSubjectId && marksError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            Could not load marks data. Check your connection and try again.
          </div>
        )}

        {selectedExamSubjectId && !marksLoading && !marksError && (
          <div className="card p-0 overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  {selectedSubject?.subjectName ?? 'Subject'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Maximum marks: {maxMarks} &middot; {rows.length} student{rows.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary text-xs py-1.5"
                onClick={() => refetchMarks()}
              >
                Refresh
              </button>
            </div>

            {rows.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">
                No students enrolled in this subject.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Student Name</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Admission No.</th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Max Marks</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Marks Obtained</th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Grade</th>
                      <th className="py-3 pl-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => (
                      <MarksRow
                        key={row.studentId}
                        row={row}
                        examSubjectId={selectedExamSubjectId}
                        maxMarks={maxMarks}
                        onSaveSuccess={handleSaveSuccess}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
