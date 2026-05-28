import React, { useState } from 'react'
import { ScanLine, CheckCircle2, XCircle, PackageMinus, MapPin, Package, Calendar, Loader2, Layers, Zap, ClipboardList } from 'lucide-react'
import Scanner from '../components/Scanner'
import HistoryPanel from '../components/HistoryPanel'
import { sheetsApi } from '../services/sheetsApi'

const LS_STRATEGY = 'stockout_strategy'
const getStrategy = () => localStorage.getItem(LS_STRATEGY) || 'MANUAL'

export default function StockOut() {
  const [form, setForm] = useState({ barcode: '', qty: '', catatan: '' })
  const [itemInfo, setItemInfo] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [status, setStatus] = useState(null)
  const [selectedBatch, setSelectedBatch] = useState(null) // null = auto, string = batch tertentu
  const [tab, setTab] = useState('form')

  const strategy = getStrategy()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const lookupBarcode = async (barcode) => {
    if (!barcode.trim()) return
    setSearching(true); setItemInfo(null); setStatus(null); setSelectedBatch(null)
    try {
      const res = await sheetsApi.searchByBarcode(barcode.trim())
      if (res.found) setItemInfo(res)
      else setStatus({ type: 'error', msg: 'Barang tidak ditemukan di database.' })
    } catch (e) { setStatus({ type: 'error', msg: e.message }) }
    finally { setSearching(false) }
  }

  const handleBarcodeScan = async (barcode) => {
    setShowScanner(false)
    setForm(f => ({ ...f, barcode }))
    await lookupBarcode(barcode)
  }

  const handleBarcodeBlur    = () => { if (form.barcode.trim()) lookupBarcode(form.barcode) }
  const handleBarcodeKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); lookupBarcode(form.barcode) } }

  const availableBatches = (itemInfo?.batches || []).filter(b => Number(b.qty) > 0)
  const hasBatches       = availableBatches.some(b => b.batch)

  // LIFO: batch dengan exp paling jauh (paling baru)
  const lifoBatch = (() => {
    const withExp    = [...availableBatches.filter(b => b.exp)].sort((a, b) => new Date(b.exp) - new Date(a.exp))
    const withoutExp = availableBatches.filter(b => !b.exp)
    return [...withExp, ...withoutExp][0]?.batch ?? null
  })()

  // Batch yang benar-benar dipakai (null = GAS FIFO/FEFO)
  const effectiveBatch = selectedBatch !== null
    ? selectedBatch
    : (strategy === 'LIFO' ? lifoBatch : null)

  const effectiveBatchInfo = effectiveBatch !== null
    ? availableBatches.find(b => b.batch === effectiveBatch)
    : null

  const availableQty = effectiveBatch !== null
    ? (effectiveBatchInfo ? Number(effectiveBatchInfo.qty) : 0)
    : (itemInfo ? Number(itemInfo.qty) : 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (strategy === 'MANUAL' && hasBatches && selectedBatch === null)
      return setStatus({ type: 'error', msg: 'Pilih batch terlebih dahulu.' })
    if (!form.barcode || !form.qty) return setStatus({ type: 'error', msg: 'Barcode dan qty wajib diisi.' })
    if (Number(form.qty) < 1)
      return setStatus({ type: 'error', msg: 'Qty harus minimal 1.' })
    if (Number(form.qty) > availableQty)
      return setStatus({ type: 'error', msg: `Stok tidak cukup. Tersedia: ${availableQty} pcs.` })
    setLoading(true); setStatus(null)
    try {
      const payload = { ...form, tanggal: new Date().toISOString() }
      if (effectiveBatch !== null) payload.batch = effectiveBatch
      await sheetsApi.stockOut(payload)
      setStatus({ type: 'success', msg: 'Barang keluar berhasil disimpan.' })
      setForm({ barcode: '', qty: '', catatan: '' }); setItemInfo(null); setSelectedBatch(null)
    } catch (err) { setStatus({ type: 'error', msg: err.message }) }
    finally { setLoading(false) }
  }

  return (
    <div className="page form-page">
      {showScanner && <Scanner onDetected={handleBarcodeScan} onCancel={() => setShowScanner(false)} />}

      <div className="page-header">
        <div style={s.titleRow}>
          <div style={{ ...s.titleIcon, background: '#FEF2F2' }}>
            <PackageMinus size={20} color="#DC2626" />
          </div>
          <h2 style={s.title}>Barang Keluar</h2>
        </div>
      </div>

      {/* Tab bar */}
      <div style={s.tabBar}>
        <button type="button" onClick={() => setTab('form')}
          style={{ ...s.tabBtn, ...(tab === 'form' ? s.tabActive : {}) }}>
          <PackageMinus size={14} /> Input
        </button>
        <button type="button" onClick={() => setTab('riwayat')}
          style={{ ...s.tabBtn, ...(tab === 'riwayat' ? s.tabActive : {}) }}>
          <ClipboardList size={14} /> Riwayat
        </button>
      </div>

      {tab === 'riwayat' && <HistoryPanel defaultType="KELUAR" />}

      {tab === 'form' && <form onSubmit={handleSubmit} style={s.form}>
        {/* Barcode */}
        <div>
          <label className="label">Barcode <span style={s.req}>*</span></label>
          <div style={s.barcodeRow}>
            <input
              className="input"
              value={form.barcode}
              onChange={e => { set('barcode', e.target.value); setItemInfo(null); setStatus(null); setSelectedBatch(null) }}
              onBlur={handleBarcodeBlur}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="Scan atau ketik barcode, lalu Enter"
              required
            />
            <button type="button" onClick={() => setShowScanner(true)} className="btn-icon"
              style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10 }}>
              <ScanLine size={20} />
            </button>
          </div>
        </div>

        {searching && <p style={s.searchNote}><Loader2 size={13} className="spin" /> Mencari data barang...</p>}

        {/* Info + Batch selector */}
        {itemInfo && (
          <div style={s.infoBox} className="fade-in">
            <p style={s.infoName}>{itemInfo.nama}</p>

            {hasBatches ? (
              <div>
                <p style={s.batchLabel}><Layers size={12} /> Pilih Batch:</p>
                <div style={s.batchList}>
                  {/* Auto FEFO / LIFO */}
                  {strategy !== 'MANUAL' && (
                  <button type="button"
                    onClick={() => setSelectedBatch(null)}
                    style={{ ...s.batchCard, ...(selectedBatch === null ? s.batchCardActive : {}) }}>
                    <div style={s.batchCardRow}>
                      <span style={{ ...s.batchCardTitle, color: selectedBatch === null ? '#1D4ED8' : '#374151', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Zap size={12} /> Auto {strategy === 'LIFO' ? 'LIFO' : 'FEFO'}
                      </span>
                      <span style={s.batchQtyBadge}>{itemInfo.qty} pcs total</span>
                    </div>
                    <p style={s.batchAutoDesc}>
                      {strategy === 'LIFO'
                        ? `Ambil dari batch exp. paling jauh${lifoBatch ? ` — ${lifoBatch}` : ''}`
                        : 'Ambil dari batch exp. paling dekat otomatis'}
                    </p>
                  </button>
                  )}

                  {availableBatches.map(b => (
                    <button type="button" key={b.batch || '__default__'}
                      onClick={() => setSelectedBatch(b.batch)}
                      style={{ ...s.batchCard, ...(selectedBatch === b.batch ? s.batchCardActive : {}) }}>
                      <div style={s.batchCardRow}>
                        <div>
                          <span style={{ fontSize: 10, color: '#94A3B8', display: 'block', marginBottom: 1 }}>No. Batch</span>
                          <span style={{ ...s.batchCardTitle, color: selectedBatch === b.batch ? '#1D4ED8' : '#374151' }}>
                            {b.batch || 'Default'}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 10, color: '#94A3B8', display: 'block', marginBottom: 1 }}>Stok</span>
                          <span style={s.batchQtyBadge}>{b.qty} pcs</span>
                        </div>
                      </div>
                      {(b.exp || b.posisi) && (
                        <div style={s.batchMeta}>
                          {b.exp    && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={10} /> Exp: {b.exp}</span>}
                          {b.posisi && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} /> {b.posisi}</span>}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={s.infoChips}>
                <span className="badge badge-primary"><Package size={12} /> {itemInfo.qty} pcs</span>
                {itemInfo.posisi && <span className="badge badge-success"><MapPin size={12} /> {itemInfo.posisi}</span>}
                {itemInfo.exp    && <span className="badge badge-warning"><Calendar size={12} /> Exp {itemInfo.exp}</span>}
              </div>
            )}
          </div>
        )}

        {/* Qty */}
        <div>
          <label className="label">Qty Keluar (pcs) <span style={s.req}>*</span></label>
          <input className="input" type="number" min="1"
            value={form.qty} onChange={e => set('qty', e.target.value)}
            placeholder="Jumlah yang diambil" required />
          {itemInfo && (
            <p style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
              Tersedia: {availableQty} pcs
              {effectiveBatch !== null && effectiveBatchInfo && ` (batch: ${effectiveBatch || 'default'})`}
            </p>
          )}
        </div>

        {/* Catatan */}
        <div>
          <label className="label">Catatan</label>
          <input className="input" value={form.catatan} onChange={e => set('catatan', e.target.value)}
            placeholder="Opsional" />
        </div>

        {status && (
          <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-danger'} fade-in`}>
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {status.msg}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-danger btn-full" style={{ marginTop: 4 }}>
          <PackageMinus size={18} />
          {loading ? 'Menyimpan...' : 'Simpan Barang Keluar'}
        </button>
      </form>}
    </div>
  )
}

const s = {
  tabBar:        { display: 'flex', gap: 6, marginBottom: 16 },
  tabBtn:        { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#64748B' },
  tabActive:     { background: '#FEF2F2', borderColor: '#FCA5A5', color: '#DC2626' },
  titleRow:      { display: 'flex', alignItems: 'center', gap: 10 },
  titleIcon:     { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title:         { fontSize: 20, fontWeight: 700, color: '#0F172A' },
  form:          { display: 'flex', flexDirection: 'column', gap: 14 },
  barcodeRow:    { display: 'flex', gap: 8 },
  req:           { color: '#DC2626', fontWeight: 700 },
  searchNote:    { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B', marginTop: 4 },
  infoBox:       { background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 10, padding: '12px 14px' },
  infoName:      { fontSize: 15, fontWeight: 700, color: '#1E40AF', marginBottom: 10 },
  infoChips:     { display: 'flex', flexWrap: 'wrap', gap: 6 },
  batchLabel:    { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 },
  batchList:     { display: 'flex', flexDirection: 'column', gap: 6 },
  batchCard:     { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', background: '#fff', cursor: 'pointer', textAlign: 'left', width: '100%' },
  batchCardActive: { borderColor: '#2563EB', background: '#EFF6FF' },
  batchCardRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  batchCardTitle:{ fontSize: 13, fontWeight: 700 },
  batchQtyBadge: { fontSize: 11, fontWeight: 700, color: '#2563EB', background: '#DBEAFE', padding: '2px 8px', borderRadius: 99 },
  batchMeta:     { display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: '#64748B', marginTop: 4, alignItems: 'center' },
  batchAutoDesc: { fontSize: 11, color: '#64748B', marginTop: 2, textAlign: 'left' },
}
