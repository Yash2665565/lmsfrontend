import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../app/axios'
import DataTable from '../../components/ui/DataTable'
import Spinner from '../../components/ui/Spinner'
import AttendancePercent from '../../components/ui/AttendancePercent'

// ─── Tabs config ──────────────────────────────────────────────
const TABS = [
  { id: 'low',     label: 'Low Attendance' },
  { id: 'daily',   label: 'Daily Absentees' },
  { id: 'summary', label: 'Student Summary' },
]

// ─── Tab bar ──────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex gap-1" aria-label="Report tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
              ${active === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

// ─── Percent cell ─────────────────────────────────────────────
function PctCell({ row }) {
  const pct = typeof row.attendancePct === 'number'
    ? Math.round(row.attendancePct)
    : Number(row.attendancePct ?? 0)
  return <AttendancePercent pct={pct} />
}

// ─── Section: Low Attendance ──────────────────────────────────
function LowAttendanceTab() {
  const [termId, setTermId]         = useState('')
  const [threshold, setThreshold]   = useState(75)
  const [fetchParams, setFetchParams] = useState(null)

  const { data: termsRaw } = useQuery({
    queryKey: ['terms'],
    queryFn: () => api.get('/terms').then(r => r.data.data ?? r.data),
  })
  const terms = termsRaw?.content ?? termsRaw ?? []

  const { data, isLoading } = useQuery({
    queryKey: ['report-low', fetchParams?.termId, fetchParams?.threshold],
    queryFn: () =>
      api.get('/reports/attendance/low', {
        params: {
          termId: fetchParams.termId || undefined,
          threshold: fetchParams.threshold,
        },
      }).then(r => r.data.data ?? r.data),
    enabled: Boolean(fetchParams),
  })

  const rows = data?.content ?? data ?? []

  const columns = [
    {
      key: 'studentName',
      label: 'Student',
      render: row => <span className="font-medium text-slate-800">{row.studentName ?? row.name}</span>,
    },
    { key: 'admissionNo', label: 'Adm No.' },
    { key: 'sectionName', label: 'Section' },
    { key: 'presentDays', label: 'Present' },
    { key: 'absentDays',  label: 'Absent' },
    {
      key: 'attendancePct',
      label: 'Attendance %',
      render: row => <PctCell row={row} />,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="low-term">Term</label>
            <select
              id="low-term"
              className="input"
              value={termId}
              onChange={e => setTermId(e.target.value)}
            >
              <option value="">All terms</option>
              {terms.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="low-threshold">Threshold (%)</label>
            <input
              id="low-threshold"
              type="number"
              min={0}
              max={100}
              className="input"
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => setFetchParams({ termId, threshold })}
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {fetchParams && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">
              Students below {fetchParams.threshold}% attendance
            </p>
          </div>
          {isLoading ? (
            <Spinner />
          ) : (
            <DataTable
              columns={columns}
              data={rows}
              emptyMessage={`No students below ${fetchParams.threshold}% in the selected term.`}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Section: Daily Absentees ─────────────────────────────────
function DailyAbsenteesTab() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)

  const { data, isLoading } = useQuery({
    queryKey: ['report-daily', date],
    queryFn: () =>
      api.get('/reports/attendance/daily', { params: { date } })
        .then(r => r.data.data ?? r.data),
    enabled: Boolean(date),
  })

  const rows = data?.content ?? data ?? []

  const statusBadgeClass = (val) => {
    if (val === 'ABSENT')   return 'badge-red'
    if (val === 'LATE')     return 'badge-yellow'
    if (val === 'EXCUSED')  return 'badge-blue'
    if (val === 'HALF_DAY') return 'badge-purple'
    return 'badge-gray'
  }

  const columns = [
    {
      key: 'studentName',
      label: 'Student',
      render: row => <span className="font-medium text-slate-800">{row.studentName ?? row.name}</span>,
    },
    { key: 'admissionNo', label: 'Adm No.' },
    { key: 'sectionName', label: 'Section' },
    {
      key: 'status',
      label: 'Status',
      render: row => (
        <span className={`badge ${statusBadgeClass(row.status)}`}>
          {row.status ? row.status.charAt(0) + row.status.slice(1).toLowerCase() : '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="label" htmlFor="daily-date">Date</label>
            <input
              id="daily-date"
              type="date"
              className="input"
              value={date}
              max={today}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">Absentees on {date}</p>
        </div>
        {isLoading ? (
          <Spinner />
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            emptyMessage={`No absences recorded on ${date}.`}
          />
        )}
      </div>
    </div>
  )
}

// ─── Section: Student Summary ─────────────────────────────────
function StudentSummaryTab() {
  const [search, setSearch]                   = useState('')
  const [selectedId, setSelectedId]           = useState(null)
  const [selectedName, setSelectedName]       = useState('')
  const [dropdownOpen, setDropdownOpen]       = useState(false)

  const { data: studentsRaw, isLoading: searchLoading } = useQuery({
    queryKey: ['student-search-report', search],
    queryFn: () =>
      api.get('/students', { params: { search, size: 10 } }).then(r => r.data.data ?? r.data),
    enabled: search.length >= 2,
  })
  const students = studentsRaw?.content ?? studentsRaw ?? []

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['student-attendance-summary', selectedId],
    queryFn: () =>
      api.get(`/students/${selectedId}/attendance-summary`).then(r => r.data.data ?? r.data),
    enabled: Boolean(selectedId),
  })

  const summaryRows = summary?.content ?? summary ?? []

  const handleSelect = (s) => {
    const name = s.firstName
      ? `${s.firstName} ${s.lastName ?? ''}`.trim()
      : s.name ?? `Student ${s.id}`
    setSelectedId(s.id)
    setSelectedName(name)
    setSearch(name)
    setDropdownOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <label className="label" htmlFor="student-search">Search student</label>
        <div className="relative max-w-sm">
          <input
            id="student-search"
            type="text"
            className="input"
            placeholder="Type at least 2 characters…"
            value={search}
            autoComplete="off"
            onChange={e => {
              setSearch(e.target.value)
              setSelectedId(null)
              setSelectedName('')
              setDropdownOpen(true)
            }}
          />
          {searchLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              Searching…
            </span>
          )}

          {dropdownOpen && students.length > 0 && !selectedId && (
            <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-50 max-h-48 overflow-y-auto">
              {students.map(s => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition-colors"
                    onClick={() => handleSelect(s)}
                  >
                    <span className="font-medium text-slate-800">
                      {s.firstName} {s.lastName}
                    </span>
                    <span className="ml-2 text-slate-400 text-xs">{s.admissionNo}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {selectedId && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">
              Attendance summary — {selectedName}
            </p>
          </div>

          {summaryLoading ? (
            <Spinner />
          ) : summaryRows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">
              No attendance data on record for this student.
            </p>
          ) : (
            <div className="divide-y divide-slate-50">
              {summaryRows.map((row, i) => {
                const pct = typeof row.attendancePct === 'number'
                  ? Math.round(row.attendancePct)
                  : Number(row.attendancePct ?? 0)
                return (
                  <div key={i} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {row.term?.name ?? row.termName ?? `Term ${i + 1}`}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {row.presentDays ?? '—'} present
                        &nbsp;·&nbsp;{row.absentDays ?? '—'} absent
                        {row.lateDays != null && <>&nbsp;·&nbsp;{row.lateDays} late</>}
                        &nbsp;·&nbsp;{row.totalDays ?? '—'} total
                      </p>
                    </div>
                    <AttendancePercent pct={pct} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────
export default function AttendanceReport() {
  const [activeTab, setActiveTab] = useState('low')

  return (
    <div className="page space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Attendance Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Analyse trends across sections, dates, and individual students.
        </p>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      <div>
        {activeTab === 'low'     && <LowAttendanceTab />}
        {activeTab === 'daily'   && <DailyAbsenteesTab />}
        {activeTab === 'summary' && <StudentSummaryTab />}
      </div>
    </div>
  )
}
