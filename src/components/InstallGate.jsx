import React, { useState, useEffect } from 'react'
import { Download, Share2, ArrowDown } from 'lucide-react'

export default function InstallGate({ children }) {
  const [status, setStatus]                 = useState('loading')
  const [isIOS, setIsIOS]                   = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (standalone) { setStatus('ready'); return }

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)
    setStatus('gate')

    const onPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', () => setStatus('ready'))
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setStatus('ready')
  }

  if (status === 'loading' || status === 'ready') return children

  return (
    <div style={s.overlay}>
      <div style={s.card}>
        <img src="/favicon.svg" style={s.icon} alt="Stok Gudang" />
        <h1 style={s.name}>Stok Gudang</h1>
        <p style={s.desc}>
          Install aplikasi ini ke layar utama HP kamu untuk akses cepat dan tampilan penuh tanpa browser bar.
        </p>

        {isIOS ? (
          <div style={s.steps}>
            <div style={s.step}>
              <span style={s.num}>1</span>
              <span>Tap ikon <Share2 size={14} style={{ verticalAlign: 'middle' }} /> di toolbar bawah Safari</span>
            </div>
            <div style={s.step}>
              <span style={s.num}>2</span>
              <span>Pilih <strong>"Tambahkan ke Layar Utama"</strong></span>
            </div>
            <div style={s.step}>
              <span style={s.num}>3</span>
              <span>Tap <strong>"Tambahkan"</strong></span>
            </div>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <ArrowDown size={22} color="#2563EB" />
            </div>
          </div>
        ) : deferredPrompt ? (
          <button onClick={handleInstall} style={s.installBtn}>
            <Download size={18} /> Install Sekarang
          </button>
        ) : (
          <div style={s.steps}>
            <div style={s.step}>
              <span style={s.num}>1</span>
              <span>Tap menu <strong>⋮</strong> di sudut kanan atas browser</span>
            </div>
            <div style={s.step}>
              <span style={s.num}>2</span>
              <span>Pilih <strong>"Tambahkan ke layar utama"</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(15,23,42,0.92)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  card: {
    background: '#fff', borderRadius: 20, padding: '32px 24px',
    maxWidth: 360, width: '100%', textAlign: 'center',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
  },
  icon:       { width: 80, height: 80, borderRadius: 18, marginBottom: 14 },
  name:       { fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 8 },
  desc:       { fontSize: 14, color: '#64748B', lineHeight: 1.65, marginBottom: 20 },
  installBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', padding: '14px 0', borderRadius: 12,
    background: '#2563EB', color: '#fff', border: 'none',
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  steps: { textAlign: 'left', marginBottom: 4 },
  step:  { display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#334155', marginBottom: 10, lineHeight: 1.5 },
  num:   { flexShrink: 0, width: 22, height: 22, borderRadius: 99, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, marginTop: 1 },
}
