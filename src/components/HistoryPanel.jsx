import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Loader2, SearchX, RefreshCw } from 'lucide-react'
import { sheetsApi } from '../services/sheetsApi'

const PRESETS = [
  { label: '7H',     days: 7  },
  { label: '14H',    days: 14 },
  { label: '30H',    days: 30 },
  { label: 'Custom', days: 0  },
]

function toDateStr(d) { return d.toISOString().slice(0, 10) }

export default function HistoryPanel({ defaultType = 'all' }) {
  const [rows,        setRows]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [preset,      setPreset]      = useState(7)
  const [customStart, setCustomStart] = useState('')
  const [customEnd,   setCustomEnd]   = useState('')
  const [showCustom,  setShowCustom]  = useState(false)
  const [typeFilter,  setTypeFilter]  = useState(defaultType)
  const [search,      setSearch]      = useState('')

  const load = useCallback((startDate, endDate) => {
    setLoading(true)
    sheetsApi.getHistory('', startDate, endDate)
      .then(d => setRows(d.history || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const end   = new Date()
    const start = new Date(); start.setDate(end.getDate() - 6)
    load(toDateStr(start), toDateStr(end))
  }, [load])

  const handlePreset = (days) => {
    setPreset(days)
    if (days === 0) { setShowCustom(true); return }
    setShowCustom(false)
    const end   = new Date()
    const start = new Date(); start.setDate(end.getDate() - (days - 1))
    setCustomStart(''); setCustomEnd('')
    load(toDateStr(start), toDateStr(end))
  }

  const handleCustomApply = () => {
    if (!customStart || !customEnd) return
    load(customStart, customEnd)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows.filter(r => {
      if (typeFilter === 'MASUK'  && r.tipe !== 'MASUK')  return false
      if (typeFilter === 'KELUAR' && r.tipe !== 'KELUAR') return false
      if (q && !r.nama?.toLowerCase().includes(q) &&
               !r.barcode?.includes(q) &&
               !r.batch?.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, typeFilter, search])

  const masukCount  = rows.filter(r => r.tipe === 'MASUK').length
  const keluarCount = rows.filter(r => r.tipe === 'KELUAR').length

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div>
      {/* Filter */}
      <div style={s.filterBox}>
        <div style={s.presetRow}>
          {PRESETS.map(p => (
            <button key={p.days} onClick={() => handlePreset(p.days)}
              style={{ ...s.presetBtn, ...(preset === p.days ? s.presetActive : {}) }}>
              {p.label}
            </button>
          ))}
          <button onClick={() => handlePreset(preset === 0 ? 7 : preset)}
            style={s.refreshBtn} title="Muat ulang">
            <RefreshCw size={13} />
          </button>
        </div>

        {showCustom && (
          <div style={s.customRow}>
            <input type="date" className="input" style={s.dateInput}
              value={customStart} onChange={e => setCustomStart(e.target.value)} />
            <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>
            <input type="date" className="input" style={s.dateInput}
              value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            <button onClick={handleCustomApply} className="btn btn-primary"
              style={{ padding: '7px 12px', fontSize: 12, borderRadius: 8, whiteSpace: 'nowrap' }}>
              Tampilkan
            </button>
          </div>
        )}

        <div style={s.typeRow}>
          {[
            { v: 'all',    l: `Semua (${rows.length})`   },
            { v: 'MASUK',  l: `Masuk (${masukCount})`    },
            { v: 'KELUAR', l: `Keluar (${keluarCount})`  },
          ].map(({ v, l }) => (
            <button key={v} onClick={() => setTypeFilter(v)}
              style={{ ...s.typeBtn, ...(typeFilter === v ? (v === 'MASUK' ? s.typeMasuk : v === 'KELUAR' ? s.typeKeluar : s.typeAll) : {}) }}>
              {l}
            </button>
          ))}
        </div>

        <input className="input" placeholder="Cari nama, barcode, batch..."
          style={{ fontSize: 13 }}
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* List */}
      {loading ? (
        <div style={s.center}>
          <Loader2 size={20} className="spin" />
          <span style={{ fontSize: 13, color: '#94A3B8', marginLeft: 8 }}>Memuat...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>
          <SearchX size={28} color="#CBD5E1" />
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 8 }}>Tidak ada transaksi</p>
        </div>
      ) : (
        <div style={s.list}>
          {filtered.map((r, i) => (
            <div key={i} style={s.row}>
              <div style={{ ...s.typeIcon, background: r.tipe === 'MASUK' ? '#F0FDF4' : '#FEF2F2' }}>
                {r.tipe === 'MASUK'
                  ? <ArrowDownCircle size={17} color="#16A34A" />
                  : <ArrowUpCircle   size={17} color="#DC2626" />
                }
              </div>
              <div style={s.rowBody}>
                <div style={s.rowTop}>
                  <span style={s.rowName}>{r.nama || r.barcode}</span>
                  <span style={{ ...s.rowQty, color: r.tipe === 'MASUK' ? '#16A34A' : '#DC2626' }}>
                    {r.tipe === 'MASUK' ? '+' : '-'}{r.qty}
                  </span>
                </div>
                <div style={s.rowMeta}>
                  {r.barcode && <span>{r.barcode}</span>}
                  {r.batch   && <><span style={s.dot}>·</span><span>{r.batch}</span></>}
                  {r.catatan && <><span style={s.dot}>·</span><span>{r.catatan}</span></>}
                </div>
                <span style={s.rowDate}>{formatDate(r.tanggal)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const s = {
  filterBox:   { background: '#fff', border: '1px solid #E8EEF6', borderRadius: 14, padding: '14px 14px 12px', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  presetRow:   { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  presetBtn:   { padding: '5px 13px', borderRadius: 99, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#64748B' },
  presetActive:{ background: '#7C3AED', color: '#fff', borderColor: '#7C3AED' },
  refreshBtn:  { marginLeft: 'auto', padding: '5px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center' },
  customRow:   { display: 'flex', alignItems: 'center', gap: 6 },
  dateInput:   { flex: 1, padding: '6px 8px', fontSize: 12 },
  typeRow:     { display: 'flex', gap: 6, flexWrap: 'wrap' },
  typeBtn:     { padding: '5px 12px', borderRadius: 99, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#64748B' },
  typeAll:     { background: '#F1F5F9', borderColor: '#CBD5E1', color: '#1E293B' },
  typeMasuk:   { background: '#F0FDF4', borderColor: '#86EFAC', color: '#16A34A' },
  typeKeluar:  { background: '#FEF2F2', borderColor: '#FCA5A5', color: '#DC2626' },
  center:      { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' },
  empty:       { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' },
  list:        { display: 'flex', flexDirection: 'column', gap: 8 },
  row:         { background: '#fff', border: '1px solid #E8EEF6', borderRadius: 12, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  typeIcon:    { width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowBody:     { flex: 1, minWidth: 0 },
  rowTop:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  rowName:     { fontSize: 13, fontWeight: 700, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '72%' },
  rowQty:      { fontSize: 14, fontWeight: 800, flexShrink: 0 },
  rowMeta:     { fontSize: 11, color: '#94A3B8', display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 2, alignItems: 'center' },
  dot:         { color: '#CBD5E1' },
  rowDate:     { fontSize: 11, color: '#CBD5E1' },
}
