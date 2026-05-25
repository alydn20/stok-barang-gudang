import React, { useState, useEffect, useMemo } from 'react'
import { RefreshCw, Search, MapPin, Calendar, AlertTriangle, Package, Loader2, LayoutList } from 'lucide-react'
import { sheetsApi } from '../services/sheetsApi'

const FILTERS = [
  { val: 'all',      label: 'Semua'       },
  { val: 'low',      label: 'Stok Rendah' },
  { val: 'expiring', label: 'Segera Exp'  },
  { val: 'expired',  label: 'Kadaluarsa'  },
]

export default function StockList() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all')

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items
      .filter(i => !q || i.nama?.toLowerCase().includes(q) || i.barcode?.includes(q) || i.posisi?.toLowerCase().includes(q))
      .filter(i => {
        if (filter === 'low')      return Number(i.qty) <= 3
        if (filter === 'expiring') return i.exp && new Date(i.exp) <= soon && new Date(i.exp) >= today
        if (filter === 'expired')  return i.exp && new Date(i.exp) < today
        return true
      })
  }, [items, search, filter])

  const accentColor = (item) => {
    if (expStatus(item.exp) === 'expired') return '#94A3B8'
    if (Number(item.qty) <= 3)             return '#DC2626'
    if (expStatus(item.exp) === 'soon')    return '#D97706'
    return '#16A34A'
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
          <button onClick={load} style={s.refreshBtn} title="Refresh">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={s.searchWrap}>
        <Search size={16} color="#94A3B8" style={s.searchIcon} />
        <input
          className="input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama, barcode, posisi..."
          style={{ paddingLeft: 38 }}
        />
      </div>

      {/* Filter chips */}
      <div style={s.filterRow}>
        {FILTERS.map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            style={{ ...s.chip, ...(filter === val ? s.chipActive : {}) }}
          >
            {label}
          </button>
        ))}
      </div>

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
                  <span className={`badge ${Number(item.qty) <= 3 ? 'badge-danger' : 'badge-success'}`}>
                    {item.qty} pcs
                  </span>
                </div>
                <div style={s.itemMeta}>
                  <span style={s.metaCode}>{item.barcode}</span>
                  {item.posisi && (
                    <span style={s.metaItem}>
                      <MapPin size={11} color="#16A34A" /> {item.posisi}
                    </span>
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
    </div>
  )
}

const s = {
  headerRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  titleRow:   { display: 'flex', alignItems: 'center', gap: 10 },
  titleIcon:  { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 20, fontWeight: 700, color: '#0F172A' },
  refreshBtn: { width: 36, height: 36, background: '#F5F3FF', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  searchWrap: { position: 'relative', marginBottom: 10 },
  searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  filterRow:  { display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 },
  chip:       { padding: '5px 13px', borderRadius: 99, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: '#64748B', whiteSpace: 'nowrap', flexShrink: 0 },
  chipActive: { background: '#7C3AED', color: '#fff', borderColor: '#7C3AED' },
  list:       { display: 'flex', flexDirection: 'column', gap: 8 },
  item:       { padding: '12px 14px', borderLeft: '4px solid #16A34A' },
  itemTop:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  itemName:   { fontSize: 15, fontWeight: 600, color: '#1E293B', flex: 1, marginRight: 8 },
  itemMeta:   { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  metaCode:   { fontSize: 12, color: '#94A3B8', fontFamily: 'monospace' },
  metaItem:   { fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 3 },
}
