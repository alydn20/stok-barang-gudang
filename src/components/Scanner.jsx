import React from 'react'
import { useScanner } from '../hooks/useScanner'
import { Camera, CameraOff, RefreshCw } from 'lucide-react'

export default function Scanner({ onDetected, onCancel }) {
  const { videoRef, scanning, error, cameras, selectedCamera, setSelectedCamera, startScan, stopScan } = useScanner(onDetected)

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <h3 style={styles.title}>Scan Barcode</h3>

        {cameras.length > 1 && (
          <select
            value={selectedCamera || ''}
            onChange={(e) => setSelectedCamera(e.target.value)}
            style={styles.select}
          >
            {cameras.map(c => (
              <option key={c.deviceId} value={c.deviceId}>{c.label || `Kamera ${c.deviceId.slice(0,8)}`}</option>
            ))}
          </select>
        )}

        <div style={styles.videoWrapper}>
          <video ref={videoRef} style={styles.video} />
          {!scanning && (
            <div style={styles.placeholder}>
              <Camera size={48} color="#888" />
              <p style={{ color: '#888', marginTop: 8 }}>Kamera belum aktif</p>
            </div>
          )}
          {scanning && <div style={styles.scanLine} />}
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.btnRow}>
          {!scanning ? (
            <button onClick={startScan} style={styles.btnPrimary}>
              <Camera size={18} /> Mulai Scan
            </button>
          ) : (
            <button onClick={stopScan} style={styles.btnDanger}>
              <CameraOff size={18} /> Stop
            </button>
          )}
          <button onClick={onCancel} style={styles.btnSecondary}>Batal</button>
        </div>

        <p style={styles.hint}>Arahkan kamera ke barcode produk</p>
      </div>
    </div>
  )
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  container: { background: '#fff', borderRadius: 16, padding: 24, width: '90%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 12 },
  title: { textAlign: 'center', fontSize: 18, fontWeight: 700 },
  select: { padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 },
  videoWrapper: { position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: { position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  scanLine: { position: 'absolute', left: '10%', right: '10%', height: 2, background: '#00e676', boxShadow: '0 0 8px #00e676', animation: 'scan 2s linear infinite', top: '50%' },
  btnRow: { display: 'flex', gap: 8 },
  btnPrimary: { flex: 1, padding: '10px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnDanger: { flex: 1, padding: '10px 16px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnSecondary: { flex: 1, padding: '10px 16px', background: '#eee', color: '#333', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' },
  error: { color: '#e53935', fontSize: 13, textAlign: 'center' },
  hint: { color: '#888', fontSize: 12, textAlign: 'center' },
}
