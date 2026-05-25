import React, { useState } from 'react'
import { ScanLine, CheckCircle2, XCircle, PackagePlus } from 'lucide-react'
import Scanner from '../components/Scanner'
import { sheetsApi } from '../services/sheetsApi'

const empty = { barcode: '', nama: '', qty: '', exp: '', posisi: '', catatan: '' }

export default function StockIn() {
  const [form, setForm] = useState(empty)
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [found, setFound] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleBarcodeScan = async (barcode) => {
    setShowScanner(false)
    set('barcode', barcode)
    try {
      const res = await sheetsApi.searchByBarcode(barcode)
      if (res.found) {
        setForm(f => ({ ...f, barcode, nama: res.nama || '', posisi: res.posisi || '' }))
        setFound(true)
      } else {
        setFound(false)
      }
    } catch { setFound(false) }
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
    <div className="page">
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
              onChange={e => { set('barcode', e.target.value); setFound(false) }}
              placeholder="Scan atau ketik barcode"
              required
            />
            <button type="button" onClick={() => setShowScanner(true)} className="btn-icon" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10 }}>
              <ScanLine size={20} />
            </button>
          </div>
          {found && <p style={s.foundNote}><CheckCircle2 size={13} /> Data barang ditemukan</p>}
        </div>

        {/* Nama */}
        <div>
          <label className="label">Nama Barang <span style={s.required}>*</span></label>
          <input className="input" value={form.nama} onChange={e => set('nama', e.target.value)} placeholder="Nama produk" required />
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

        {/* Catatan */}
        <div>
          <label className="label">Catatan</label>
          <input className="input" value={form.catatan} onChange={e => set('catatan', e.target.value)} placeholder="Opsional" />
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
  foundNote: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#16A34A', marginTop: 5 },
}
