import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../app/axios'
import { useAuth } from '../../auth/AuthContext'
import Spinner from '../../components/ui/Spinner'

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
]

const SUBJECT_COLORS = [
  'bg-indigo-100 text-indigo-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-cyan-100 text-cyan-800',
  'bg-violet-100 text-violet-800',
  'bg-orange-100 text-orange-800',
  'bg-teal-100 text-teal-800',
]

function subjectColor(subjectId) {
  if (!subjectId) return 'bg-gray-100 text-gray-500'
  const id = typeof subjectId === 'number' ? subjectId : parseInt(subjectId, 10) || 0
  return SUBJECT_COLORS[id % SUBJECT_COLORS.length]
}

function EmptyTimetable() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-sm font-medium text-gray-500">No timetable set up yet</p>
      <p className="text-xs text-gray-400 mt-1">The admin hasn't configured the schedule for this term.</p>
    </div>
  )
}

function TimetableGrid({ slots, periods, isTeacher }) {
  if (!periods.length) return <EmptyTimetable />

  const lookup = {}
  ;(slots ?? []).forEach(slot => {
    const dow = slot.dayOfWeek
    const pid = slot.period?.id ?? slot.periodId
    if (!lookup[dow]) lookup[dow] = {}
    lookup[dow][pid] = slot
  })

  const today = new Date().getDay()
  const todayDow = today === 0 || today === 6 ? null : today

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-r border-gray-200">
              Period
            </th>
            {DAYS.map(d => (
              <th
                key={d.value}
                className={`px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider border-b border-r border-gray-200
                  ${d.value === todayDow ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-50 text-gray-500'}`}
              >
                {d.label}
                {d.value === todayDow && (
                  <span className="ml-1 text-indigo-500 font-normal normal-case">(today)</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period, rowIdx) => (
            <tr key={period.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-3 py-3 border-r border-b border-gray-200 whitespace-nowrap">
                <p className="font-medium text-gray-900">{period.name}</p>
                {(period.startTime || period.endTime) && (
                  <p className="text-xs text-gray-400">
                    {period.startTime}{period.startTime && period.endTime ? ' – ' : ''}{period.endTime}
                  </p>
                )}
              </td>
              {DAYS.map(d => {
                const slot = lookup[d.value]?.[period.id]
                const isToday = d.value === todayDow
                return (
                  <td
                    key={d.value}
                    className={`px-2 py-2 border-r border-b border-gray-200 text-center align-middle min-w-[130px]
                      ${isToday ? 'bg-indigo-50/50' : ''}`}
                  >
                    {slot ? (
                      <div
                        className={`inline-flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg w-full
                          ${subjectColor(slot.subject?.id ?? slot.subjectId)}`}
                      >
                        <span className="font-medium text-xs leading-snug">
                          {slot.subject?.name ?? slot.subjectName ?? 'Subject'}
                        </span>
                        {!isTeacher && (slot.teacher?.name ?? slot.teacherName) && (
                          <span className="text-xs opacity-70 truncate max-w-full">
                            {slot.teacher?.name ?? slot.teacherName}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
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

export default function TimetablePage() {
  const { user, isTeacher, isStudent } = useAuth()
  const teacher = isTeacher?.() ?? false
  const student = isStudent?.() ?? false

  const [selectedSectionId, setSelectedSectionId] = useState('')

  // Sections list (teacher view)
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections'],
    queryFn: () => api.get('/sections').then(r => {
      const d = r.data?.data
      return d?.content ?? (Array.isArray(d) ? d : [])
    }),
    enabled: teacher,
  })

  // Periods (all roles)
  const { data: periods = [] } = useQuery({
    queryKey: ['periods'],
    queryFn: () => api.get('/periods').then(r => {
      const list = r.data?.data
      return Array.isArray(list) ? [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) : []
    }),
  })

  // Teacher: timetable for selected section (academicYearId now optional — backend resolves current year)
  const { data: teacherTimetable = [], isLoading: teacherLoading } = useQuery({
    queryKey: ['timetable-section', selectedSectionId],
    queryFn: () => api.get(`/sections/${selectedSectionId}/timetable`).then(r => r.data?.data ?? []),
    enabled: teacher && !!selectedSectionId,
  })

  // Student: /timetable/me — backend resolves current user → student → enrollment → slots
  const { data: studentTimetable = [], isLoading: studentLoading } = useQuery({
    queryKey: ['timetable-me'],
    queryFn: () => api.get('/timetable/me').then(r => r.data?.data ?? []),
    enabled: student,
  })

  const slots = teacher ? teacherTimetable : studentTimetable
  const isLoading = teacher ? teacherLoading : studentLoading

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
        <p className="text-sm text-gray-500 mt-1">
          {teacher ? 'Select a section to view its weekly schedule.' : 'Your weekly class schedule.'}
        </p>
      </div>

      {/* Section selector for teacher */}
      {teacher && (
        <div className="card">
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-sm">
              <label className="label" htmlFor="tt-section-select">Section</label>
              {sectionsLoading ? (
                <div className="input text-gray-400 text-sm">Loading sections…</div>
              ) : (
                <select
                  id="tt-section-select"
                  className="input"
                  value={selectedSectionId}
                  onChange={e => setSelectedSectionId(e.target.value)}
                >
                  <option value="">Select a section</option>
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.classGrade?.name ?? s.className ?? ''} – {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subject legend */}
      {slots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[...new Map(slots.map(s => [
            s.subject?.id ?? s.subjectId,
            s.subject?.name ?? s.subjectName ?? 'Unknown'
          ])).entries()].map(([id, name]) => (
            <span key={id} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${subjectColor(id)}`}>
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="card p-0 overflow-hidden">
        {teacher && !selectedSectionId ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Select a section above to view its timetable.</p>
          </div>
        ) : isLoading ? (
          <Spinner />
        ) : (
          <TimetableGrid slots={slots} periods={periods} isTeacher={teacher} />
        )}
      </div>
    </div>
  )
}
