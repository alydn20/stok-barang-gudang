import React, { useState } from 'react'
import { Barcode, CheckCircle, XCircle } from 'lucide-react'
import Scanner from '../components/Scanner'
import { sheetsApi } from '../services/sheetsApi'

export default function StockOut() {
  const [form, setForm] = useState({ barcode: '', qty: '', catatan: '' })
  const [itemInfo, setItemInfo] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const handleBarcodeScan = async (barcode) => {
    setShowScanner(false)
    setForm(f => ({ ...f, barcode }))
    setItemInfo(null)
    try {
      const res = await sheetsApi.searchByBarcode(barcode)
      if (res.found) setItemInfo(res)
      else setStatus({ type: 'error', msg: 'Barang tidak ditemukan di database' })
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.barcode || !form.qty) return setStatus({ type: 'error', msg: 'Barcode dan Qty wajib diisi' })
    if (itemInfo && Number(form.qty) > Number(itemInfo.qty)) {
      return setStatus({ type: 'error', msg: `Stok tidak cukup. Tersedia: ${itemInfo.qty} pcs` })
    }
    setLoading(true)
    setStatus(null)
    try {
      await sheetsApi.stockOut({ ...form, tanggal: new Date().toISOString() })
      setStatus({ type: 'success', msg: 'Barang keluar berhasil dicatat!' })
      setForm({ barcode: '', qty: '', catatan: '' })
      setItemInfo(null)
    } catch (e) {
      setStatus({ type: 'error', msg: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Barang Keluar</h2>

      {showScanner && <Scanner onDetected={handleBarcodeScan} onCancel={() => setShowScanner(false)} />}

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Barcode</label>
        <div style={styles.barcodeRow}>
          <input style={styles.input} value={form.barcode} onChange={e => { setForm(f => ({ ...f, barcode: e.target.value })); setItemInfo(null) }} placeholder="Scan atau ketik barcode" required />
          <button type="button" onClick={() => setShowScanner(true)} style={styles.btnScan}>
            <Barcode size={20} />
          </button>
        </div>

        {itemInfo && (
          <div style={styles.infoBox}>
            <p style={styles.infoName}>{itemInfo.nama}</p>
            <div style={styles.infoRow}>
              <span style={styles.infoChip}>Stok: <b>{itemInfo.qty} pcs</b></span>
              <span style={styles.infoChip}>Rak: <b>{itemInfo.posisi || '-'}</b></span>
              {itemInfo.exp && <span style={{ ...styles.infoChip, background: '#fff3e0', color: '#e65100' }}>Exp: <b>{itemInfo.exp}</b></span>}
            </div>
          </div>
        )}

        <label style={styles.label}>Qty Keluar (pcs)</label>
        <input style={styles.input} type="number" min="1" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="Jumlah yang diambil" required />

        <label style={styles.label}>Catatan (opsional)</label>
        <input style={styles.input} value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} placeholder="Catatan tambahan" />

        {status && (
          <div style={{ ...styles.statusBox, background: status.type === 'success' ? '#e8f5e9' : '#ffebee', color: status.type === 'success' ? '#2e7d32' : '#c62828' }}>
            {status.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {status.msg}
          </div>
        )}

        <button type="submit" disabled={loading} style={styles.btnSubmit}>
          {loading ? 'Menyimpan...' : 'Simpan Barang Keluar'}
        </button>
      </form>
    </div>
  )
}

const styles = {
  page: { padding: '24px 16px 100px', maxWidth: 480, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#e53935' },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: 13, fontWeight: 600, color: '#555' },
  input: { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 15, outline: 'none' },
  barcodeRow: { display: 'flex', gap: 8 },
  btnScan: { padding: '10px 14px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  btnSubmit: { marginTop: 8, padding: '13px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  statusBox: { padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 },
  infoBox: { background: '#e3f2fd', borderRadius: 10, padding: '12px 14px', border: '1px solid #90caf9' },
  infoName: { fontWeight: 700, fontSize: 16, marginBottom: 8 },
  infoRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  infoChip: { background: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 13 },
}
