import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PackagePlus, PackageMinus, ScanSearch, LayoutList, AlertTriangle, Boxes, TrendingDown, Clock } from 'lucide-react'
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
        setSummary({
          total: items.length,
          expiringSoon: items.filter(i => i.exp && new Date(i.exp) <= soon && new Date(i.exp) >= today).length,
          lowStock: items.filter(i => Number(i.qty) <= 3).length,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const actions = [
    { label: 'Barang Masuk',  icon: PackagePlus,  color: '#16A34A', bg: '#F0FDF4', path: '/masuk'  },
    { label: 'Barang Keluar', icon: PackageMinus, color: '#DC2626', bg: '#FEF2F2', path: '/keluar' },
    { label: 'Cari Barang',   icon: ScanSearch,   color: '#2563EB', bg: '#EFF6FF', path: '/cari'   },
    { label: 'Lihat Stok',    icon: LayoutList,   color: '#7C3AED', bg: '#F5F3FF', path: '/stok'   },
  ]

  return (
    <div className="page">
      {/* Header */}
      <div style={s.header}>
        <div>
          <p style={s.greeting}>Selamat datang</p>
          <h1 style={s.appTitle}>Stok Gudang</h1>
        </div>
        <div style={s.logoBox}>
          <Boxes size={26} color="#2563EB" />
        </div>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: '#EFF6FF' }}>
            <Boxes size={18} color="#2563EB" />
          </div>
          <span style={s.statNum}>{loading ? '—' : summary.total}</span>
          <span style={s.statLabel}>Total Item</span>
        </div>
        <div style={{ ...s.statCard, borderColor: summary.lowStock > 0 ? '#FECACA' : '#E2E8F0' }}>
          <div style={{ ...s.statIcon, background: '#FEF2F2' }}>
            <TrendingDown size={18} color="#DC2626" />
          </div>
          <span style={{ ...s.statNum, color: summary.lowStock > 0 ? '#DC2626' : '#0F172A' }}>
            {loading ? '—' : summary.lowStock}
          </span>
          <span style={s.statLabel}>Stok Sedikit</span>
        </div>
        <div style={{ ...s.statCard, borderColor: summary.expiringSoon > 0 ? '#FDE68A' : '#E2E8F0' }}>
          <div style={{ ...s.statIcon, background: '#FFFBEB' }}>
            <Clock size={18} color="#D97706" />
          </div>
          <span style={{ ...s.statNum, color: summary.expiringSoon > 0 ? '#D97706' : '#0F172A' }}>
            {loading ? '—' : summary.expiringSoon}
          </span>
          <span style={s.statLabel}>Segera Exp</span>
        </div>
      </div>

      {/* Alert */}
      {!loading && (summary.expiringSoon > 0 || summary.lowStock > 0) && (
        <div className="alert alert-warning fade-in" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} />
          <span>
            {summary.lowStock > 0 && `${summary.lowStock} item stok rendah. `}
            {summary.expiringSoon > 0 && `${summary.expiringSoon} item hampir kadaluarsa.`}
          </span>
        </div>
      )}

      {/* Action Grid */}
      <p style={s.sectionTitle}>Menu Utama</p>
      <div style={s.grid}>
        {actions.map(({ label, icon: Icon, color, bg, path }) => (
          <button key={path} onClick={() => navigate(path)} style={s.actionCard}>
            <div style={{ ...s.actionIcon, background: bg }}>
              <Icon size={26} color={color} strokeWidth={1.8} />
            </div>
            <span style={s.actionLabel}>{label}</span>
          </button>
        ))}
      </div>

    </div>
  )
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 16px' },
  greeting: { fontSize: 13, color: '#64748B' },
  appTitle: { fontSize: 22, fontWeight: 800, color: '#0F172A', marginTop: 2 },
  logoBox: { width: 46, height: 46, background: '#EFF6FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 },
  statCard: { background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'border-color 0.2s' },
  statIcon: { width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statNum: { fontSize: 22, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 11, color: '#64748B', textAlign: 'center', lineHeight: 1.2 },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 10, letterSpacing: 0.3 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  actionCard: {
    background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 14,
    padding: '20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.1s',
  },
  actionIcon: { width: 54, height: 54, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: 600, color: '#1E293B' },
}
