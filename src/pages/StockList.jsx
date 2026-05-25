import React, { useState, useEffect, useMemo } from 'react'
import { RefreshCw, Search, MapPin, Calendar, AlertTriangle, Package, Loader2, LayoutList, Pencil, Trash2, X, Check, Download, Tag } from 'lucide-react'
import { sheetsApi } from '../services/sheetsApi'

const STATUS_FILTERS = [
  { val: 'all',      label: 'Semua'       },
  { val: 'low',      label: 'Stok Rendah' },
  { val: 'expiring', label: 'Segera Exp'  },
  { val: 'expired',  label: 'Kadaluarsa'  },
]

export default function StockList() {
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('all')
  const [katFilter, setKatFilter] = useState('all')
  const [editItem,  setEditItem]  = useState(null)
  const [delItem,   setDelItem]   = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [statusMsg, setStatusMsg] = useState(null)

  const load = () => {
    setLoading(true)
    sheetsApi.getAllStock()
      .then(r => setItems(r.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const today = new Date()
  const soon  = new Date(); soon.setDate(today.getDate() + 30)

  const expStatus = (exp) => {
    if (!exp) return null
    const d = new Date(exp)
    if (d < today) return 'expired'
    if (d <= soon) return 'soon'
    return 'ok'
  }

  const categories = useMemo(() => {
    const cats = [...new Set(items.map(i => i.kategori).filter(Boolean))].sort()
    return cats
  }, [items])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items
      .filter(i => !q || i.nama?.toLowerCase().includes(q) || i.barcode?.includes(q) || i.posisi?.toLowerCase().includes(q) || i.kategori?.toLowerCase().includes(q))
      .filter(i => {
        if (filter === 'low')      return Number(i.qty) <= 3
        if (filter === 'expiring') return i.exp && new Date(i.exp) <= soon && new Date(i.exp) >= today
        if (filter === 'expired')  return i.exp && new Date(i.exp) < today
        return true
      })
      .filter(i => katFilter === 'all' || i.kategori === katFilter)
  }, [items, search, filter, katFilter])

  const accentColor = (item) => {
    if (expStatus(item.exp) === 'expired') return '#94A3B8'
    if (Number(item.qty) <= 3)             return '#DC2626'
    if (expStatus(item.exp) === 'soon')    return '#D97706'
    return '#16A34A'
  }

  // ---- EDIT ----
  const handleEdit = (item) => {
    setEditItem({ ...item, _orig: item.barcode, stokAwal: item.stokAwal ?? '' })
    setStatusMsg(null)
  }

  const handleEditSave = async () => {
    setSaving(true); setStatusMsg(null)
    try {
      await sheetsApi.updateItem({
        barcode:  editItem._orig,
        nama:     editItem.nama,
        exp:      editItem.exp,
        posisi:   editItem.posisi,
        kategori: editItem.kategori,
        stokAwal: editItem.stokAwal !== '' ? Number(editItem.stokAwal) : undefined,
      })
      setStatusMsg({ type: 'success', msg: 'Berhasil disimpan.' })
      setItems(prev => prev.map(i => i.barcode === editItem._orig
        ? { ...i, nama: editItem.nama, exp: editItem.exp, posisi: editItem.posisi, kategori: editItem.kategori, stokAwal: editItem.stokAwal }
        : i))
      setTimeout(() => { setEditItem(null); setStatusMsg(null) }, 800)
    } catch (e) {
      setStatusMsg({ type: 'error', msg: e.message })
    } finally { setSaving(false) }
  }

  // ---- DELETE ----
  const handleDelete = async () => {
    setSaving(true); setStatusMsg(null)
    try {
      await sheetsApi.deleteItem({ barcode: delItem.barcode })
      setItems(prev => prev.filter(i => i.barcode !== delItem.barcode))
      setDelItem(null)
    } catch (e) {
      setStatusMsg({ type: 'error', msg: e.message })
    } finally { setSaving(false) }
  }

  // ---- EXPORT CSV ----
  const exportCSV = () => {
    const rows = [
      ['Barcode', 'Nama', 'Stok', 'Kategori', 'Kadaluarsa', 'Posisi Rak'],
      ...filtered.map(i => [i.barcode, i.nama, i.qty, i.kategori, i.exp, i.posisi]),
    ]
    const csv = rows.map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `stok-gudang-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={s.headerRow}>
          <div style={s.titleRow}>
            <div style={{ ...s.titleIcon, background: '#F5F3FF' }}>
              <LayoutList size={20} color="#7C3AED" />
            </div>
            <h2 style={s.title}>Stok Gudang</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportCSV} style={{ ...s.iconBtn, background: '#F0FDF4', color: '#16A34A' }} title="Export CSV">
              <Download size={16} />
            </button>
            <button onClick={load} style={s.iconBtn} title="Refresh">
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={s.searchWrap}>
        <Search size={16} color="#94A3B8" style={s.searchIcon} />
        <input
          className="input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama, barcode, posisi, kategori..."
          style={{ paddingLeft: 38 }}
        />
      </div>

      {/* Status filter chips */}
      <div style={s.filterRow}>
        {STATUS_FILTERS.map(({ val, label }) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ ...s.chip, ...(filter === val ? s.chipActive : {}) }}>
            {label}
          </button>
        ))}
      </div>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div style={{ ...s.filterRow, marginBottom: 14 }}>
          <Tag size={13} color="#94A3B8" style={{ flexShrink: 0, marginTop: 1 }} />
          <button onClick={() => setKatFilter('all')}
            style={{ ...s.chip, ...(katFilter === 'all' ? s.chipKatActive : {}) }}>
            Semua Kategori
          </button>
          {categories.map(kat => (
            <button key={kat} onClick={() => setKatFilter(kat)}
              style={{ ...s.chip, ...(katFilter === kat ? s.chipKatActive : {}) }}>
              {kat}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      {!loading && (
        <p style={s.countText}>{filtered.length} barang ditemukan</p>
      )}

      {/* Content */}
      {loading ? (
        <div className="empty-state">
          <Loader2 size={36} color="#CBD5E1" className="spin" />
          <p style={{ color: '#94A3B8' }}>Memuat data...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={48} color="#CBD5E1" strokeWidth={1.5} />
          <p>Tidak ada data</p>
          <span>{search ? `Tidak ditemukan untuk "${search}"` : 'Belum ada barang tercatat'}</span>
        </div>
      ) : (
        <div style={s.list}>
          {filtered.map((item, i) => {
            const es = expStatus(item.exp)
            const ac = accentColor(item)
            return (
              <div key={i} className="card" style={{ ...s.item, borderLeftColor: ac }}>
                <div style={s.itemTop}>
                  <span style={s.itemName}>{item.nama}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`badge ${Number(item.qty) <= 3 ? 'badge-danger' : 'badge-success'}`}>
                      {item.qty} pcs
                    </span>
                    <button onClick={() => handleEdit(item)} style={s.actionBtn} title="Edit">
                      <Pencil size={13} color="#2563EB" />
                    </button>
                    <button onClick={() => { setDelItem(item); setStatusMsg(null) }} style={s.actionBtn} title="Hapus">
                      <Trash2 size={13} color="#DC2626" />
                    </button>
                  </div>
                </div>
                <div style={s.itemMeta}>
                  <span style={s.metaCode}>{item.barcode}</span>
                  {item.kategori && (
                    <span style={s.metaKat}><Tag size={10} /> {item.kategori}</span>
                  )}
                  {item.posisi && (
                    <span style={s.metaItem}><MapPin size={11} color="#16A34A" /> {item.posisi}</span>
                  )}
                  {item.exp && (
                    <span style={{ ...s.metaItem, color: es === 'expired' ? '#94A3B8' : es === 'soon' ? '#D97706' : '#64748B' }}>
                      <Calendar size={11} /> {item.exp}
                      {es === 'soon'    && <AlertTriangle size={11} color="#D97706" />}
                      {es === 'expired' && <AlertTriangle size={11} color="#94A3B8" />}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div style={s.overlay} onClick={() => setEditItem(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Edit Barang</h3>
              <button onClick={() => setEditItem(null)} style={s.closeBtn}><X size={18} /></button>
            </div>
            <div style={s.modalBody}>
              <p style={s.modalBarcode}>{editItem.barcode}</p>

              <label className="label">Nama Barang</label>
              <input className="input" value={editItem.nama}
                onChange={e => setEditItem(v => ({ ...v, nama: e.target.value }))} />

              <label className="label" style={{ marginTop: 10 }}>Stok Awal (pcs)</label>
              <input className="input" type="number" min="0" value={editItem.stokAwal ?? ''}
                onChange={e => setEditItem(v => ({ ...v, stokAwal: e.target.value }))}
                placeholder="Stok sebelum pakai aplikasi (0 jika tidak ada)" />
              <p style={s.stokAwalHint}>Stok final = Stok Awal + Total Masuk − Total Keluar</p>

              <label className="label" style={{ marginTop: 10 }}>Kategori</label>
              <input className="input" value={editItem.kategori || ''}
                onChange={e => setEditItem(v => ({ ...v, kategori: e.target.value }))}
                placeholder="cth: Makanan, Obat..." />

              <label className="label" style={{ marginTop: 10 }}>Posisi Rak</label>
              <input className="input" value={editItem.posisi || ''}
                onChange={e => setEditItem(v => ({ ...v, posisi: e.target.value }))} />

              <label className="label" style={{ marginTop: 10 }}>Tgl Kadaluarsa</label>
              <input className="input" type="date" value={editItem.exp || ''}
                onChange={e => setEditItem(v => ({ ...v, exp: e.target.value }))} />

              {statusMsg && (
                <div className={`alert ${statusMsg.type === 'success' ? 'alert-success' : 'alert-danger'} fade-in`} style={{ marginTop: 10 }}>
                  {statusMsg.msg}
                </div>
              )}
            </div>
            <div style={s.modalFooter}>
              <button onClick={() => setEditItem(null)} style={s.btnCancel}>Batal</button>
              <button onClick={handleEditSave} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                <Check size={16} /> {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {delItem && (
        <div style={s.overlay} onClick={() => setDelItem(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={{ ...s.modalTitle, color: '#DC2626' }}>Hapus Barang</h3>
              <button onClick={() => setDelItem(null)} style={s.closeBtn}><X size={18} /></button>
            </div>
            <div style={s.modalBody}>
              <p style={{ color: '#374151', fontSize: 14 }}>
                Hapus <strong>{delItem.nama}</strong> ({delItem.barcode}) dari master stok?
              </p>
              <p style={{ color: '#94A3B8', fontSize: 12, marginTop: 6 }}>
                Riwayat transaksi tidak dihapus.
              </p>
              {statusMsg && (
                <div className="alert alert-danger fade-in" style={{ marginTop: 10 }}>{statusMsg.msg}</div>
              )}
            </div>
            <div style={s.modalFooter}>
              <button onClick={() => setDelItem(null)} style={s.btnCancel}>Batal</button>
              <button onClick={handleDelete} disabled={saving} className="btn btn-danger" style={{ flex: 1 }}>
                <Trash2 size={16} /> {saving ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  headerRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  titleRow:    { display: 'flex', alignItems: 'center', gap: 10 },
  titleIcon:   { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 20, fontWeight: 700, color: '#0F172A' },
  iconBtn:     { width: 36, height: 36, background: '#F5F3FF', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  searchWrap:  { position: 'relative', marginBottom: 10 },
  searchIcon:  { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  filterRow:   { display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto', paddingBottom: 2, alignItems: 'center' },
  chip:        { padding: '5px 13px', borderRadius: 99, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 },
  chipActive:  { background: '#7C3AED', color: '#fff', borderColor: '#7C3AED' },
  chipKatActive:{ background: '#2563EB', color: '#fff', borderColor: '#2563EB' },
  countText:   { fontSize: 12, color: '#94A3B8', marginBottom: 10 },
  list:        { display: 'flex', flexDirection: 'column', gap: 8 },
  item:        { padding: '12px 14px', borderLeft: '4px solid #16A34A' },
  itemTop:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  itemName:    { fontSize: 15, fontWeight: 600, color: '#1E293B', flex: 1, marginRight: 8 },
  itemMeta:    { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  metaCode:    { fontSize: 12, color: '#94A3B8', fontFamily: 'monospace' },
  metaItem:    { fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 3 },
  metaKat:     { fontSize: 11, color: '#2563EB', background: '#EFF6FF', padding: '1px 7px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 3, fontWeight: 500 },
  actionBtn:   { width: 26, height: 26, border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 },
  modal:       { background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' },
  modalHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 12px', borderBottom: '1px solid #E2E8F0' },
  modalTitle:    { fontSize: 17, fontWeight: 700, color: '#0F172A' },
  closeBtn:      { background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 },
  modalBody:     { padding: '16px 20px' },
  modalBarcode:  { fontSize: 12, color: '#94A3B8', fontFamily: 'monospace', marginBottom: 10 },
  stokAwalHint:  { fontSize: 11, color: '#64748B', marginTop: 4 },
  modalFooter:   { display: 'flex', gap: 10, padding: '12px 20px 20px' },
  btnCancel:     { flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
}
