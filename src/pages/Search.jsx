import React, { useState } from 'react'
import { ScanLine, Package, MapPin, Calendar, AlertTriangle, ArrowUpCircle, ArrowDownCircle, SearchX, Loader2, ScanSearch, Layers } from 'lucide-react'
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

  const hasBatches = result?.batches?.length > 1 || result?.batches?.some(b => b.batch)

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
      <div style={s.searchRow}>
        <input
          className="input"
          value={barcode}
          onChange={e => setBarcode(e.target.value)}
          placeholder="Scan atau ketik barcode..."
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          style={{ flex: 1 }}
        />
        <button type="button" onClick={() => setShowScanner(true)} className="btn-icon"
          style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10 }}>
          <ScanLine size={20} />
        </button>
        <button onClick={() => doSearch()} disabled={loading} className="btn btn-primary" style={{ flexShrink: 0 }}>
          {loading ? <Loader2 size={17} className="spin" /> : 'Cari'}
        </button>
      </div>
      </div>

      {/* Kolom kanan: hasil */}
      <div>
      {notFound && (
        <div className="empty-state fade-in">
          <SearchX size={48} color="#CBD5E1" strokeWidth={1.5} />
          <p>Barang tidak ditemukan</p>
          <span>Barcode: <code style={{ fontFamily: 'monospace' }}>{barcode}</code></span>
        </div>
      )}

      {result && (
        <div className="fade-in">
          {/* Header card */}
          <div className="card" style={s.resultCard}>
            <h3 style={s.resultName}>{result.nama}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <code style={s.barcodeCode}>{result.barcode}</code>
              <span className={`badge ${Number(result.qty) <= 3 ? 'badge-danger' : 'badge-success'}`}>
                <Package size={12} /> {result.qty} pcs total
              </span>
              {Number(result.qty) <= 3 && (
                <span className="badge badge-danger"><AlertTriangle size={11} /> Stok rendah</span>
              )}
            </div>

            {/* Multiple batches */}
            {hasBatches ? (
              <div>
                <p style={s.batchTitle}><Layers size={13} /> {result.batches.length} batch tersedia</p>
                <div style={s.batchGrid}>
                  {result.batches.map((b, i) => {
                    const es = expStatus(b.exp)
                    return (
                      <div key={b.batch || i} style={{
                        ...s.batchCard,
                        borderLeftColor: es === 'expired' ? '#94A3B8' : es === 'soon' ? '#D97706' : Number(b.qty) <= 3 ? '#DC2626' : '#16A34A',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={s.batchName}>{b.batch || 'Default'}</span>
                          <span style={{ ...s.batchQty, color: Number(b.qty) <= 3 ? '#DC2626' : '#16A34A' }}>
                            {b.qty} pcs
                          </span>
                        </div>
                        <div style={s.batchMeta}>
                          {b.exp && (
                            <span style={{ color: es === 'expired' ? '#94A3B8' : es === 'soon' ? '#D97706' : '#64748B', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Calendar size={10} /> {b.exp}
                              {es === 'expired' && <AlertTriangle size={10} />}
                              {es === 'soon'    && <AlertTriangle size={10} color="#D97706" />}
                            </span>
                          )}
                          {b.posisi && (
                            <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <MapPin size={10} /> {b.posisi}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              // Single/no batch — original info grid
              <div style={s.infoGrid}>
                <div style={s.infoBlock}>
                  <div style={{ ...s.infoIconBox, background: '#F0FDF4' }}>
                    <MapPin size={16} color="#16A34A" />
                  </div>
                  <div>
                    <p style={s.infoLabel}>Posisi Rak</p>
                    <p style={{ ...s.infoVal, fontSize: 14, color: result.posisi ? '#0F172A' : '#94A3B8' }}>
                      {result.posisi || 'Belum diset'}
                    </p>
                  </div>
                </div>

                {result.exp && (
                  <div style={s.infoBlock}>
                    <div style={{ ...s.infoIconBox, background: expStatus(result.exp) === 'expired' ? '#F1F5F9' : expStatus(result.exp) === 'soon' ? '#FFFBEB' : '#F5F3FF' }}>
                      <Calendar size={16} color={expStatus(result.exp) === 'expired' ? '#94A3B8' : expStatus(result.exp) === 'soon' ? '#D97706' : '#7C3AED'} />
                    </div>
                    <div>
                      <p style={s.infoLabel}>Kadaluarsa</p>
                      <p style={{ ...s.infoVal, fontSize: 14 }}>{result.exp}</p>
                      {expStatus(result.exp) === 'expired' && <span className="badge badge-gray" style={{ marginTop: 4 }}><AlertTriangle size={11} /> Kadaluarsa</span>}
                      {expStatus(result.exp) === 'soon'    && <span className="badge badge-warning" style={{ marginTop: 4 }}><AlertTriangle size={11} /> Segera exp</span>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="card" style={{ marginTop: 12, padding: 16 }}>
              <p style={s.histTitle}>Riwayat Transaksi</p>
              {history.slice(0, 10).map((h, i) => (
                <div key={i} style={{ ...s.histItem, borderBottom: i < Math.min(history.length, 10) - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <div style={{ ...s.histBadge, background: h.tipe === 'MASUK' ? '#F0FDF4' : '#FEF2F2' }}>
                    {h.tipe === 'MASUK'
                      ? <ArrowUpCircle size={18} color="#16A34A" />
                      : <ArrowDownCircle size={18} color="#DC2626" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.histType}>
                      {h.tipe === 'MASUK' ? 'Masuk' : 'Keluar'}{' '}
                      <span style={{ fontWeight: 700, color: h.tipe === 'MASUK' ? '#16A34A' : '#DC2626' }}>+{h.qty}</span>
                      {h.batch && <span style={s.histBatchTag}>{h.batch}</span>}
                    </p>
                    {h.catatan && <p style={s.histNote}>{h.catatan}</p>}
                  </div>
                  <span style={s.histDate}>
                    {h.tanggal ? new Date(h.tanggal).toLocaleDateString('id-ID', { day:'2-digit', month:'short' }) : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
      </div>
    </div>
  )
}

const s = {
  titleRow:    { display: 'flex', alignItems: 'center', gap: 10 },
  titleIcon:   { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 20, fontWeight: 700, color: '#0F172A' },
  searchRow:   { display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' },
  resultCard:  { padding: 18, marginBottom: 4 },
  resultName:  { fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 6 },
  barcodeCode: { fontSize: 12, color: '#64748B', fontFamily: 'monospace', background: '#F1F5F9', padding: '2px 8px', borderRadius: 6 },
  infoGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 },
  infoBlock:   { display: 'flex', gap: 10, alignItems: 'flex-start' },
  infoIconBox: { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoLabel:   { fontSize: 11, color: '#64748B', marginBottom: 3 },
  infoVal:     { fontSize: 17, fontWeight: 700, color: '#0F172A' },
  batchTitle:  { display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 },
  batchGrid:   { display: 'flex', flexDirection: 'column', gap: 6 },
  batchCard:   { padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0', borderLeft: '3px solid #16A34A', background: '#FAFAFA' },
  batchName:   { fontSize: 13, fontWeight: 700, color: '#1E293B' },
  batchQty:    { fontSize: 13, fontWeight: 700 },
  batchMeta:   { display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11 },
  histTitle:   { fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12 },
  histItem:    { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' },
  histBadge:   { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  histType:    { fontSize: 14, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 },
  histBatchTag:{ fontSize: 10, fontWeight: 600, color: '#7C3AED', background: '#F5F3FF', padding: '1px 6px', borderRadius: 99 },
  histNote:    { fontSize: 12, color: '#64748B', marginTop: 1 },
  histDate:    { fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap' },
}
