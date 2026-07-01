import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { diaryApi } from '../../api/diaryApi'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import { IconPlus, IconTrash, IconClipboard } from '../../components/ui/Icons'
import DiaryResponsesView from './DiaryResponsesView'

const TABS = ['Give Work', 'Homework Status']

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
const allocKey = (a) => `${a.sectionId}:${a.topicId}`
const sectionsFromAllocations = (allocs) => {
  const m = new Map()
  allocs.forEach(a => { if (!m.has(a.sectionId)) m.set(a.sectionId, { sectionId: a.sectionId, label: a.sectionLabel }) })
  return [...m.values()]
}

export default function TeacherDiaryPage() {
  const qc = useQueryClient()
  const [selKey, setSelKey] = useState('')
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('Give Work')

  // (section + subject) pairs this teacher is allocated to
  const { data: allocations = [], isLoading: allocLoading } = useQuery({ queryKey: ['diary-my-allocations'], queryFn: diaryApi.getMyAllocations })

  useEffect(() => { if (!selKey && allocations.length) setSelKey(allocKey(allocations[0])) }, [allocations, selKey])
  const current = allocations.find(a => allocKey(a) === selKey)
  const sectionId = current?.sectionId

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['diary-section', String(sectionId)], queryFn: () => diaryApi.getSectionDiary(sectionId), enabled: !!sectionId,
  })
  const { register, handleSubmit, reset } = useForm()
  const create = useMutation({
    mutationFn: b => diaryApi.createEntry({ ...b, sectionId: Number(current.sectionId), subjectId: Number(current.topicId) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['diary-section', String(sectionId)] }); setOpen(false); reset() },
  })
  const del = useMutation({ mutationFn: diaryApi.deleteEntry, onSuccess: () => qc.invalidateQueries({ queryKey: ['diary-section', String(sectionId)] }) })

  if (allocLoading) return <div className="page"><Spinner /></div>

  return (
    <div className="page" style={{ maxWidth: 920 }}>
      <PageHeader eyebrow="Diary" title="Class Diary" subtitle="Post the day's work for the classes & subjects you teach, and track who's done it" />

      {allocations.length > 0 && (
        <div style={{ borderBottom: '1px solid var(--line)', display: 'flex', gap: 4, marginBottom: 18 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 18px', fontSize: 13.5, fontWeight: tab === t ? 600 : 500,
              color: tab === t ? 'var(--accent)' : 'var(--muted)', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', marginBottom: -1, fontFamily: 'inherit',
            }}>{t}</button>
          ))}
        </div>
      )}

      {allocations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '44px 24px' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--canvas-sunk)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'var(--faint)' }}><IconClipboard size={21} /></div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>No classes allocated to you</p>
          <p style={{ fontSize: 13, color: 'var(--faint)', marginTop: 4 }}>Ask the admin to allocate you a subject in a section (Academics → Subject Teachers).</p>
        </div>
      ) : tab === 'Homework Status' ? (
        <DiaryResponsesView sections={sectionsFromAllocations(allocations)} />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 280 }}>
              <label className="label">Class &amp; Subject (your allocations)</label>
              <select className="input" value={selKey} onChange={e => setSelKey(e.target.value)}>
                {allocations.map(a => <option key={allocKey(a)} value={allocKey(a)}>{a.sectionLabel} · {a.subjectName}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={() => setOpen(true)}><IconPlus size={14} /> Give Work</button>
          </div>

          {isLoading ? <Spinner /> : entries.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--faint)' }}>No work given to this class yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {entries.map(e => (
                <div key={e.id} className="card" style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{e.title}</p>
                        {e.subjectName && <span className="badge badge-green">{e.subjectName}</span>}
                      </div>
                      {e.description && <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '6px 0 0', lineHeight: 1.55 }}>{e.description}</p>}
                      <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 12, color: 'var(--faint)', flexWrap: 'wrap' }}>
                        {e.teacherName && <span>By {e.teacherName}</span>}
                        <span>Given {fmtDate(e.createdAt)}</span>
                        {e.dueDate && <span>Due {fmtDate(e.dueDate)}</span>}
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del.mutate(e.id)}><IconTrash size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={current ? `Give Work — ${current.sectionLabel} · ${current.subjectName}` : 'Give Work'}>
        <form onSubmit={handleSubmit(d => create.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="label">Title *</label><input className="input" placeholder="e.g. Homework — Exercise 3" {...register('title', { required: true })} /></div>
          <div><label className="label">Work / Details</label><textarea className="input" rows={3} placeholder="Describe the homework or classwork…" {...register('description')} /></div>
          <div><label className="label">Due Date (optional)</label><input type="date" className="input" {...register('dueDate')} /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary" disabled={create.isPending}>{create.isPending ? 'Posting…' : 'Post Work'}</button></div>
        </form>
      </Modal>
    </div>
  )
}
