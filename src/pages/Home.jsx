import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PackagePlus, PackageMinus, ScanSearch, LayoutList, AlertTriangle, Boxes, TrendingDown, Clock, ArrowDownCircle, ArrowUpCircle, PackageX } from 'lucide-react'
import { sheetsApi } from '../services/sheetsApi'

const PRESETS = [
  { label: '7H',  days: 7  },
  { label: '14H', days: 14 },
  { label: '30H', days: 30 },
  { label: 'Custom', days: 0 },
]

function toDateStr(d) { return d.toISOString().slice(0, 10) }

const LS_STATS = 'home_stats_cache'
const readCache = () => { try { return JSON.parse(localStorage.getItem(LS_STATS) || 'null') } catch { return null } }

export default function Home() {
  const navigate = useNavigate()
  const [stats,       setStats]       = useState(readCache)   // tampil cache langsung
  const [loading,     setLoading]     = useState(true)
  const [preset,      setPreset]      = useState(7)
  const [customStart, setCustomStart] = useState('')
  const [customEnd,   setCustomEnd]   = useState('')
  const [showCustom,  setShowCustom]  = useState(false)

  const loadStats = useCallback((startDate, endDate) => {
    setLoading(true)
    const expDays = Number(localStorage.getItem('exp_threshold_days') || 30)
    const params  = { expDays, ...(startDate && endDate ? { startDate, endDate } : {}) }
    sheetsApi.getStats(params)
      .then(data => {
        setStats(data)
        try { localStorage.setItem(LS_STATS, JSON.stringify(data)) } catch {}
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const end   = new Date()
    const start = new Date(); start.setDate(end.getDate() - 6)
    loadStats(toDateStr(start), toDateStr(end))
  }, [])

  const handlePreset = (days) => {
    setPreset(days)
    if (days === 0) { setShowCustom(true); return }
    setShowCustom(false)
    const end   = new Date()
    const start = new Date(); start.setDate(end.getDate() - (days - 1))
    setCustomStart(''); setCustomEnd('')
    loadStats(toDateStr(start), toDateStr(end))
  }

  const handleCustomApply = () => {
    if (!customStart || !customEnd) return
    loadStats(customStart, customEnd)
  }

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
          <Boxes size={24} color="#fff" />
        </div>
      </div>

      {/* Stats row */}
      <div style={s.statsRow}>
        <StatCard icon={<Boxes size={17} color="#2563EB" />} bg="#EFF6FF"
          val={stats ? (stats.totalItem ?? 0) : '—'} label="Total Item" />
        <StatCard icon={<TrendingDown size={17} color="#DC2626" />} bg="#FEF2F2"
          val={stats ? (stats.lowStock ?? 0) : '—'} label="Stok Sedikit"
          warn={(stats?.lowStock ?? 0) > 0} warnColor="#DC2626" />
        <StatCard icon={<Clock size={17} color="#D97706" />} bg="#FFFBEB"
          val={stats ? (stats.expiringSoon ?? 0) : '—'} label="Segera Exp"
          warn={(stats?.expiringSoon ?? 0) > 0} warnColor="#D97706" />
      </div>

      {/* Today row */}
      <div style={s.todayRow}>
        <div style={s.todayCard}>
          <ArrowDownCircle size={16} color="#16A34A" />
          <span style={s.todayNum}>{stats ? (stats.todayMasuk ?? 0) : '—'}</span>
          <span style={s.todayLabel}>Masuk hari ini</span>
        </div>
        <div style={s.todayDivider} />
        <div style={s.todayCard}>
          <ArrowUpCircle size={16} color="#DC2626" />
          <span style={s.todayNum}>{stats ? (stats.todayKeluar ?? 0) : '—'}</span>
          <span style={s.todayLabel}>Keluar hari ini</span>
        </div>
        <div style={s.todayDivider} />
        <div style={s.todayCard}>
          <PackageX size={16} color="#94A3B8" />
          <span style={s.todayNum}>{stats ? (stats.expired ?? 0) : '—'}</span>
          <span style={s.todayLabel}>Kadaluarsa</span>
        </div>
      </div>

      {/* Chart */}
      <div style={s.chartWrap}>
        <div style={s.chartHeader}>
          <p style={s.chartTitle}>Grafik Transaksi</p>
          <div style={s.presetRow}>
            {PRESETS.map(p => (
              <button key={p.days} onClick={() => handlePreset(p.days)}
                style={{ ...s.presetBtn, ...(preset === p.days ? s.presetActive : {}) }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {showCustom && (
          <div style={s.customRow}>
            <input type="date" className="input" style={s.dateInput}
              value={customStart} onChange={e => setCustomStart(e.target.value)} />
            <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>
            <input type="date" className="input" style={s.dateInput}
              value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            <button onClick={handleCustomApply} className="btn btn-primary"
              style={{ padding: '7px 12px', fontSize: 12, borderRadius: 8 }}>
              Tampilkan
            </button>
          </div>
        )}

        <div style={s.chartLegend}>
          <span style={{ ...s.dot, background: '#16A34A' }} /> Masuk
          <span style={{ ...s.dot, background: '#DC2626', marginLeft: 10 }} /> Keluar
        </div>

        {!stats && loading ? (
          <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>Memuat...</span>
          </div>
        ) : chart.length > 0 ? (
          <div style={s.chartScroll}>
            <div style={{ ...s.chartBars, minWidth: chart.length * 32 }}>
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
        ) : (
          <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: '#CBD5E1' }}>Belum ada transaksi</span>
          </div>
        )}
      </div>

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
      <div style={s.grid} className="home-grid-actions">
        {actions.map(({ label, icon: Icon, color, bg, path }) => (
          <button key={path} onClick={() => navigate(path)} style={s.actionCard} className="action-card-btn">
            <div style={{ ...s.actionIcon, background: bg }}>
              <Icon size={28} color={color} strokeWidth={1.7} />
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
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 18px' },
  greeting:     { fontSize: 13, color: '#64748B', fontWeight: 500 },
  appTitle:     { fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 2, letterSpacing: '-0.02em' },
  logoBox:      { width: 48, height: 48, background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(37,99,235,0.28)' },
  statsRow:     { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 },
  statCard:     { background: '#fff', border: '1px solid #E8EEF6', borderRadius: 14, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'border-color 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  statIcon:     { width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statNum:      { fontSize: 22, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' },
  statLabel:    { fontSize: 10, color: '#64748B', textAlign: 'center', lineHeight: 1.3, fontWeight: 500 },
  todayRow:     { display: 'flex', background: '#fff', border: '1px solid #E8EEF6', borderRadius: 14, marginBottom: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  todayCard:    { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '13px 8px' },
  todayDivider: { width: 1, background: '#EEF2F7', margin: '10px 0' },
  todayNum:     { fontSize: 20, fontWeight: 800, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.02em' },
  todayLabel:   { fontSize: 10, color: '#64748B', textAlign: 'center', lineHeight: 1.3, fontWeight: 500 },
  chartWrap:    { background: '#fff', border: '1px solid #E8EEF6', borderRadius: 14, padding: '16px 16px 12px', marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  chartHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  chartTitle:   { fontSize: 13, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' },
  presetRow:    { display: 'flex', gap: 4 },
  presetBtn:    { padding: '4px 10px', borderRadius: 99, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#64748B', transition: 'all 0.15s' },
  presetActive: { background: '#2563EB', color: '#fff', borderColor: '#2563EB', boxShadow: '0 2px 8px rgba(37,99,235,0.28)' },
  customRow:    { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 },
  dateInput:    { flex: 1, padding: '6px 8px', fontSize: 12 },
  chartLegend:  { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748B', marginBottom: 10 },
  dot:          { display: 'inline-block', width: 8, height: 8, borderRadius: 99 },
  chartScroll:  { overflowX: 'auto', paddingBottom: 2 },
  chartBars:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 64 },
  barCol:       { flex: 1, minWidth: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  barGroup:     { display: 'flex', gap: 3, alignItems: 'flex-end', height: 56 },
  bar:          { width: 8, borderRadius: '4px 4px 0 0', minHeight: 3, transition: 'height 0.35s' },
  barLabel:     { fontSize: 9, color: '#94A3B8', whiteSpace: 'nowrap', fontWeight: 500 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 10, letterSpacing: '0.07em', textTransform: 'uppercase' },
  grid:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  actionCard:   { background: '#fff', border: '1px solid #E8EEF6', borderRadius: 18, padding: '22px 12px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  actionIcon:   { width: 58, height: 58, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  actionLabel:  { fontSize: 13, fontWeight: 700, color: '#1E293B', letterSpacing: '-0.01em' },
}
