import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PackagePlus, PackageMinus, ScanSearch, LayoutList, AlertTriangle, Boxes, TrendingDown, Clock, ArrowDownCircle, ArrowUpCircle, PackageX } from 'lucide-react'
import { sheetsApi } from '../services/sheetsApi'

export default function Home() {
  const navigate = useNavigate()
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sheetsApi.getStats()
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const actions = [
    { label: 'Barang Masuk',  icon: PackagePlus,  color: '#16A34A', bg: '#F0FDF4', path: '/masuk'  },
    { label: 'Barang Keluar', icon: PackageMinus, color: '#DC2626', bg: '#FEF2F2', path: '/keluar' },
    { label: 'Cari Barang',   icon: ScanSearch,   color: '#2563EB', bg: '#EFF6FF', path: '/cari'   },
    { label: 'Lihat Stok',    icon: LayoutList,   color: '#7C3AED', bg: '#F5F3FF', path: '/stok'   },
  ]

  const chart = stats?.weeklyChart || []
  const maxVal = chart.length ? Math.max(...chart.map(d => Math.max(d.masuk, d.keluar)), 1) : 1

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

      {/* Stats row */}
      <div style={s.statsRow}>
        <StatCard icon={<Boxes size={17} color="#2563EB" />} bg="#EFF6FF"
          val={loading ? '—' : stats?.totalItem ?? 0} label="Total Item" />
        <StatCard icon={<TrendingDown size={17} color="#DC2626" />} bg="#FEF2F2"
          val={loading ? '—' : stats?.lowStock ?? 0} label="Stok Sedikit"
          warn={(stats?.lowStock ?? 0) > 0} warnColor="#DC2626" />
        <StatCard icon={<Clock size={17} color="#D97706" />} bg="#FFFBEB"
          val={loading ? '—' : stats?.expiringSoon ?? 0} label="Segera Exp"
          warn={(stats?.expiringSoon ?? 0) > 0} warnColor="#D97706" />
      </div>

      {/* Today row */}
      <div style={s.todayRow}>
        <div style={s.todayCard}>
          <ArrowDownCircle size={16} color="#16A34A" />
          <span style={s.todayNum}>{loading ? '—' : stats?.todayMasuk ?? 0}</span>
          <span style={s.todayLabel}>Masuk hari ini</span>
        </div>
        <div style={s.todayDivider} />
        <div style={s.todayCard}>
          <ArrowUpCircle size={16} color="#DC2626" />
          <span style={s.todayNum}>{loading ? '—' : stats?.todayKeluar ?? 0}</span>
          <span style={s.todayLabel}>Keluar hari ini</span>
        </div>
        <div style={s.todayDivider} />
        <div style={s.todayCard}>
          <PackageX size={16} color="#94A3B8" />
          <span style={s.todayNum}>{loading ? '—' : stats?.expired ?? 0}</span>
          <span style={s.todayLabel}>Kadaluarsa</span>
        </div>
      </div>

      {/* Weekly chart */}
      {chart.length > 0 && (
        <div style={s.chartWrap}>
          <p style={s.chartTitle}>7 Hari Terakhir</p>
          <div style={s.chartLegend}>
            <span style={{ ...s.dot, background: '#16A34A' }} /> Masuk
            <span style={{ ...s.dot, background: '#DC2626', marginLeft: 10 }} /> Keluar
          </div>
          <div style={s.chartBars}>
            {chart.map((d, i) => (
              <div key={i} style={s.barCol}>
                <div style={s.barGroup}>
                  <div style={{ ...s.bar, height: `${Math.round((d.masuk / maxVal) * 52)}px`, background: '#16A34A' }} title={`Masuk: ${d.masuk}`} />
                  <div style={{ ...s.bar, height: `${Math.round((d.keluar / maxVal) * 52)}px`, background: '#DC2626' }} title={`Keluar: ${d.keluar}`} />
                </div>
                <span style={s.barLabel}>{d.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert */}
      {!loading && stats && ((stats.lowStock ?? 0) > 0 || (stats.expiringSoon ?? 0) > 0 || (stats.expired ?? 0) > 0) && (
        <div className="alert alert-warning fade-in" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} />
          <span>
            {(stats.lowStock ?? 0) > 0     && `${stats.lowStock} item stok rendah. `}
            {(stats.expiringSoon ?? 0) > 0  && `${stats.expiringSoon} item hampir kadaluarsa. `}
            {(stats.expired ?? 0) > 0       && `${stats.expired} item sudah kadaluarsa.`}
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

function StatCard({ icon, bg, val, label, warn, warnColor }) {
  return (
    <div style={{ ...s.statCard, borderColor: warn ? warnColor + '66' : '#E2E8F0' }}>
      <div style={{ ...s.statIcon, background: bg }}>{icon}</div>
      <span style={{ ...s.statNum, color: warn ? warnColor : '#0F172A' }}>{val}</span>
      <span style={s.statLabel}>{label}</span>
    </div>
  )
}

const s = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 16px' },
  greeting:    { fontSize: 13, color: '#64748B' },
  appTitle:    { fontSize: 22, fontWeight: 800, color: '#0F172A', marginTop: 2 },
  logoBox:     { width: 46, height: 46, background: '#EFF6FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statsRow:    { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 },
  statCard:    { background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, transition: 'border-color 0.2s' },
  statIcon:    { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statNum:     { fontSize: 22, fontWeight: 800, lineHeight: 1 },
  statLabel:   { fontSize: 11, color: '#64748B', textAlign: 'center', lineHeight: 1.2 },
  todayRow:    { display: 'flex', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12, marginBottom: 14, overflow: 'hidden' },
  todayCard:   { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 6px' },
  todayDivider:{ width: 1, background: '#E2E8F0', margin: '8px 0' },
  todayNum:    { fontSize: 18, fontWeight: 800, color: '#0F172A', lineHeight: 1 },
  todayLabel:  { fontSize: 10, color: '#64748B', textAlign: 'center', lineHeight: 1.2 },
  chartWrap:   { background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '14px 14px 10px', marginBottom: 14 },
  chartTitle:  { fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 4 },
  chartLegend: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748B', marginBottom: 10 },
  dot:         { display: 'inline-block', width: 8, height: 8, borderRadius: 99 },
  chartBars:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 60 },
  barCol:      { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  barGroup:    { display: 'flex', gap: 2, alignItems: 'flex-end', height: 52 },
  bar:         { width: 8, borderRadius: '3px 3px 0 0', minHeight: 2, transition: 'height 0.3s' },
  barLabel:    { fontSize: 9, color: '#94A3B8', whiteSpace: 'nowrap' },
  sectionTitle:{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 10, letterSpacing: 0.3 },
  grid:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  actionCard:  { background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 14, padding: '20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.1s' },
  actionIcon:  { width: 54, height: 54, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: 600, color: '#1E293B' },
}
