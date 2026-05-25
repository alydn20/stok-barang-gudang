import React, { useState, useEffect, useMemo } from 'react'
import { Search, RefreshCw, AlertTriangle } from 'lucide-react'
import { sheetsApi } from '../services/sheetsApi'

export default function StockList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | low | expiring | expired

  const load = () => {
    setLoading(true)
    sheetsApi.getAllStock()
      .then(res => setItems(res.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const today = new Date()
  const soon = new Date(); soon.setDate(today.getDate() + 30)

  const filtered = useMemo(() => {
    let list = items
    if (search) list = list.filter(i => i.nama?.toLowerCase().includes(search.toLowerCase()) || i.barcode?.includes(search) || i.posisi?.toLowerCase().includes(search.toLowerCase()))
    if (filter === 'low') list = list.filter(i => Number(i.qty) <= 3)
    if (filter === 'expiring') list = list.filter(i => i.exp && new Date(i.exp) <= soon && new Date(i.exp) >= today)
    if (filter === 'expired') list = list.filter(i => i.exp && new Date(i.exp) < today)
    return list
  }, [items, search, filter])

  const getExpStatus = (exp) => {
    if (!exp) return null
    const d = new Date(exp)
    if (d < today) return 'expired'
    if (d <= soon) return 'soon'
    return 'ok'
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Stok Gudang</h2>
        <button onClick={load} style={styles.btnRefresh}><RefreshCw size={18} /></button>
      </div>

      <input style={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, barcode, posisi..." />

      <div style={styles.filters}>
        {[['all', 'Semua'], ['low', 'Stok Sedikit'], ['expiring', 'Segera Exp'], ['expired', 'Kadaluarsa']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{ ...styles.filterBtn, ...(filter === val ? styles.filterActive : {}) }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={styles.center}><RefreshCw size={32} color="#1976d2" style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={styles.center}><p style={{ color: '#888' }}>Tidak ada data</p></div>
      ) : (
        <div style={styles.list}>
          {filtered.map((item, i) => {
            const expStatus = getExpStatus(item.exp)
            return (
              <div key={i} style={{ ...styles.item, borderLeft: `4px solid ${Number(item.qty) <= 3 ? '#e53935' : expStatus === 'expired' ? '#9e9e9e' : expStatus === 'soon' ? '#ff9800' : '#43a047'}` }}>
                <div style={styles.itemTop}>
                  <span style={styles.itemName}>{item.nama}</span>
                  <span style={{ ...styles.qtyBadge, background: Number(item.qty) <= 3 ? '#ffebee' : '#e8f5e9', color: Number(item.qty) <= 3 ? '#c62828' : '#2e7d32' }}>
                    {item.qty} pcs
                  </span>
                </div>
                <div style={styles.itemMeta}>
                  <span style={styles.metaItem}>{item.barcode}</span>
                  {item.posisi && <span style={{ ...styles.metaItem, color: '#43a047' }}>📍 {item.posisi}</span>}
                  {item.exp && (
                    <span style={{ ...styles.metaItem, color: expStatus === 'expired' ? '#9e9e9e' : expStatus === 'soon' ? '#e65100' : '#666' }}>
                      {expStatus === 'expired' && '⚠️ '}Exp: {item.exp}
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

const styles = {
  page: { padding: '24px 16px 100px', maxWidth: 480, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 700, color: '#7b1fa2' },
  btnRefresh: { padding: '8px', background: '#f3e5f5', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#7b1fa2', display: 'flex' },
  searchInput: { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 10, fontSize: 15, outline: 'none', marginBottom: 12 },
  filters: { display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  filterBtn: { padding: '5px 12px', borderRadius: 20, border: '1px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#666' },
  filterActive: { background: '#7b1fa2', color: '#fff', borderColor: '#7b1fa2' },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  item: { background: '#fff', borderRadius: 10, padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  itemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  itemName: { fontSize: 15, fontWeight: 700, flex: 1, marginRight: 8 },
  qtyBadge: { padding: '3px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' },
  itemMeta: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  metaItem: { fontSize: 12, color: '#888', fontFamily: 'monospace' },
  center: { display: 'flex', justifyContent: 'center', padding: '60px 0' },
}
