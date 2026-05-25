import React, { useState } from 'react'
import { Barcode, CheckCircle, XCircle } from 'lucide-react'
import Scanner from '../components/Scanner'
import { sheetsApi } from '../services/sheetsApi'

const emptyForm = { barcode: '', nama: '', qty: '', exp: '', posisi: '', catatan: '' }

export default function StockIn() {
  const [form, setForm] = useState(emptyForm)
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // {type: 'success'|'error', msg}
  const [itemFound, setItemFound] = useState(false)

  const handleBarcodeScan = async (barcode) => {
    setShowScanner(false)
    setForm(f => ({ ...f, barcode }))
    // Cari info barang dari sheet
    try {
      const res = await sheetsApi.searchByBarcode(barcode)
      if (res.found) {
        setForm(f => ({ ...f, barcode, nama: res.nama || '', posisi: res.posisi || '' }))
        setItemFound(true)
      } else {
        setItemFound(false)
      }
    } catch { setItemFound(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.barcode || !form.qty) return setStatus({ type: 'error', msg: 'Barcode dan Qty wajib diisi' })
    setLoading(true)
    setStatus(null)
    try {
      await sheetsApi.stockIn({ ...form, tanggal: new Date().toISOString() })
      setStatus({ type: 'success', msg: 'Barang masuk berhasil dicatat!' })
      setForm(emptyForm)
      setItemFound(false)
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Barang Masuk</h2>

      {showScanner && <Scanner onDetected={handleBarcodeScan} onCancel={() => setShowScanner(false)} />}

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Barcode</label>
        <div style={styles.barcodeRow}>
          <input style={styles.input} value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} placeholder="Scan atau ketik barcode" required />
          <button type="button" onClick={() => setShowScanner(true)} style={styles.btnScan}>
            <Barcode size={20} />
          </button>
        </div>

        <label style={styles.label}>Nama Barang {itemFound && <span style={styles.badge}>Ditemukan</span>}</label>
        <input style={styles.input} value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Nama produk" required />

        <label style={styles.label}>Qty (pcs)</label>
        <input style={styles.input} type="number" min="1" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="Jumlah" required />

        <label style={styles.label}>Tanggal Kadaluarsa</label>
        <input style={styles.input} type="date" value={form.exp} onChange={e => setForm(f => ({ ...f, exp: e.target.value }))} />

        <label style={styles.label}>Posisi Rak</label>
        <input style={styles.input} value={form.posisi} onChange={e => setForm(f => ({ ...f, posisi: e.target.value }))} placeholder="cth: Rak A baris 2, Lemari Kiri" />

        <label style={styles.label}>Catatan (opsional)</label>
        <input style={styles.input} value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} placeholder="Catatan tambahan" />

        {status && (
          <div style={{ ...styles.statusBox, background: status.type === 'success' ? '#e8f5e9' : '#ffebee', color: status.type === 'success' ? '#2e7d32' : '#c62828' }}>
            {status.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {status.msg}
          </div>
        )}

        <button type="submit" disabled={loading} style={styles.btnSubmit}>
          {loading ? 'Menyimpan...' : 'Simpan Barang Masuk'}
        </button>
      </form>
    </div>
  )
}

const styles = {
  page: { padding: '24px 16px 100px', maxWidth: 480, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#43a047' },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: 13, fontWeight: 600, color: '#555', display: 'flex', alignItems: 'center', gap: 8 },
  input: { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 15, outline: 'none' },
  barcodeRow: { display: 'flex', gap: 8 },
  btnScan: { padding: '10px 14px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  btnSubmit: { marginTop: 8, padding: '13px', background: '#43a047', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  statusBox: { padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 },
  badge: { background: '#e8f5e9', color: '#2e7d32', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 },
}
