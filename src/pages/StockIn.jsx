import React, { useState } from 'react'
import { ScanLine, CheckCircle2, XCircle, PackagePlus, Loader2 } from 'lucide-react'
import Scanner from '../components/Scanner'
import { sheetsApi } from '../services/sheetsApi'

const empty = { barcode: '', nama: '', qty: '', exp: '', posisi: '', catatan: '', kategori: '' }

export default function StockIn() {
  const [form, setForm] = useState(empty)
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [status, setStatus] = useState(null)
  const [found, setFound] = useState(null) // null=belum cari, true=ada, false=tidak ada

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const lookupBarcode = async (barcode) => {
    if (!barcode.trim()) return
    setSearching(true); setFound(null)
    try {
      const res = await sheetsApi.searchByBarcode(barcode.trim())
      if (res.found) {
        setForm(f => ({
          ...f,
          barcode: barcode.trim(),
          nama:     res.nama     || f.nama,
          posisi:   res.posisi   || f.posisi,
          kategori: res.kategori || f.kategori,
          exp:      res.exp      || f.exp,
        }))
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

  const handleBarcodeBlur = () => {
    if (form.barcode.trim()) lookupBarcode(form.barcode)
  }

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); lookupBarcode(form.barcode) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.barcode || !form.qty) return setStatus({ type: 'error', msg: 'Barcode dan qty wajib diisi.' })
    setLoading(true); setStatus(null)
    try {
      await sheetsApi.stockIn({ ...form, tanggal: new Date().toISOString() })
      setStatus({ type: 'success', msg: 'Barang masuk berhasil disimpan.' })
      setForm(empty); setFound(false)
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally { setLoading(false) }
  }

  return (
    <div className="page form-page">
      {showScanner && <Scanner onDetected={handleBarcodeScan} onCancel={() => setShowScanner(false)} />}

      {/* Page Header */}
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
              onChange={e => { set('barcode', e.target.value); setFound(null) }}
              onBlur={handleBarcodeBlur}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="Scan atau ketik barcode, lalu Enter"
              readOnly={found === true}
              style={found === true ? s.inputLocked : {}}
              required
            />
            {found !== true && (
              <button type="button" onClick={() => setShowScanner(true)} className="btn-icon" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10 }}>
                <ScanLine size={20} />
              </button>
            )}
            {found === true && (
              <button type="button" onClick={() => { setForm(empty); setFound(null) }} style={s.clearBtn} title="Ganti barang">
                <XCircle size={18} color="#DC2626" />
              </button>
            )}
          </div>
          {searching && (
            <p style={s.searchNote}><Loader2 size={13} className="spin" /> Mencari data barang...</p>
          )}
          {!searching && found === true && (
            <p style={s.foundNote}><CheckCircle2 size={13} /> Barang ditemukan — kode & nama tidak bisa diubah</p>
          )}
          {!searching && found === false && (
            <p style={s.notFoundNote}><XCircle size={13} /> Barang baru — isi data di bawah</p>
          )}
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

        {/* Qty & Exp */}
        <div style={s.row2}>
          <div style={{ flex: 1 }}>
            <label className="label">Qty (pcs) <span style={s.required}>*</span></label>
            <input className="input" type="number" min="1" value={form.qty} onChange={e => set('qty', e.target.value)} placeholder="0" required />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Tgl Kadaluarsa</label>
            <input className="input" type="date" value={form.exp} onChange={e => set('exp', e.target.value)} />
          </div>
        </div>

        {/* Posisi */}
        <div>
          <label className="label">Posisi Rak</label>
          <input className="input" value={form.posisi} onChange={e => set('posisi', e.target.value)} placeholder="cth: Rak A baris 2, Lemari Kiri" />
        </div>

        {/* Kategori & Catatan */}
        <div style={s.row2}>
          <div style={{ flex: 1 }}>
            <label className="label">Kategori</label>
            <input className="input" value={form.kategori} onChange={e => set('kategori', e.target.value)} placeholder="cth: Makanan, Obat..." />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Catatan</label>
            <input className="input" value={form.catatan} onChange={e => set('catatan', e.target.value)} placeholder="Opsional" />
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
  titleRow: { display: 'flex', alignItems: 'center', gap: 10 },
  titleIcon: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 700, color: '#0F172A' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  barcodeRow: { display: 'flex', gap: 8, alignItems: 'flex-start' },
  row2: { display: 'flex', gap: 12 },
  required: { color: '#DC2626', fontWeight: 700 },
  foundNote:    { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#16A34A', marginTop: 5 },
  notFoundNote: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#D97706', marginTop: 5 },
  searchNote:   { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748B', marginTop: 5 },
  inputLocked:  { background: '#F1F5F9', color: '#64748B', cursor: 'not-allowed' },
  clearBtn:     { flexShrink: 0, width: 44, height: 44, borderRadius: 10, background: '#FEF2F2', border: '1.5px solid #FECACA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
}
