import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { transportApi } from '../../api/transportApi'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import { IconPlus, IconTrash, IconBuilding, IconUsers } from '../../components/ui/Icons'

const TABS = ['Routes', 'Buses', 'Assignments']

function studentName(s) {
  if (!s) return '—'
  return [s.firstName, s.lastName].filter(Boolean).join(' ') || s.name || s.email || `Student #${s.id}`
}

/* ── Routes tab ───────────────────────────────────────────── */
function RoutesTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const { data: routes = [], isLoading } = useQuery({ queryKey: ['transport-routes'], queryFn: transportApi.getRoutes })
  const { register, handleSubmit, reset } = useForm()
  const create = useMutation({
    mutationFn: b => transportApi.createRoute({ ...b, fare: Number(b.fare) || 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transport-routes'] }); setOpen(false); reset() },
  })
  const del = useMutation({
    mutationFn: id => transportApi.deleteRoute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transport-routes'] }),
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}><IconPlus size={14} /> Add Route</button>
      </div>
      {isLoading ? <Spinner /> : routes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--faint)' }}>No routes yet.</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Route</th><th>Description</th><th>Fare</th><th>Buses</th><th></th></tr></thead>
            <tbody>
              {routes.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td style={{ color: 'var(--muted)' }}>{r.description || '—'}</td>
                  <td>{r.fare ? `₹${Number(r.fare).toLocaleString('en-IN')}` : '—'}</td>
                  <td><span className="badge badge-gray">{r.busCount} bus{r.busCount === 1 ? '' : 'es'}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del.mutate(r.id)}><IconTrash size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Route">
        <form onSubmit={handleSubmit(d => create.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="label">Route Name *</label><input className="input" placeholder="e.g. Route A — North City" {...register('name', { required: true })} /></div>
          <div><label className="label">Description</label><input className="input" placeholder="Areas covered" {...register('description')} /></div>
          <div><label className="label">Monthly Fare (₹)</label><input type="number" className="input" placeholder="0" {...register('fare')} /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={create.isPending}>{create.isPending ? 'Adding…' : 'Add Route'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

/* ── Buses tab ────────────────────────────────────────────── */
function BusesTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const { data: buses = [], isLoading } = useQuery({ queryKey: ['transport-buses'], queryFn: transportApi.getBuses })
  const { data: routes = [] } = useQuery({ queryKey: ['transport-routes'], queryFn: transportApi.getRoutes })
  const { register, handleSubmit, reset } = useForm()
  const create = useMutation({
    mutationFn: b => transportApi.createBus({ ...b, routeId: b.routeId ? Number(b.routeId) : null, capacity: b.capacity ? Number(b.capacity) : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transport-buses'] }); setOpen(false); reset() },
  })
  const del = useMutation({
    mutationFn: id => transportApi.deleteBus(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transport-buses'] }),
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}><IconPlus size={14} /> Add Bus</button>
      </div>
      {isLoading ? <Spinner /> : buses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--faint)' }}>No buses yet.</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Bus No.</th><th>Route</th><th>Timing</th><th>Driver</th><th>Conductor</th><th>Seats</th><th></th></tr></thead>
            <tbody>
              {buses.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.busNumber}</td>
                  <td style={{ color: 'var(--muted)' }}>{b.routeName || '—'}</td>
                  <td style={{ fontSize: 12.5 }}>{b.pickupTime || '—'}{b.dropTime ? ` / ${b.dropTime}` : ''}</td>
                  <td><div style={{ fontSize: 13 }}>{b.driverName || '—'}</div>{b.driverPhone && <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{b.driverPhone}</div>}</td>
                  <td><div style={{ fontSize: 13 }}>{b.conductorName || '—'}</div>{b.conductorPhone && <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{b.conductorPhone}</div>}</td>
                  <td><span className="badge badge-gray">{b.assignedCount}{b.capacity ? `/${b.capacity}` : ''}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del.mutate(b.id)}><IconTrash size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Bus" size="lg">
        <form onSubmit={handleSubmit(d => create.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-row">
            <div><label className="label">Bus Number *</label><input className="input" placeholder="e.g. DL-1PC-4521" {...register('busNumber', { required: true })} /></div>
            <div><label className="label">Route</label>
              <select className="input" {...register('routeId')}>
                <option value="">— Select route —</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div><label className="label">Pickup Time</label><input className="input" placeholder="07:30 AM" {...register('pickupTime')} /></div>
            <div><label className="label">Drop Time</label><input className="input" placeholder="03:15 PM" {...register('dropTime')} /></div>
          </div>
          <div className="form-row">
            <div><label className="label">Driver Name</label><input className="input" {...register('driverName')} /></div>
            <div><label className="label">Driver Phone</label><input className="input" placeholder="+91…" {...register('driverPhone')} /></div>
          </div>
          <div className="form-row">
            <div><label className="label">Conductor Name</label><input className="input" {...register('conductorName')} /></div>
            <div><label className="label">Conductor Phone</label><input className="input" placeholder="+91…" {...register('conductorPhone')} /></div>
          </div>
          <div><label className="label">Capacity (seats)</label><input type="number" className="input" placeholder="40" {...register('capacity')} /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={create.isPending}>{create.isPending ? 'Adding…' : 'Add Bus'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

/* ── Assignments tab ──────────────────────────────────────── */
function AssignmentsTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const { data: assignments = [], isLoading } = useQuery({ queryKey: ['transport-assignments'], queryFn: transportApi.getAssignments })
  const { data: buses = [] } = useQuery({ queryKey: ['transport-buses'], queryFn: transportApi.getBuses })
  const { data: students = [] } = useQuery({ queryKey: ['transport-students'], queryFn: transportApi.getStudents })
  const { register, handleSubmit, reset } = useForm()

  const nameById = {}
  students.forEach(s => { nameById[s.id] = studentName(s) })

  const assign = useMutation({
    mutationFn: b => transportApi.assign({ studentId: Number(b.studentId), busId: Number(b.busId), pickupStop: b.pickupStop }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transport-assignments'] }); qc.invalidateQueries({ queryKey: ['transport-buses'] }); setOpen(false); reset() },
  })
  const unassign = useMutation({
    mutationFn: sid => transportApi.unassign(sid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transport-assignments'] }); qc.invalidateQueries({ queryKey: ['transport-buses'] }) },
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}><IconPlus size={14} /> Assign Bus</button>
      </div>
      {isLoading ? <Spinner /> : assignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--faint)' }}>No students assigned to buses yet.</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Student</th><th>Bus No.</th><th>Route</th><th>Pickup Stop</th><th>Timing</th><th></th></tr></thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{nameById[a.studentId] || `Student #${a.studentId}`}</td>
                  <td>{a.busNumber || '—'}</td>
                  <td style={{ color: 'var(--muted)' }}>{a.routeName || '—'}</td>
                  <td>{a.pickupStop || '—'}</td>
                  <td style={{ fontSize: 12.5 }}>{a.pickupTime || '—'}{a.dropTime ? ` / ${a.dropTime}` : ''}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => unassign.mutate(a.studentId)}><IconTrash size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Assign Bus to Student">
        <form onSubmit={handleSubmit(d => assign.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="label">Student *</label>
            <select className="input" {...register('studentId', { required: true })}>
              <option value="">— Select student —</option>
              {students.map(s => <option key={s.id} value={s.id}>{studentName(s)}{s.admissionNo ? ` (${s.admissionNo})` : ''}</option>)}
            </select>
          </div>
          <div><label className="label">Bus *</label>
            <select className="input" {...register('busId', { required: true })}>
              <option value="">— Select bus —</option>
              {buses.map(b => <option key={b.id} value={b.id}>{b.busNumber}{b.routeName ? ` · ${b.routeName}` : ''}</option>)}
            </select>
          </div>
          <div><label className="label">Pickup Stop</label><input className="input" placeholder="e.g. Sector 12 Main Gate" {...register('pickupStop')} /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={assign.isPending}>{assign.isPending ? 'Assigning…' : 'Assign'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default function TransportPage() {
  const [tab, setTab] = useState('Routes')
  const ICONS = { Routes: IconBuilding, Buses: IconBuilding, Assignments: IconUsers }
  return (
    <div className="page">
      <PageHeader eyebrow="Operations" title="Transport" subtitle="Manage bus routes, vehicles, drivers, and student assignments" />

      <div className="table-container" style={{ marginBottom: 0, overflow: 'visible' }}>
        <div style={{ borderBottom: '1px solid var(--line)', display: 'flex', background: 'var(--surface)', borderRadius: '13px 13px 0 0' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '13px 22px', fontSize: 13.5, fontWeight: tab === t ? 600 : 500,
              color: tab === t ? 'var(--accent)' : 'var(--muted)', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer', marginBottom: -1, fontFamily: 'inherit',
            }}>{t}</button>
          ))}
        </div>
        <div style={{ padding: '20px' }}>
          {tab === 'Routes' && <RoutesTab />}
          {tab === 'Buses' && <BusesTab />}
          {tab === 'Assignments' && <AssignmentsTab />}
        </div>
      </div>
    </div>
  )
}
