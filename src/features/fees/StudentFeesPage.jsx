import { useQuery } from '@tanstack/react-query'
import { feesApi } from '../../api/feesApi'
import { useAuth } from '../../auth/AuthContext'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import { IconWallet } from '../../components/ui/Icons'

const rupee = (n) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`

function StatusBadge({ status }) {
  const map = { PAID: 'badge-green', PARTIAL: 'badge-amber', PENDING: 'badge-red' }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status || 'PENDING'}</span>
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
      <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 500, color: color || 'var(--ink)', margin: '8px 0 0', letterSpacing: '-0.01em' }}>{value}</p>
    </div>
  )
}

export default function StudentFeesPage() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['my-fees', user?.studentId],
    queryFn: () => feesApi.getStudentFees(user.studentId),
    enabled: !!user?.studentId,
  })

  return (
    <div className="page" style={{ maxWidth: 880 }}>
      <PageHeader eyebrow="Finance" title="My Fees" subtitle="Your fee structure and payment status for this academic year" />

      {isLoading ? <Spinner /> : !data?.lines?.length ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--canvas-sunk)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--faint)' }}><IconWallet size={22} /></div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>No fees published yet</p>
          <p style={{ fontSize: 13, color: 'var(--faint)', marginTop: 4 }}>Your school hasn't set up fees for your class yet.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 22 }}>
            <SummaryCard label="Total Fees" value={rupee(data.totalAmount)} />
            <SummaryCard label="Paid"       value={rupee(data.totalPaid)} color="var(--success)" />
            <SummaryCard label="Due"        value={rupee(data.totalDue)}  color={data.totalDue > 0 ? 'var(--danger)' : 'var(--success)'} />
          </div>
          <div className="table-container">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', background: 'var(--canvas-sunk)' }}>
              <h2 className="card-title" style={{ fontSize: 15 }}>Fee Breakdown</h2>
            </div>
            <table className="data-table">
              <thead><tr><th>Fee Head</th><th>Frequency</th><th>Amount</th><th>Paid</th><th>Due</th><th>Status</th></tr></thead>
              <tbody>
                {data.lines.map(l => (
                  <tr key={l.feeStructureId}>
                    <td style={{ fontWeight: 600 }}>{l.feeHeadName}</td>
                    <td style={{ color: 'var(--muted)' }}>{l.frequency || '—'}</td>
                    <td>{rupee(l.amount)}</td>
                    <td style={{ color: 'var(--success)' }}>{rupee(l.amountPaid)}</td>
                    <td style={{ color: l.due > 0 ? 'var(--danger)' : 'var(--muted)' }}>{rupee(l.due)}</td>
                    <td><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
