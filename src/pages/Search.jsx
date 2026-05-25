import React, { useState } from 'react'
import { Barcode, MapPin, Package, Calendar, AlertTriangle } from 'lucide-react'
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
    const code = bc || barcode
    if (!code.trim()) return
    setLoading(true)
    setResult(null)
    setNotFound(false)
    setHistory([])
    try {
      const [res, hist] = await Promise.all([
        sheetsApi.searchByBarcode(code),
        sheetsApi.getHistory(code),
      ])
      if (res.found) {
        setResult(res)
        setHistory(hist.history || [])
      } else {
        setNotFound(true)
      }
    } catch (e) {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const handleBarcodeScan = (bc) => {
    setShowScanner(false)
    setBarcode(bc)
    doSearch(bc)
  }

  const isExpiringSoon = (exp) => {
    if (!exp) return false
    const d = new Date(exp)
    const soon = new Date(); soon.setDate(soon.getDate() + 30)
    return d <= soon && d >= new Date()
  }

  const isExpired = (exp) => {
    if (!exp) return false
    return new Date(exp) < new Date()
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Cari Barang</h2>

      {showScanner && <Scanner onDetected={handleBarcodeScan} onCancel={() => setShowScanner(false)} />}

      <div style={styles.searchRow}>
        <input
          style={styles.input}
          value={barcode}
          onChange={e => setBarcode(e.target.value)}
          placeholder="Scan atau ketik barcode"
          onKeyDown={e => e.key === 'Enter' && doSearch()}
        />
        <button onClick={() => setShowScanner(true)} style={styles.btnScan} title="Scan barcode">
          <Barcode size={20} />
        </button>
        <button onClick={() => doSearch()} style={styles.btnSearch} disabled={loading}>
          {loading ? '...' : 'Cari'}
        </button>
      </div>

      {notFound && (
        <div style={styles.notFound}>
          <Package size={48} color="#ccc" />
          <p style={{ color: '#888', marginTop: 8 }}>Barang tidak ditemukan</p>
          <p style={{ color: '#aaa', fontSize: 12 }}>Barcode: {barcode}</p>
        </div>
      )}

      {result && (
        <div style={styles.resultCard}>
          <div style={styles.resultHeader}>
            <h3 style={styles.resultName}>{result.nama}</h3>
            <span style={styles.barcodeTag}>{result.barcode}</span>
          </div>

          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <Package size={18} color="#1976d2" />
              <div>
                <p style={styles.infoLabel}>Stok</p>
                <p style={{ ...styles.infoValue, color: Number(result.qty) <= 3 ? '#e53935' : '#333' }}>
                  {result.qty} pcs
                  {Number(result.qty) <= 3 && <span style={styles.alertBadge}>Sedikit!</span>}
                </p>
              </div>
            </div>

            <div style={styles.infoItem}>
              <MapPin size={18} color="#43a047" />
              <div>
                <p style={styles.infoLabel}>Posisi Rak</p>
                <p style={{ ...styles.infoValue, color: '#43a047' }}>{result.posisi || '-'}</p>
              </div>
            </div>

            {result.exp && (
              <div style={{ ...styles.infoItem, gridColumn: '1/-1' }}>
                <Calendar size={18} color={isExpired(result.exp) ? '#e53935' : isExpiringSoon(result.exp) ? '#e65100' : '#7b1fa2'} />
                <div>
                  <p style={styles.infoLabel}>Kadaluarsa</p>
                  <p style={{ ...styles.infoValue, color: isExpired(result.exp) ? '#e53935' : isExpiringSoon(result.exp) ? '#e65100' : '#333' }}>
                    {result.exp}
                    {isExpired(result.exp) && <span style={{ ...styles.alertBadge, background: '#ffebee', color: '#c62828' }}>KADALUARSA!</span>}
                    {!isExpired(result.exp) && isExpiringSoon(result.exp) && <span style={{ ...styles.alertBadge, background: '#fff3e0', color: '#e65100' }}>Segera Exp</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div style={styles.historySection}>
          <h4 style={styles.historyTitle}>Riwayat Transaksi</h4>
          {history.slice(0, 10).map((h, i) => (
            <div key={i} style={styles.historyItem}>
              <span style={{ ...styles.typeBadge, background: h.tipe === 'MASUK' ? '#e8f5e9' : '#ffebee', color: h.tipe === 'MASUK' ? '#2e7d32' : '#c62828' }}>
                {h.tipe === 'MASUK' ? '+' : '-'}{h.qty}
              </span>
              <div style={{ flex: 1 }}>
                <p style={styles.histName}>{h.tipe === 'MASUK' ? 'Masuk' : 'Keluar'}</p>
                {h.catatan && <p style={styles.histNote}>{h.catatan}</p>}
              </div>
              <span style={styles.histDate}>{h.tanggal ? new Date(h.tanggal).toLocaleDateString('id') : '-'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { padding: '24px 16px 100px', maxWidth: 480, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#1976d2' },
  searchRow: { display: 'flex', gap: 8, marginBottom: 20 },
  input: { flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 15, outline: 'none' },
  btnScan: { padding: '10px 14px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  btnSearch: { padding: '10px 18px', background: '#333', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  notFound: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', color: '#888' },
  resultCard: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.1)', marginBottom: 20 },
  resultHeader: { marginBottom: 16 },
  resultName: { fontSize: 20, fontWeight: 800, marginBottom: 4 },
  barcodeTag: { fontSize: 12, background: '#f5f5f5', padding: '3px 10px', borderRadius: 20, color: '#666', fontFamily: 'monospace' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  infoItem: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  infoLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  infoValue: { fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  alertBadge: { fontSize: 11, background: '#ffebee', color: '#c62828', padding: '2px 8px', borderRadius: 20, fontWeight: 600 },
  historySection: { background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  historyTitle: { fontSize: 15, fontWeight: 700, marginBottom: 12 },
  historyItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f5f5' },
  typeBadge: { borderRadius: 8, padding: '4px 10px', fontWeight: 700, fontSize: 14, minWidth: 48, textAlign: 'center' },
  histName: { fontSize: 14, fontWeight: 600 },
  histNote: { fontSize: 12, color: '#888' },
  histDate: { fontSize: 12, color: '#aaa', whiteSpace: 'nowrap' },
}
