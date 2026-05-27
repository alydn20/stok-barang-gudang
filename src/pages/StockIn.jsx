import React, { useState } from 'react'
import { ScanLine, CheckCircle2, XCircle, PackagePlus, Loader2, Layers } from 'lucide-react'
import Scanner from '../components/Scanner'
import { sheetsApi } from '../services/sheetsApi'

const empty = { barcode: '', nama: '', qty: '', exp: '', posisi: '', catatan: '', kategori: '', stokAwal: '', batch: '' }

export default function StockIn() {
  const [form, setForm] = useState(empty)
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [status, setStatus] = useState(null)
  const [found, setFound] = useState(null) // null=belum cari, true=ada, false=tidak ada
  const [batches, setBatches] = useState([])
  const [batchMode, setBatchMode] = useState('new') // 'existing' | 'new'

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selectExistingBatch = (b) => {
    setForm(f => ({ ...f, batch: b.batch || '', exp: b.exp || '', posisi: b.posisi || '', kategori: b.kategori || '' }))
  }

  const lookupBarcode = async (barcode) => {
    if (!barcode.trim()) return
    setSearching(true); setFound(null); setBatches([])
    try {
      const res = await sheetsApi.searchByBarcode(barcode.trim())
      if (res.found) {
        const batchList = res.batches || []
        setBatches(batchList)
        if (batchList.length > 0) {
          setBatchMode('existing')
          const first = batchList[0]
          setForm(f => ({
            ...f,
            barcode:  barcode.trim(),
            nama:     first.nama     || f.nama,
            batch:    first.batch    || '',
            exp:      first.exp      || '',
            posisi:   first.posisi   || '',
            kategori: first.kategori || '',
          }))
        } else {
          setBatchMode('new')
          setForm(f => ({ ...f, barcode: barcode.trim(), nama: res.nama || f.nama, batch: '' }))
        }
        setFound(true)
      } else {
        setFound(false)
      }
    } catch { setFound(false) }
    finally { setSearching(false) }
  }

  const handleBarcodeScan = async (barcode) => {
    setShowScanner(false)
    setForm(f => ({ ...f, barcode }))
    await lookupBarcode(barcode)
  }

  const handleBarcodeBlur    = () => { if (form.barcode.trim()) lookupBarcode(form.barcode) }
  const handleBarcodeKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); lookupBarcode(form.barcode) } }

  const handleClear = () => { setForm(empty); setFound(null); setBatches([]); setBatchMode('new'); setStatus(null) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.barcode) return setStatus({ type: 'error', msg: 'Barcode wajib diisi.' })
    if (found === true && batchMode === 'existing' && (!form.qty || Number(form.qty) < 1))
      return setStatus({ type: 'error', msg: 'Qty wajib diisi minimal 1.' })
    if (found === true && batchMode === 'new' && !form.batch.trim())
      return setStatus({ type: 'error', msg: 'No. Batch wajib diisi untuk batch baru.' })
    if (found === true && batchMode === 'new' && (!form.stokAwal || Number(form.stokAwal) < 1) && (!form.qty || Number(form.qty) < 1))
      return setStatus({ type: 'error', msg: 'Isi Stok Awal atau Qty Masuk untuk batch baru.' })
    setLoading(true); setStatus(null)
    const isNewBatch = found === false || (found === true && batchMode === 'new')
    try {
      await sheetsApi.stockIn({
        ...form,
        qty:     isNewBatch ? (Number(form.qty) || 0) : Number(form.qty),
        stokAwal: isNewBatch && form.stokAwal !== '' ? Number(form.stokAwal) : undefined,
        tanggal: new Date().toISOString(),
      })
      setStatus({ type: 'success', msg: 'Barang masuk berhasil disimpan.' })
      setForm(empty); setFound(null); setBatches([]); setBatchMode('new')
    } catch (err) {
      setStatus({ type: 'error', msg: err.message })
    } finally { setLoading(false) }
  }

  return (
    <div className="page form-page">
      {showScanner && <Scanner onDetected={handleBarcodeScan} onCancel={() => setShowScanner(false)} />}

      <div className="page-header">
        <div style={s.titleRow}>
          <div style={{ ...s.titleIcon, background: '#F0FDF4' }}>
            <PackagePlus size={20} color="#16A34A" />
          </div>
          <h2 style={s.title}>Barang Masuk</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={s.form}>
        {/* Barcode */}
        <div>
          <label className="label">Barcode <span style={s.required}>*</span></label>
          <div style={s.barcodeRow}>
            <input
              className="input"
              value={form.barcode}
              onChange={e => { set('barcode', e.target.value); setFound(null); setBatches([]) }}
              onBlur={handleBarcodeBlur}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="Scan atau ketik barcode, lalu Enter"
              readOnly={found === true}
              style={found === true ? s.inputLocked : {}}
              required
            />
            {found === null && (
              <button type="button" onClick={() => setShowScanner(true)} className="btn-icon" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10 }}>
                <ScanLine size={20} />
              </button>
            )}
            {found !== null && (
              <button type="button" onClick={handleClear} style={s.clearBtn} title="Ganti barang">
                <XCircle size={18} color="#DC2626" />
              </button>
            )}
          </div>
          {searching && <p style={s.searchNote}><Loader2 size={13} className="spin" /> Mencari data barang...</p>}
          {!searching && found === true  && <p style={s.foundNote}><CheckCircle2 size={13} /> Barang ditemukan</p>}
          {!searching && found === false && <p style={s.notFoundNote}><XCircle size={13} /> Barang baru — isi data di bawah</p>}
        </div>

        {/* Nama */}
        <div>
          <label className="label">Nama Barang <span style={s.required}>*</span></label>
          <input
            className="input"
            value={form.nama}
            onChange={e => set('nama', e.target.value)}
            placeholder="Nama produk"
            readOnly={found === true}
            style={found === true ? s.inputLocked : {}}
            required
          />
        </div>

        {/* Batch selector — hanya muncul jika barang ditemukan */}
        {found === true && (
          <div>
            <label className="label">No. Batch / Lot</label>

            {batches.length > 0 && (
              <div style={s.batchTabs}>
                <button type="button"
                  onClick={() => { setBatchMode('existing'); selectExistingBatch(batches[0]) }}
                  style={{ ...s.batchTab, ...(batchMode === 'existing' ? s.batchTabActive : {}) }}>
                  <Layers size={12} /> Batch Lama ({batches.length})
                </button>
                <button type="button"
                  onClick={() => { setBatchMode('new'); setForm(f => ({ ...f, batch: '', exp: '', posisi: '', kategori: '' })) }}
                  style={{ ...s.batchTab, ...(batchMode === 'new' ? s.batchTabActive : {}) }}>
                  + Batch Baru
                </button>
              </div>
            )}

            {batchMode === 'existing' && batches.length > 0 && (
              <div style={s.batchList}>
                {batches.map(b => (
                  <button type="button" key={b.batch || '__default__'}
                    onClick={() => selectExistingBatch(b)}
                    style={{ ...s.batchCard, ...(form.batch === (b.batch || '') ? s.batchCardActive : {}) }}>
                    <span style={s.batchName}>{b.batch || 'Batch Default'}</span>
                    <div style={s.batchMeta}>
                      <span>{b.qty} pcs</span>
                      {b.exp    && <span>Exp: {b.exp}</span>}
                      {b.posisi && <span>{b.posisi}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {batchMode === 'new' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: batches.length > 0 ? 0 : 4 }}>
                <input className="input" value={form.batch}
                  onChange={e => set('batch', e.target.value)}
                  placeholder="Wajib diisi — cth: NO002, LOT-002, 2025-B" />
                <div>
                  <label className="label">Stok Awal Batch Ini (pcs)</label>
                  <input className="input" type="number" min="0" value={form.stokAwal}
                    onChange={e => set('stokAwal', e.target.value)} placeholder="0" />
                  <p style={s.stokAwalDesc}>Isi jika stok batch ini sudah ada sebelumnya.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stok Awal — hanya untuk barang baru */}
        {found === false && (
          <div style={s.stokAwalBox}>
            <p style={s.stokAwalTitle}>Stok Pembukaan</p>
            <p style={s.stokAwalDesc}>Isi jika barang ini sudah ada sebelum pakai aplikasi. Kosongkan jika mulai dari 0.</p>
            <div>
              <label className="label">Stok Awal (pcs)</label>
              <input className="input" type="number" min="0" value={form.stokAwal}
                onChange={e => set('stokAwal', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="label">No. Batch (opsional)</label>
              <input className="input" value={form.batch}
                onChange={e => set('batch', e.target.value)}
                placeholder="cth: LOT-001 (kosongkan jika tidak pakai)" />
            </div>
          </div>
        )}

        {/* Qty & Exp */}
        <div style={s.row2}>
          {found !== false && (
          <div style={{ flex: 1 }}>
            <label className="label">
              Qty Masuk (pcs){' '}
              {batchMode === 'existing'
                ? <span style={s.required}>*</span>
                : <span style={{ color: '#64748B', fontWeight: 400, fontSize: 11 }}>(opsional)</span>}
            </label>
            <input className="input" type="number"
              min={batchMode === 'existing' ? 1 : 0}
              value={form.qty}
              onChange={e => set('qty', e.target.value)}
              placeholder={batchMode === 'existing' ? '1' : '0'} />
          </div>
          )}
          <div style={{ flex: 1 }}>
            <label className="label">Tgl Kadaluarsa</label>
            <input className="input" type="date" value={form.exp}
              onChange={e => set('exp', e.target.value)} />
          </div>
        </div>

        {/* Posisi */}
        <div>
          <label className="label">Posisi Rak</label>
          <input className="input" value={form.posisi} onChange={e => set('posisi', e.target.value)}
            placeholder="cth: Rak A baris 2, Lemari Kiri" />
        </div>

        {/* Kategori & Catatan */}
        <div style={s.row2}>
          <div style={{ flex: 1 }}>
            <label className="label">Kategori</label>
            <input className="input" value={form.kategori} onChange={e => set('kategori', e.target.value)}
              placeholder="cth: Makanan, Obat..." />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Catatan</label>
            <input className="input" value={form.catatan} onChange={e => set('catatan', e.target.value)}
              placeholder="Opsional" />
          </div>
        </div>

        {status && (
          <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-danger'} fade-in`}>
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {status.msg}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-success btn-full" style={{ marginTop: 4 }}>
          <PackagePlus size={18} />
          {loading ? 'Menyimpan...' : 'Simpan Barang Masuk'}
        </button>
      </form>
    </div>
  )
}

const s = {
  titleRow:      { display: 'flex', alignItems: 'center', gap: 10 },
  titleIcon:     { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title:         { fontSize: 20, fontWeight: 700, color: '#0F172A' },
  form:          { display: 'flex', flexDirection: 'column', gap: 14 },
  barcodeRow:    { display: 'flex', gap: 8, alignItems: 'flex-start' },
  row2:          { display: 'flex', gap: 12 },
  required:      { color: '#DC2626', fontWeight: 700 },
  foundNote:     { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#16A34A', marginTop: 5 },
  notFoundNote:  { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#D97706', marginTop: 5 },
  searchNote:    { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B', marginTop: 5 },
  inputLocked:   { background: '#F1F5F9', color: '#64748B', cursor: 'not-allowed' },
  stokAwalBox:   { background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
  stokAwalTitle: { fontSize: 13, fontWeight: 700, color: '#92400E' },
  stokAwalDesc:  { fontSize: 12, color: '#B45309', lineHeight: 1.4 },
  clearBtn:      { flexShrink: 0, width: 44, height: 44, borderRadius: 10, background: '#FEF2F2', border: '1.5px solid #FECACA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  batchTabs:     { display: 'flex', gap: 6, marginBottom: 8, marginTop: 6 },
  batchTab:      { flex: 1, padding: '7px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 },
  batchTabActive:{ background: '#EFF6FF', borderColor: '#2563EB', color: '#2563EB', fontWeight: 700 },
  batchList:     { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 },
  batchCard:     { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', textAlign: 'left', width: '100%' },
  batchCardActive: { borderColor: '#2563EB', background: '#EFF6FF' },
  batchName:     { fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: 4 },
  batchMeta:     { display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: '#64748B' },
}
