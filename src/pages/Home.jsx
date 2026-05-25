import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PackagePlus, PackageMinus, Search, List, AlertTriangle } from 'lucide-react'
import { sheetsApi } from '../services/sheetsApi'

export default function Home() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState({ total: 0, expiringSoon: 0, lowStock: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sheetsApi.getAllStock()
      .then(data => {
        const items = data.items || []
        const today = new Date()
        const soon = new Date(); soon.setDate(today.getDate() + 30)
        const expiringSoon = items.filter(i => i.exp && new Date(i.exp) <= soon && new Date(i.exp) >= today).length
        const lowStock = items.filter(i => Number(i.qty) <= 3).length
        setSummary({ total: items.length, expiringSoon, lowStock })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Barang Masuk', icon: PackagePlus, color: '#43a047', path: '/masuk' },
    { label: 'Barang Keluar', icon: PackageMinus, color: '#e53935', path: '/keluar' },
    { label: 'Cari Barang', icon: Search, color: '#1976d2', path: '/cari' },
    { label: 'Lihat Stok', icon: List, color: '#7b1fa2', path: '/stok' },
  ]

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Stok Gudang</h1>
        <p style={styles.sub}>Manajemen Stok Pribadi</p>
      </div>

      <div style={styles.statRow}>
        <div style={styles.stat}>
          <span style={styles.statNum}>{loading ? '...' : summary.total}</span>
          <span style={styles.statLabel}>Total Item</span>
        </div>
        <div style={{ ...styles.stat, background: summary.expiringSoon > 0 ? '#fff3e0' : '#f5f5f5' }}>
          <span style={{ ...styles.statNum, color: summary.expiringSoon > 0 ? '#e65100' : '#333' }}>{loading ? '...' : summary.expiringSoon}</span>
          <span style={styles.statLabel}>Exp 30 hari</span>
        </div>
        <div style={{ ...styles.stat, background: summary.lowStock > 0 ? '#fce4ec' : '#f5f5f5' }}>
          <span style={{ ...styles.statNum, color: summary.lowStock > 0 ? '#c62828' : '#333' }}>{loading ? '...' : summary.lowStock}</span>
          <span style={styles.statLabel}>Stok Sedikit</span>
        </div>
      </div>

      {(summary.expiringSoon > 0 || summary.lowStock > 0) && !loading && (
        <div style={styles.alert}>
          <AlertTriangle size={16} color="#e65100" />
          <span style={{ fontSize: 13, color: '#e65100' }}>
            {summary.expiringSoon > 0 && `${summary.expiringSoon} item hampir exp. `}
            {summary.lowStock > 0 && `${summary.lowStock} item stok rendah.`}
          </span>
        </div>
      )}

      <div style={styles.grid}>
        {cards.map(({ label, icon: Icon, color, path }) => (
          <button key={path} onClick={() => navigate(path)} style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
            <Icon size={32} color={color} />
            <span style={styles.cardLabel}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const styles = {
  page: { padding: '24px 16px 100px', maxWidth: 480, margin: '0 auto' },
  header: { textAlign: 'center', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 800, color: '#1976d2' },
  sub: { fontSize: 14, color: '#888', marginTop: 4 },
  statRow: { display: 'flex', gap: 10, marginBottom: 16 },
  stat: { flex: 1, background: '#f5f5f5', borderRadius: 12, padding: '14px 10px', textAlign: 'center' },
  statNum: { display: 'block', fontSize: 24, fontWeight: 800, color: '#333' },
  statLabel: { display: 'block', fontSize: 11, color: '#888', marginTop: 2 },
  alert: { background: '#fff3e0', border: '1px solid #ffcc80', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  card: { background: '#fff', borderRadius: 14, padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none', cursor: 'pointer', transition: 'transform 0.1s' },
  cardLabel: { fontSize: 14, fontWeight: 600, color: '#333' },
}
