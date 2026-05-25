import React, { useState } from 'react'
import { ScanLine, Package, MapPin, Calendar, AlertTriangle, ArrowUpCircle, ArrowDownCircle, SearchX, Loader2, ScanSearch } from 'lucide-react'
import Scanner from '../components/Scanner'
import { sheetsApi } from '../services/sheetsApi'

export default function Search() {
  const [barcode, setBarcode] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const doSearch = async (bc) => {
    const code = (bc || barcode).trim()
    if (!code) return
    setLoading(true); setResult(null); setNotFound(false); setHistory([])
    try {
      const [res, hist] = await Promise.all([
        sheetsApi.searchByBarcode(code),
        sheetsApi.getHistory(code),
      ])
      if (res.found) { setResult(res); setHistory(hist.history || []) }
      else setNotFound(true)
    } catch { setNotFound(true) }
    finally { setLoading(false) }
  }

  const handleBarcodeScan = (bc) => { setShowScanner(false); setBarcode(bc); doSearch(bc) }

  const today = new Date()
  const soon  = new Date(); soon.setDate(today.getDate() + 30)
  const expStatus = (exp) => {
    if (!exp) return null
    const d = new Date(exp)
    if (d < today)  return 'expired'
    if (d <= soon)  return 'soon'
    return 'ok'
  }

  return (
    <div className="page">
      {showScanner && <Scanner onDetected={handleBarcodeScan} onCancel={() => setShowScanner(false)} />}

      <div className="page-header">
        <div style={s.titleRow}>
          <div style={{ ...s.titleIcon, background: '#EFF6FF' }}>
            <ScanSearch size={20} color="#2563EB" />
          </div>
          <h2 style={s.title}>Cari Barang</h2>
        </div>
      </div>

      <div className="search-layout">
      {/* Kolom kiri: search input */}
      <div>
      {/* Search bar */}
      <div style={s.searchRow}>
        <input
          className="input"
          value={barcode}
          onChange={e => setBarcode(e.target.value)}
          placeholder="Scan atau ketik barcode..."
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          style={{ flex: 1 }}
        />
        <button type="button" onClick={() => setShowScanner(true)} className="btn-icon" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10 }}>
          <ScanLine size={20} />
        </button>
        <button onClick={() => doSearch()} disabled={loading} className="btn btn-primary" style={{ flexShrink: 0 }}>
          {loading ? <Loader2 size={17} className="spin" /> : 'Cari'}
        </button>
      </div>
      </div>{/* end kolom kiri */}

      {/* Kolom kanan: hasil */}
      <div>
      {/* Not found */}
      {notFound && (
        <div className="empty-state fade-in">
          <SearchX size={48} color="#CBD5E1" strokeWidth={1.5} />
          <p>Barang tidak ditemukan</p>
          <span>Barcode: <code style={{ fontFamily: 'monospace' }}>{barcode}</code></span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="card fade-in" style={s.resultCard}>
          <div style={s.resultHeader}>
            <div>
              <h3 style={s.resultName}>{result.nama}</h3>
              <code style={s.barcodeCode}>{result.barcode}</code>
            </div>
          </div>

          <div style={s.infoGrid}>
            {/* Stok */}
            <div style={s.infoBlock}>
              <div style={{ ...s.infoIconBox, background: '#EFF6FF' }}>
                <Package size={16} color="#2563EB" />
              </div>
              <div>
                <p style={s.infoLabel}>Stok Tersedia</p>
                <p style={{ ...s.infoVal, color: Number(result.qty) <= 3 ? '#DC2626' : '#16A34A' }}>
                  {result.qty} pcs
                </p>
                {Number(result.qty) <= 3 && (
                  <span className="badge badge-danger" style={{ marginTop: 4 }}>
                    <AlertTriangle size={11} /> Stok rendah
                  </span>
                )}
              </div>
            </div>

            {/* Posisi */}
            <div style={s.infoBlock}>
              <div style={{ ...s.infoIconBox, background: '#F0FDF4' }}>
                <MapPin size={16} color="#16A34A" />
              </div>
              <div>
                <p style={s.infoLabel}>Posisi Rak</p>
                <p style={{ ...s.infoVal, color: result.posisi ? '#0F172A' : '#94A3B8' }}>
                  {result.posisi || 'Belum diset'}
                </p>
              </div>
            </div>

            {/* Exp */}
            {result.exp && (
              <div style={{ ...s.infoBlock, gridColumn: '1 / -1' }}>
                <div style={{ ...s.infoIconBox, background: expStatus(result.exp) === 'expired' ? '#F1F5F9' : expStatus(result.exp) === 'soon' ? '#FFFBEB' : '#F5F3FF' }}>
                  <Calendar size={16} color={expStatus(result.exp) === 'expired' ? '#94A3B8' : expStatus(result.exp) === 'soon' ? '#D97706' : '#7C3AED'} />
                </div>
                <div>
                  <p style={s.infoLabel}>Kadaluarsa</p>
                  <p style={s.infoVal}>{result.exp}</p>
                  {expStatus(result.exp) === 'expired' && <span className="badge badge-gray" style={{ marginTop: 4 }}><AlertTriangle size={11} /> Sudah kadaluarsa</span>}
                  {expStatus(result.exp) === 'soon'    && <span className="badge badge-warning" style={{ marginTop: 4 }}><AlertTriangle size={11} /> Segera kadaluarsa</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="card" style={{ marginTop: 12, padding: 16 }}>
          <p style={s.histTitle}>Riwayat Transaksi</p>
          {history.slice(0, 10).map((h, i) => (
            <div key={i} style={{ ...s.histItem, borderBottom: i < history.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
              <div style={{ ...s.histBadge, background: h.tipe === 'MASUK' ? '#F0FDF4' : '#FEF2F2' }}>
                {h.tipe === 'MASUK'
                  ? <ArrowUpCircle size={18} color="#16A34A" />
                  : <ArrowDownCircle size={18} color="#DC2626" />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={s.histType}>{h.tipe === 'MASUK' ? 'Masuk' : 'Keluar'} <span style={{ fontWeight: 700, color: h.tipe === 'MASUK' ? '#16A34A' : '#DC2626' }}>+{h.qty}</span></p>
                {h.catatan && <p style={s.histNote}>{h.catatan}</p>}
              </div>
              <span style={s.histDate}>{h.tanggal ? new Date(h.tanggal).toLocaleDateString('id-ID', { day:'2-digit', month:'short' }) : '—'}</span>
            </div>
          ))}
        </div>
      )}
      </div>{/* end kolom kanan */}
      </div>{/* end search-layout */}
    </div>
  )
}

const s = {
  titleRow:    { display: 'flex', alignItems: 'center', gap: 10 },
  titleIcon:   { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 20, fontWeight: 700, color: '#0F172A' },
  searchRow:   { display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' },
  resultCard:  { padding: 18, marginBottom: 4 },
  resultHeader:{ marginBottom: 16 },
  resultName:  { fontSize: 18, fontWeight: 800, color: '#0F172A' },
  barcodeCode: { fontSize: 12, color: '#64748B', fontFamily: 'monospace', background: '#F1F5F9', padding: '2px 8px', borderRadius: 6 },
  infoGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  infoBlock:   { display: 'flex', gap: 10, alignItems: 'flex-start' },
  infoIconBox: { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoLabel:   { fontSize: 11, color: '#64748B', marginBottom: 3 },
  infoVal:     { fontSize: 17, fontWeight: 700, color: '#0F172A' },
  histTitle:   { fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12 },
  histItem:    { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' },
  histBadge:   { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  histType:    { fontSize: 14, color: '#1E293B' },
  histNote:    { fontSize: 12, color: '#64748B', marginTop: 1 },
  histDate:    { fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap' },
}
