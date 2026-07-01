import { useQuery } from '@tanstack/react-query'
import api from '../../app/axios'
import { useAuth } from '../../auth/AuthContext'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import { IconFileText } from '../../components/ui/Icons'

export default function StudentExamsPage() {
  const { user } = useAuth()
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['my-exams', user?.studentId],
    queryFn: () => api.get(`/students/${user.studentId}/exams`).then(r => r.data.data ?? []),
    enabled: !!user?.studentId,
  })

  return (
    <div className="page" style={{ maxWidth: 880 }}>
      <PageHeader eyebrow="Academics" title="My Exams" subtitle="Datesheet and papers for your class" />

      {isLoading ? <Spinner /> : exams.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--canvas-sunk)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--faint)' }}>
            <IconFileText size={22} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>No exams scheduled</p>
          <p style={{ fontSize: 13, color: 'var(--faint)', marginTop: 4 }}>Your datesheet will appear here once the school publishes it.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {exams.map(ex => (
            <div key={ex.examId} className="table-container">
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', background: 'var(--canvas-sunk)' }}>
                <h2 className="card-title" style={{ fontSize: 16 }}>{ex.examName}</h2>
              </div>
              <table className="data-table">
                <thead><tr><th>Subject</th><th>Date</th><th>Time</th><th>Max Marks</th></tr></thead>
                <tbody>
                  {(ex.papers || []).map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{p.subjectName || '—'}</td>
                      <td>{p.examDate ? new Date(p.examDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td style={{ color: 'var(--muted)' }}>{p.startTime || '—'}</td>
                      <td>{p.maxMarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
