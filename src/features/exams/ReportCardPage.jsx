import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth/AuthContext'
import { examsApi } from '../../api/examsApi'
import { academicsApi } from '../../api/academicsApi'

// ── Grade helpers ──────────────────────────────────────────────────────────────
function gradeLabel(pct) {
  if (pct >= 90) return { grade: 'A+', points: 4.0, color: 'text-emerald-700 bg-emerald-50' }
  if (pct >= 80) return { grade: 'A',  points: 3.7, color: 'text-emerald-700 bg-emerald-50' }
  if (pct >= 70) return { grade: 'B+', points: 3.3, color: 'text-blue-700 bg-blue-50' }
  if (pct >= 60) return { grade: 'B',  points: 3.0, color: 'text-blue-700 bg-blue-50' }
  if (pct >= 50) return { grade: 'C',  points: 2.0, color: 'text-yellow-700 bg-yellow-50' }
  if (pct >= 40) return { grade: 'D',  points: 1.0, color: 'text-orange-700 bg-orange-50' }
  return { grade: 'F', points: 0.0, color: 'text-red-700 bg-red-50' }
}

function AttendanceBar({ percentage }) {
  const pct = Math.min(100, Math.max(0, percentage ?? 0))
  const color =
    pct >= 75 ? 'bg-emerald-500' :
    pct >= 60 ? 'bg-yellow-400' :
    'bg-red-500'
  const labelColor =
    pct >= 75 ? 'text-emerald-700' :
    pct >= 60 ? 'text-yellow-700' :
    'text-red-700'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: pct + '%' }}
        />
      </div>
      <span className={`text-sm font-semibold tabular-nums w-12 text-right ${labelColor}`}>
        {pct.toFixed(1)}%
      </span>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ReportCardPage() {
  const { studentId: routeStudentId } = useParams()
  const { user } = useAuth()

  // Students see their own report card; admins/teachers use route param
  const studentId = routeStudentId ?? user?.studentId ?? user?.id

  const [selectedTermId, setSelectedTermId] = useState('')
  const [selectedYearId, setSelectedYearId] = useState('')

  const { data: years = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: academicsApi.listYears,
  })

  const { data: terms = [] } = useQuery({
    queryKey: ['terms', selectedYearId],
    queryFn: () => academicsApi.listTerms(selectedYearId),
    enabled: !!selectedYearId,
  })

  const {
    data: report,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['report-card', studentId, selectedTermId],
    queryFn: () => examsApi.getReportCard(studentId, selectedTermId),
    enabled: !!studentId && !!selectedTermId,
  })

  // Compute aggregates from report data
  const subjects = report?.subjects ?? []
  const totalMax = subjects.reduce((s, sub) => s + (sub.maxMarks ?? 0), 0)
  const totalObtained = subjects.reduce((s, sub) => s + (sub.marksObtained ?? 0), 0)
  const overallPct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
  const { grade: overallGrade, points: overallPoints } = gradeLabel(overallPct)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print styles injected inline so they work without a separate CSS file */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>

      {/* ── Controls (hidden when printing) ── */}
      <div className="no-print max-w-4xl mx-auto px-4 pt-6 pb-2">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">Academic Year</label>
            <select
              className="input w-48"
              value={selectedYearId}
              onChange={e => { setSelectedYearId(e.target.value); setSelectedTermId('') }}
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
              className="input w-48"
              value={selectedTermId}
              onChange={e => setSelectedTermId(e.target.value)}
              disabled={!selectedYearId}
            >
              <option value="">Select term</option>
              {terms.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          {report && (
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-primary flex items-center gap-2 ml-auto"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a1 1 0 001-1v-4H9v4a1 1 0 001 1zm-1-9V5a1 1 0 011-1h2a1 1 0 011 1v3" />
              </svg>
              Print
            </button>
          )}
        </div>
      </div>

      {/* ── States ── */}
      {!selectedTermId && (
        <div className="no-print max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">
          Select an academic year and term to view the report card.
        </div>
      )}

      {selectedTermId && isLoading && (
        <div className="no-print max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">
          <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Loading report card…</p>
        </div>
      )}

      {selectedTermId && isError && (
        <div className="no-print max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            Could not load report card.{error?.response?.data?.message ? ' ' + error.response.data.message : ''}
          </div>
        </div>
      )}

      {/* ── Report Card ── */}
      {report && (
        <div className="max-w-4xl mx-auto px-4 py-6 print-card">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Header */}
            <div className="bg-indigo-700 px-8 py-7 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">School Management System</h1>
                  <p className="text-indigo-200 text-sm mt-0.5">Academic Report Card</p>
                </div>
                <div className="text-right text-sm text-indigo-200 shrink-0">
                  <div>{report.academicYear ?? '—'}</div>
                  <div className="font-medium text-white">{report.termName ?? '—'}</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-indigo-300 text-xs uppercase tracking-wider font-medium">Student</div>
                  <div className="text-white font-semibold mt-0.5">{report.studentName ?? '—'}</div>
                </div>
                <div>
                  <div className="text-indigo-300 text-xs uppercase tracking-wider font-medium">Admission No.</div>
                  <div className="text-white font-semibold mt-0.5">{report.admissionNo ?? '—'}</div>
                </div>
                <div>
                  <div className="text-indigo-300 text-xs uppercase tracking-wider font-medium">Class</div>
                  <div className="text-white font-semibold mt-0.5">{report.className ?? '—'}</div>
                </div>
                <div>
                  <div className="text-indigo-300 text-xs uppercase tracking-wider font-medium">Section</div>
                  <div className="text-white font-semibold mt-0.5">{report.sectionName ?? '—'}</div>
                </div>
              </div>
            </div>

            {/* Attendance */}
            <div className="px-8 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Attendance</span>
                <span className="text-xs text-gray-500">
                  {report.attendanceSummary?.presentDays ?? '—'} / {report.attendanceSummary?.totalDays ?? '—'} days present
                </span>
              </div>
              <AttendanceBar percentage={report.attendanceSummary?.percentage} />
            </div>

            {/* Marks Table */}
            <div className="px-8 py-6">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Subject Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2.5 pr-4 font-semibold text-gray-600">Subject</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-gray-600">Max</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-gray-600">Obtained</th>
                      <th className="text-right py-2.5 px-3 font-semibold text-gray-600">%</th>
                      <th className="text-center py-2.5 px-3 font-semibold text-gray-600">Grade</th>
                      <th className="text-right py-2.5 pl-3 font-semibold text-gray-600">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">
                          No subject data available.
                        </td>
                      </tr>
                    ) : subjects.map((sub, i) => {
                      const pct = sub.maxMarks > 0 ? (sub.marksObtained / sub.maxMarks) * 100 : 0
                      const { grade, points, color } = gradeLabel(pct)
                      return (
                        <tr key={sub.subjectId ?? i} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 pr-4 font-medium text-gray-800">{sub.subjectName}</td>
                          <td className="py-3 px-3 text-right tabular-nums text-gray-600">{sub.maxMarks}</td>
                          <td className="py-3 px-3 text-right tabular-nums font-semibold text-gray-800">{sub.marksObtained ?? '—'}</td>
                          <td className="py-3 px-3 text-right tabular-nums text-gray-600">{sub.marksObtained != null ? pct.toFixed(1) + '%' : '—'}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${color}`}>{grade}</span>
                          </td>
                          <td className="py-3 pl-3 text-right tabular-nums text-gray-600">{sub.marksObtained != null ? points.toFixed(1) : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {subjects.length > 0 && (
                    <tfoot>
                      <tr className="bg-indigo-50 border-t-2 border-indigo-200">
                        <td className="py-3 pr-4 font-bold text-indigo-900">Total</td>
                        <td className="py-3 px-3 text-right tabular-nums font-bold text-indigo-900">{totalMax}</td>
                        <td className="py-3 px-3 text-right tabular-nums font-bold text-indigo-900">{totalObtained}</td>
                        <td className="py-3 px-3 text-right tabular-nums font-bold text-indigo-900">{overallPct.toFixed(1)}%</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${gradeLabel(overallPct).color}`}>
                            {overallGrade}
                          </span>
                        </td>
                        <td className="py-3 pl-3 text-right tabular-nums font-bold text-indigo-900">{overallPoints.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Remarks */}
            <div className="px-8 pb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Class Teacher's Remarks</div>
                  <div className="min-h-[72px] rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    {report.classTeacherRemarks || (
                      <span className="text-gray-400 italic">No remarks recorded.</span>
                    )}
                  </div>
                  <div className="mt-3 border-t border-gray-300 pt-1">
                    <div className="text-xs text-gray-400">Class Teacher Signature</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Principal's Remarks</div>
                  <div className="min-h-[72px] rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    {report.principalRemarks || (
                      <span className="text-gray-400 italic">No remarks recorded.</span>
                    )}
                  </div>
                  <div className="mt-3 border-t border-gray-300 pt-1">
                    <div className="text-xs text-gray-400">Principal Signature</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
