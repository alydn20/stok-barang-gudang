import React, { useState, useEffect } from 'react'
import { RefreshCw, Boxes, Sparkles } from 'lucide-react'

export default function UpdateGate({ children }) {
  const [pendingWorker, setPendingWorker] = useState(null)
  const [updating,      setUpdating]      = useState(false)

  useEffect(() => {
    const handler = (e) => setPendingWorker(e.detail)
    window.addEventListener('swUpdateAvailable', handler)
    return () => window.removeEventListener('swUpdateAvailable', handler)
  }, [])

  const handleUpdate = () => {
    setUpdating(true)
    if (pendingWorker) {
      pendingWorker.postMessage({ type: 'SKIP_WAITING' })
    } else {
      window.location.reload(true)
    }
  }

  if (!pendingWorker) return children

  return (
    <div style={s.overlay}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logoBox}>
            <Boxes size={32} color="#fff" />
          </div>
          <div style={s.sparkle}><Sparkles size={16} color="#FCD34D" /></div>
        </div>

        {/* Badge */}
        <span style={s.badge}>Versi Baru Tersedia</span>

        {/* Title */}
        <h1 style={s.title}>Pembaruan Wajib</h1>
        <p style={s.subtitle}>
          Aplikasi perlu diperbarui ke versi terbaru sebelum bisa digunakan.
          Semua data Anda tetap aman.
        </p>

        {/* Highlights */}
        <div style={s.highlights}>
          {[
            'Performa lebih cepat',
            'Fitur terbaru tersedia',
            'Perbaikan bug & keamanan',
          ].map(t => (
            <div key={t} style={s.highlightRow}>
              <span style={s.dot} />
              <span style={s.highlightText}>{t}</span>
            </div>
          ))}
        </div>

        {/* Button */}
        <button onClick={handleUpdate} disabled={updating} style={s.btn}>
          <RefreshCw size={18} style={updating ? { animation: 'spin 0.8s linear infinite' } : {}} />
          {updating ? 'Memperbarui...' : 'Perbarui Sekarang'}
        </button>

        <p style={s.footer}>Stok Barang (By Aliyudin)</p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.06);} }
      `}</style>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 50%, #1D4ED8 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  card: {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 24,
    padding: '36px 28px 28px',
    maxWidth: 360,
    width: '100%',
    textAlign: 'center',
    animation: 'fadeUp 0.4s ease',
    boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
  },
  logoWrap: {
    position: 'relative', display: 'inline-block', marginBottom: 20,
  },
  logoBox: {
    width: 72, height: 72,
    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    borderRadius: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(37,99,235,0.5)',
    animation: 'pulse 2s ease-in-out infinite',
  },
  sparkle: {
    position: 'absolute', top: -6, right: -6,
    background: 'rgba(15,23,42,0.8)',
    borderRadius: 99, padding: 4,
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(59,130,246,0.25)',
    border: '1px solid rgba(96,165,250,0.4)',
    color: '#93C5FD',
    fontSize: 11, fontWeight: 700,
    padding: '4px 14px', borderRadius: 99,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    marginBottom: 14,
  },
  title: {
    fontSize: 26, fontWeight: 800, color: '#F8FAFC',
    letterSpacing: '-0.02em', marginBottom: 10,
  },
  subtitle: {
    fontSize: 14, color: '#94A3B8', lineHeight: 1.6,
    marginBottom: 20,
  },
  highlights: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '14px 16px',
    marginBottom: 24,
    display: 'flex', flexDirection: 'column', gap: 10,
    textAlign: 'left',
  },
  highlightRow: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  dot: {
    width: 6, height: 6, borderRadius: 99,
    background: '#60A5FA', flexShrink: 0,
  },
  highlightText: {
    fontSize: 13, color: '#CBD5E1', fontWeight: 500,
  },
  btn: {
    width: '100%', padding: '15px 20px',
    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 60%, #1D4ED8 100%)',
    color: '#fff', border: 'none', borderRadius: 14,
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    boxShadow: '0 4px 20px rgba(37,99,235,0.5)',
    transition: 'opacity 0.2s',
    marginBottom: 16,
  },
  footer: {
    fontSize: 11, color: '#475569', fontWeight: 500,
  },
}
