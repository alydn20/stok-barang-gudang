import React from 'react'
import { useScanner } from '../hooks/useScanner'
import { Camera, CameraOff, X, SwitchCamera } from 'lucide-react'

export default function Scanner({ onDetected, onCancel }) {
  const { videoRef, scanning, error, cameras, selectedCamera, setSelectedCamera, startScan, stopScan } = useScanner(onDetected)

  return (
    <div style={s.overlay}>
      <div style={s.sheet}>
        {/* Handle */}
        <div style={s.handle} />

        <div style={s.header}>
          <h3 style={s.title}>Scan Barcode</h3>
          <button onClick={onCancel} style={s.closeBtn}><X size={20} /></button>
        </div>

        {cameras.length > 1 && (
          <div style={s.cameraRow}>
            <SwitchCamera size={16} color="#64748B" />
            <select value={selectedCamera || ''} onChange={e => setSelectedCamera(e.target.value)} style={s.select}>
              {cameras.map(c => (
                <option key={c.deviceId} value={c.deviceId}>
                  {c.label || `Kamera ${c.deviceId.slice(0, 6)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={s.viewfinder}>
          <video ref={videoRef} style={s.video} playsInline />
          {!scanning && (
            <div style={s.placeholder}>
              <Camera size={44} color="#CBD5E1" />
              <p style={{ color: '#94A3B8', fontSize: 14, marginTop: 8 }}>Kamera belum aktif</p>
            </div>
          )}
          {scanning && (
            <>
              <div style={s.corner1} /><div style={s.corner2} />
              <div style={s.corner3} /><div style={s.corner4} />
              <div style={s.scanLine} />
            </>
          )}
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginTop: 8 }}>
            <Camera size={16} />{error}
          </div>
        )}

        <p style={s.hint}>Arahkan ke barcode / QR produk</p>

        <div style={s.btnRow}>
          {!scanning ? (
            <button onClick={startScan} className="btn btn-primary btn-full">
              <Camera size={18} /> Mulai Scan
            </button>
          ) : (
            <button onClick={stopScan} className="btn btn-danger btn-full">
              <CameraOff size={18} /> Berhenti
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(15,23,42,0.6)',
    display: 'flex', alignItems: 'flex-end',
    zIndex: 1000,
    backdropFilter: 'blur(2px)',
  },
  sheet: {
    background: '#fff',
    borderRadius: '20px 20px 0 0',
    padding: '0 20px 32px',
    width: '100%',
    maxWidth: 520,
    margin: '0 auto',
    animation: 'fadeIn 0.2s ease',
  },
  handle: { width: 40, height: 4, background: '#E2E8F0', borderRadius: 4, margin: '12px auto 16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 700, color: '#0F172A' },
  closeBtn: { width: 32, height: 32, borderRadius: 8, border: 'none', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' },
  cameraRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  select: { flex: 1, padding: '7px 10px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#334155', background: '#fff' },
  viewfinder: {
    position: 'relative', background: '#0F172A',
    borderRadius: 14, overflow: 'hidden',
    height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  video: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 },
  scanLine: {
    position: 'absolute', left: '12%', right: '12%', height: 2,
    background: 'linear-gradient(90deg, transparent, #2563EB, transparent)',
    animation: 'scanLine 2s ease-in-out infinite',
    zIndex: 2,
  },
  corner1: { position: 'absolute', top: 16, left: 16, width: 24, height: 24, borderTop: '3px solid #2563EB', borderLeft: '3px solid #2563EB', borderRadius: '4px 0 0 0', zIndex: 2 },
  corner2: { position: 'absolute', top: 16, right: 16, width: 24, height: 24, borderTop: '3px solid #2563EB', borderRight: '3px solid #2563EB', borderRadius: '0 4px 0 0', zIndex: 2 },
  corner3: { position: 'absolute', bottom: 16, left: 16, width: 24, height: 24, borderBottom: '3px solid #2563EB', borderLeft: '3px solid #2563EB', borderRadius: '0 0 0 4px', zIndex: 2 },
  corner4: { position: 'absolute', bottom: 16, right: 16, width: 24, height: 24, borderBottom: '3px solid #2563EB', borderRight: '3px solid #2563EB', borderRadius: '0 0 4px 0', zIndex: 2 },
  hint: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: 14 },
  btnRow: { display: 'flex', flexDirection: 'column', gap: 8 },
}
