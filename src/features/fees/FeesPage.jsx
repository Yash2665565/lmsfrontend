import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { feesApi, sectionLabel } from '../../api/feesApi'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import { IconPlus, IconTrash } from '../../components/ui/Icons'

const TABS = ['Fee Heads', 'Structure', 'Collections']
const rupee = (n) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`

function StatusBadge({ status }) {
  const map = { PAID: 'badge-green', PARTIAL: 'badge-amber', PENDING: 'badge-red' }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status || 'PENDING'}</span>
}

/* ── Fee Heads ── */
function HeadsTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const { data: heads = [], isLoading } = useQuery({ queryKey: ['fee-heads'], queryFn: feesApi.getHeads })
  const { register, handleSubmit, reset } = useForm()
  const create = useMutation({ mutationFn: feesApi.createHead, onSuccess: () => { qc.invalidateQueries({ queryKey: ['fee-heads'] }); setOpen(false); reset() } })
  const del = useMutation({ mutationFn: feesApi.deleteHead, onSuccess: () => qc.invalidateQueries({ queryKey: ['fee-heads'] }) })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}><IconPlus size={14} /> Add Fee Head</button>
      </div>
      {isLoading ? <Spinner /> : heads.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--faint)' }}>No fee heads yet. Add Tuition, Uniform, Books, Transport, etc.</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Fee Head</th><th>Description</th><th></th></tr></thead>
            <tbody>
              {heads.map(h => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 600 }}>{h.name}</td>
                  <td style={{ color: 'var(--muted)' }}>{h.description || '—'}</td>
                  <td style={{ textAlign: 'right' }}><button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del.mutate(h.id)}><IconTrash size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Fee Head">
        <form onSubmit={handleSubmit(d => create.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="label">Name *</label><input className="input" placeholder="e.g. Tuition / Uniform / Books / Transport" {...register('name', { required: true })} /></div>
          <div><label className="label">Description</label><input className="input" {...register('description')} /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary" disabled={create.isPending}>{create.isPending ? 'Adding…' : 'Add'}</button></div>
        </form>
      </Modal>
    </div>
  )
}

/* ── Structure per section ── */
function StructureTab() {
  const qc = useQueryClient()
  const { data: sections = [] } = useQuery({ queryKey: ['fee-sections'], queryFn: feesApi.getSections })
  const { data: heads = [] } = useQuery({ queryKey: ['fee-heads'], queryFn: feesApi.getHeads })
  const [sectionId, setSectionId] = useState('')
  const { data: structures = [], isLoading } = useQuery({
    queryKey: ['fee-structures', sectionId], queryFn: () => feesApi.getStructures(sectionId), enabled: !!sectionId,
  })
  const byHead = {}; structures.forEach(s => { byHead[s.feeHeadId] = s })
  const [draft, setDraft] = useState({})

  const save = useMutation({
    mutationFn: (b) => feesApi.upsertStructure(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fee-structures', sectionId] }),
  })

  return (
    <div>
      <div style={{ marginBottom: 16, maxWidth: 360 }}>
        <label className="label">Section</label>
        <select className="input" value={sectionId} onChange={e => { setSectionId(e.target.value); setDraft({}) }}>
          <option value="">— Select a section —</option>
          {sections.map(s => <option key={s.id} value={s.id}>{sectionLabel(s)}</option>)}
        </select>
      </div>
      {!sectionId ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--faint)' }}>Select a section to set its fee amounts.</div>
      ) : heads.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--faint)' }}>Add fee heads first (Fee Heads tab).</div>
      ) : isLoading ? <Spinner /> : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Fee Head</th><th style={{ width: 180 }}>Amount (₹)</th><th style={{ width: 160 }}>Frequency</th><th style={{ width: 90 }}></th></tr></thead>
            <tbody>
              {heads.map(h => {
                const existing = byHead[h.id]
                const d = draft[h.id] || {}
                const amount = d.amount ?? existing?.amount ?? ''
                const freq = d.frequency ?? existing?.frequency ?? 'Annual'
                return (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 600 }}>{h.name}</td>
                    <td><input type="number" className="input" value={amount} onChange={e => setDraft(p => ({ ...p, [h.id]: { ...p[h.id], amount: e.target.value } }))} placeholder="0" /></td>
                    <td>
                      <select className="input" value={freq} onChange={e => setDraft(p => ({ ...p, [h.id]: { ...p[h.id], frequency: e.target.value } }))}>
                        <option>Annual</option><option>Term</option><option>Monthly</option><option>One-time</option>
                      </select>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" disabled={save.isPending}
                        onClick={() => save.mutate({ sectionId: Number(sectionId), feeHeadId: h.id, amount: Number(amount) || 0, frequency: freq })}>
                        Save
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Collections ── */
function StudentFeeModal({ studentId, onClose, qc }) {
  const { data, isLoading } = useQuery({ queryKey: ['student-fees', studentId], queryFn: () => feesApi.getStudentFees(studentId), enabled: !!studentId })
  const [draft, setDraft] = useState({})
  const save = useMutation({
    mutationFn: (b) => feesApi.updateStatus(b),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['student-fees', studentId] }); qc.invalidateQueries({ queryKey: ['collections'] }) },
  })
  return (
    <Modal open={!!studentId} onClose={onClose} title="Student Fees" size="lg">
      {isLoading ? <Spinner /> : !data?.lines?.length ? (
        <p style={{ color: 'var(--faint)', textAlign: 'center', padding: '24px 0' }}>No fee structure set for this student's section.</p>
      ) : (
        <table className="data-table" style={{ border: '1px solid var(--line)', borderRadius: 8 }}>
          <thead><tr><th>Head</th><th>Amount</th><th>Paid</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data.lines.map(l => {
              const d = draft[l.feeStructureId] || {}
              const paid = d.amountPaid ?? l.amountPaid ?? 0
              const status = d.status ?? l.status
              return (
                <tr key={l.feeStructureId}>
                  <td style={{ fontWeight: 600 }}>{l.feeHeadName}</td>
                  <td>{rupee(l.amount)}</td>
                  <td style={{ width: 120 }}><input type="number" className="input" value={paid} onChange={e => setDraft(p => ({ ...p, [l.feeStructureId]: { ...p[l.feeStructureId], amountPaid: e.target.value } }))} /></td>
                  <td style={{ width: 130 }}>
                    <select className="input" value={status} onChange={e => setDraft(p => ({ ...p, [l.feeStructureId]: { ...p[l.feeStructureId], status: e.target.value } }))}>
                      <option value="PENDING">PENDING</option><option value="PARTIAL">PARTIAL</option><option value="PAID">PAID</option>
                    </select>
                  </td>
                  <td><button className="btn btn-secondary btn-sm" disabled={save.isPending}
                    onClick={() => save.mutate({ studentId, feeStructureId: l.feeStructureId, status, amountPaid: Number(paid) || 0 })}>Save</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </Modal>
  )
}

function CollectionsTab() {
  const qc = useQueryClient()
  const { data: sections = [] } = useQuery({ queryKey: ['fee-sections'], queryFn: feesApi.getSections })
  const [sectionId, setSectionId] = useState('')
  const [target, setTarget] = useState(null)
  const { data: rows = [], isLoading } = useQuery({ queryKey: ['collections', sectionId], queryFn: () => feesApi.getCollections(sectionId), enabled: !!sectionId })

  return (
    <div>
      <div style={{ marginBottom: 16, maxWidth: 360 }}>
        <label className="label">Section</label>
        <select className="input" value={sectionId} onChange={e => setSectionId(e.target.value)}>
          <option value="">— Select a section —</option>
          {sections.map(s => <option key={s.id} value={s.id}>{sectionLabel(s)}</option>)}
        </select>
      </div>
      {!sectionId ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--faint)' }}>Select a section to view fee collection.</div>
      ) : isLoading ? <Spinner /> : rows.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--faint)' }}>No students in this section.</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Student</th><th>Adm. No</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.studentId}>
                  <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                  <td style={{ color: 'var(--muted)' }}>{r.admissionNo || '—'}</td>
                  <td>{rupee(r.totalAmount)}</td>
                  <td style={{ color: 'var(--success)' }}>{rupee(r.totalPaid)}</td>
                  <td style={{ color: r.totalDue > 0 ? 'var(--danger)' : 'var(--muted)' }}>{rupee(r.totalDue)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td style={{ textAlign: 'right' }}><button className="btn btn-secondary btn-sm" onClick={() => setTarget(r.studentId)}>Manage</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {target && <StudentFeeModal studentId={target} onClose={() => setTarget(null)} qc={qc} />}
    </div>
  )
}

export default function FeesPage() {
  const [tab, setTab] = useState('Fee Heads')
  return (
    <div className="page">
      <PageHeader eyebrow="Finance" title="Fees" subtitle="Define fee heads, set per-section structures, and track collections" />
      <div className="table-container" style={{ overflow: 'visible' }}>
        <div style={{ borderBottom: '1px solid var(--line)', display: 'flex', background: 'var(--surface)', borderRadius: '13px 13px 0 0' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '13px 22px', fontSize: 13.5, fontWeight: tab === t ? 600 : 500,
              color: tab === t ? 'var(--accent)' : 'var(--muted)', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', marginBottom: -1, fontFamily: 'inherit',
            }}>{t}</button>
          ))}
        </div>
        <div style={{ padding: 20 }}>
          {tab === 'Fee Heads' && <HeadsTab />}
          {tab === 'Structure' && <StructureTab />}
          {tab === 'Collections' && <CollectionsTab />}
        </div>
      </div>
    </div>
  )
}
