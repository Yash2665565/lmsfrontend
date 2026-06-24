import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { inventoryApi } from '../../api/inventoryApi'
import PageHeader from '../../components/ui/PageHeader'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import { IconPlus, IconTrash, IconEdit } from '../../components/ui/Icons'

const TABS = ['Items', 'Categories']

/* ── Items ── */
function ItemModal({ open, onClose, item, categories }) {
  const qc = useQueryClient()
  const editing = !!item
  const { register, handleSubmit, reset } = useForm({ values: item || { unit: 'pcs' } })
  const save = useMutation({
    mutationFn: b => {
      const body = { ...b, categoryId: b.categoryId ? Number(b.categoryId) : null, quantity: Number(b.quantity) || 0, reorderLevel: Number(b.reorderLevel) || 0 }
      return editing ? inventoryApi.updateItem(item.id, body) : inventoryApi.createItem(body)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv-items'] }); onClose(); reset() },
  })
  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Item' : 'Add Item'} size="lg">
      <form onSubmit={handleSubmit(d => save.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label className="label">Item Name *</label><input className="input" {...register('name', { required: true })} /></div>
        <div className="form-row">
          <div><label className="label">Category</label>
            <select className="input" {...register('categoryId')}>
              <option value="">— None —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">SKU / Code</label><input className="input" {...register('sku')} /></div>
        </div>
        <div className="form-row">
          <div><label className="label">Unit</label><input className="input" placeholder="pcs / box / set" {...register('unit')} /></div>
          {!editing && <div><label className="label">Opening Qty</label><input type="number" className="input" placeholder="0" {...register('quantity')} /></div>}
        </div>
        <div className="form-row">
          <div><label className="label">Reorder Level</label><input type="number" className="input" placeholder="0" {...register('reorderLevel')} /></div>
          <div><label className="label">Location</label><input className="input" placeholder="Store room A" {...register('location')} /></div>
        </div>
        <div><label className="label">Notes</label><textarea className="input" rows={2} {...register('notes')} /></div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : (editing ? 'Save' : 'Add Item')}</button></div>
      </form>
    </Modal>
  )
}

function AdjustModal({ open, onClose, item }) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset } = useForm({ values: { type: 'IN', quantity: 1 } })
  const adjust = useMutation({
    mutationFn: b => inventoryApi.adjust(item.id, { type: b.type, quantity: Number(b.quantity) || 0, note: b.note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv-items'] }); onClose(); reset() },
  })
  if (!item) return null
  return (
    <Modal open={open} onClose={onClose} title={`Adjust Stock — ${item.name}`}>
      <form onSubmit={handleSubmit(d => adjust.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Current stock: <strong style={{ color: 'var(--ink)' }}>{item.quantity} {item.unit}</strong></p>
        <div className="form-row">
          <div><label className="label">Action</label>
            <select className="input" {...register('type')}>
              <option value="IN">Stock In (add)</option>
              <option value="OUT">Stock Out (issue)</option>
              <option value="SET">Set exact quantity</option>
            </select>
          </div>
          <div><label className="label">Quantity</label><input type="number" className="input" {...register('quantity')} /></div>
        </div>
        <div><label className="label">Note</label><input className="input" placeholder="Reason / reference" {...register('note')} /></div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary" disabled={adjust.isPending}>{adjust.isPending ? 'Applying…' : 'Apply'}</button></div>
      </form>
    </Modal>
  )
}

function ItemsTab() {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [adjustItem, setAdjustItem] = useState(null)
  const { data: items = [], isLoading } = useQuery({ queryKey: ['inv-items'], queryFn: inventoryApi.getItems })
  const { data: categories = [] } = useQuery({ queryKey: ['inv-categories'], queryFn: inventoryApi.getCategories })
  const del = useMutation({ mutationFn: inventoryApi.deleteItem, onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-items'] }) })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}><IconPlus size={14} /> Add Item</button>
      </div>
      {isLoading ? <Spinner /> : items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--faint)' }}>No items yet.</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Item</th><th>Category</th><th>SKU</th><th>Qty</th><th>Location</th><th></th></tr></thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 600 }}>{i.name}{i.lowStock && <span className="badge badge-red" style={{ marginLeft: 8 }}>Low</span>}</td>
                  <td style={{ color: 'var(--muted)' }}>{i.categoryName || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>{i.sku || '—'}</td>
                  <td><strong>{i.quantity}</strong> <span style={{ color: 'var(--faint)', fontSize: 12 }}>{i.unit}</span></td>
                  <td style={{ color: 'var(--muted)' }}>{i.location || '—'}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setAdjustItem(i)}>Adjust</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditItem(i)}><IconEdit size={13} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del.mutate(i.id)}><IconTrash size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ItemModal open={addOpen} onClose={() => setAddOpen(false)} item={null} categories={categories} />
      {editItem && <ItemModal open={!!editItem} onClose={() => setEditItem(null)} item={editItem} categories={categories} />}
      <AdjustModal open={!!adjustItem} onClose={() => setAdjustItem(null)} item={adjustItem} />
    </div>
  )
}

/* ── Categories ── */
function CategoriesTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const { data: cats = [], isLoading } = useQuery({ queryKey: ['inv-categories'], queryFn: inventoryApi.getCategories })
  const { register, handleSubmit, reset } = useForm()
  const create = useMutation({ mutationFn: inventoryApi.createCategory, onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv-categories'] }); setOpen(false); reset() } })
  const del = useMutation({ mutationFn: inventoryApi.deleteCategory, onSuccess: () => qc.invalidateQueries({ queryKey: ['inv-categories'] }) })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}><IconPlus size={14} /> Add Category</button>
      </div>
      {isLoading ? <Spinner /> : cats.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--faint)' }}>No categories yet.</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Category</th><th>Items</th><th></th></tr></thead>
            <tbody>
              {cats.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td><span className="badge badge-gray">{c.itemCount}</span></td>
                  <td style={{ textAlign: 'right' }}><button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del.mutate(c.id)}><IconTrash size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Category">
        <form onSubmit={handleSubmit(d => create.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="label">Category Name *</label><input className="input" placeholder="e.g. Stationery, Lab, Sports" {...register('name', { required: true })} /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary" disabled={create.isPending}>{create.isPending ? 'Adding…' : 'Add'}</button></div>
        </form>
      </Modal>
    </div>
  )
}

export default function InventoryPage() {
  const [tab, setTab] = useState('Items')
  return (
    <div className="page">
      <PageHeader eyebrow="Operations" title="Inventory" subtitle="Track stock, categories, and stock movements" />
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
          {tab === 'Items' && <ItemsTab />}
          {tab === 'Categories' && <CategoriesTab />}
        </div>
      </div>
    </div>
  )
}
