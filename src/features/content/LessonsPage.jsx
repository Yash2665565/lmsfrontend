import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../app/axios'
import Spinner from '../../components/ui/Spinner'
import PageHeader from '../../components/ui/PageHeader'

const SUBJECT_COLORS = [
  'bg-indigo-50','bg-blue-50','bg-green-50','bg-amber-50','bg-purple-50','bg-pink-50','bg-teal-50','bg-orange-50'
]

export default function LessonsPage() {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const { data: subjectsData, isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data.data ?? []),
  })
  const subjects = subjectsData ?? []

  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', search],
    queryFn: () => api.get('/lessons', { params: { search, page: 0, size: 50 } }).then(r => r.data.data ?? []),
  })
  const lessons = lessonsData ?? []

  return (
    <div className="page">
      <PageHeader title="Lessons" subtitle="Browse all lessons and learning materials" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Subjects sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Subjects</p>
            {subjectsLoading ? <Spinner /> : (
              <div className="space-y-1">
                {subjects.map((s, i) => (
                  <div key={s.id}
                    className={'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600'}>
                    <span className={'inline-block w-2 h-2 rounded-full flex-shrink-0 ' + (SUBJECT_COLORS[i % SUBJECT_COLORS.length])} />
                    {s.name}
                  </div>
                ))}
                {subjects.length === 0 && (
                  <p className="text-xs text-slate-400 px-2 py-4 text-center">No subjects found</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lessons main panel */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search lessons..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          </div>

          {lessonsLoading ? <Spinner /> : (
            lessons.length === 0 ? (
              <div className="card flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl mb-4">📚</span>
                <p className="text-slate-600 font-medium">No lessons found</p>
                <p className="text-slate-400 text-sm mt-1">
                  {search ? 'Try a different search term' : 'No lessons have been added yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {lessons.map((lesson, i) => (
                  <div key={lesson.id ?? i} className="card overflow-hidden">
                    <button
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                      onClick={() => setExpandedId(expandedId === lesson.id ? null : lesson.id)}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">
                          {lesson.title || lesson.name || `Lesson ${i + 1}`}
                        </p>
                        {lesson.about && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{lesson.about}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {lesson.moduleType && <span className="badge badge-blue">{lesson.moduleType}</span>}
                        {lesson.video && <span className="badge badge-green">Video</span>}
                        <span className={'text-slate-400 text-xs transition-transform ' + (expandedId === lesson.id ? 'rotate-180' : '')}>▼</span>
                      </div>
                    </button>
                    {expandedId === lesson.id && (
                      <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                        {lesson.description && <p className="text-sm text-slate-600 mb-3">{lesson.description}</p>}
                        {lesson.video && (
                          <a href={lesson.video} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-indigo-600 text-sm font-medium">
                            ▶ Watch Video
                          </a>
                        )}
                        {!lesson.description && !lesson.video && (
                          <p className="text-sm text-slate-400 italic">No additional content available.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
