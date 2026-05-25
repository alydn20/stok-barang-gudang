import React, { useEffect } from 'react'
import { useScanner } from '../hooks/useScanner'
import { Camera, CameraOff, X, AlertTriangle } from 'lucide-react'

export default function Scanner({ onDetected, onCancel, autoStart = true }) {
  const { videoRef, scanning, error, startScan, stopScan } = useScanner(onDetected)

  // Auto-start saat modal dibuka
  useEffect(() => {
    if (autoStart) startScan()
    return () => stopScan()
  }, [])

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div style={s.sheet}>
        <div style={s.handle} />

        <div style={s.header}>
          <h3 style={s.title}>Scan Barcode</h3>
          <button onClick={() => { stopScan(); onCancel() }} style={s.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div style={s.viewfinder}>
          <video ref={videoRef} style={s.video} playsInline muted autoPlay />

          {!scanning && !error && (
            <div style={s.placeholder}>
              <Camera size={44} color="#CBD5E1" />
              <p style={{ color: '#94A3B8', fontSize: 14, marginTop: 8 }}>Memuat kamera...</p>
            </div>
          )}

          {scanning && (
            <>
              <div style={s.c1} /><div style={s.c2} />
              <div style={s.c3} /><div style={s.c4} />
              <div style={s.scanLine} />
              <div style={s.scanLabel}>Arahkan ke barcode</div>
            </>
          )}
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginTop: 12 }}>
            <AlertTriangle size={16} />
            <div>
              <p style={{ fontWeight: 600, marginBottom: 2 }}>Kamera tidak dapat diakses</p>
              <p style={{ fontSize: 13 }}>{error}</p>
            </div>
          </div>
        )}

        <div style={s.btnRow}>
          {error ? (
            <button onClick={startScan} className="btn btn-primary btn-full">
              <Camera size={18} /> Coba Lagi
            </button>
          ) : scanning ? (
            <button onClick={stopScan} className="btn btn-ghost btn-full">
              <CameraOff size={18} /> Berhenti
            </button>
          ) : (
            <button onClick={startScan} className="btn btn-primary btn-full">
              <Camera size={18} /> Mulai Scan
            </button>
          )}
        </div>

        <p style={s.hint}>Atau ketik barcode secara manual di kolom input</p>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(15,23,42,0.65)',
    display: 'flex', alignItems: 'flex-end',
    zIndex: 1000,
    backdropFilter: 'blur(3px)',
  },
  sheet: {
    background: '#fff',
    borderRadius: '20px 20px 0 0',
    padding: '0 20px 32px',
    width: '100%',
    maxWidth: 520,
    margin: '0 auto',
  },
  handle: { width: 40, height: 4, background: '#E2E8F0', borderRadius: 4, margin: '12px auto 16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: 700, color: '#0F172A' },
  closeBtn: { width: 32, height: 32, borderRadius: 8, border: 'none', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' },
  viewfinder: {
    position: 'relative', background: '#0F172A',
    borderRadius: 14, overflow: 'hidden',
    height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  video: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 },
  scanLine: {
    position: 'absolute', left: '10%', right: '10%', height: 2,
    background: 'linear-gradient(90deg, transparent, #2563EB, transparent)',
    animation: 'scanLine 2s ease-in-out infinite',
    zIndex: 2,
  },
  scanLabel: {
    position: 'absolute', bottom: 12,
    background: 'rgba(0,0,0,0.45)', color: '#fff',
    fontSize: 12, padding: '4px 12px', borderRadius: 99, zIndex: 2,
  },
  c1: { position: 'absolute', top: 16, left: 16, width: 24, height: 24, borderTop: '3px solid #2563EB', borderLeft: '3px solid #2563EB', borderRadius: '4px 0 0 0', zIndex: 2 },
  c2: { position: 'absolute', top: 16, right: 16, width: 24, height: 24, borderTop: '3px solid #2563EB', borderRight: '3px solid #2563EB', borderRadius: '0 4px 0 0', zIndex: 2 },
  c3: { position: 'absolute', bottom: 16, left: 16, width: 24, height: 24, borderBottom: '3px solid #2563EB', borderLeft: '3px solid #2563EB', borderRadius: '0 0 0 4px', zIndex: 2 },
  c4: { position: 'absolute', bottom: 16, right: 16, width: 24, height: 24, borderBottom: '3px solid #2563EB', borderRight: '3px solid #2563EB', borderRadius: '0 0 4px 0', zIndex: 2 },
  btnRow: { marginBottom: 10 },
  hint: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
}
