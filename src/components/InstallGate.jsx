import React, { useState, useEffect } from 'react'
import { Download, Share2, ArrowDown, Chrome, Monitor, Smartphone } from 'lucide-react'

function detectDevice() {
  const ua = navigator.userAgent
  const isIOS     = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
  const isAndroid = /Android/.test(ua)
  const isSafari  = /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua) && !/FxiOS/.test(ua)
  const isChrome  = /Chrome/.test(ua) && !/Edg/.test(ua) && !/OPR/.test(ua) && !/SamsungBrowser/.test(ua)
  const isEdge    = /Edg\//.test(ua)
  const isSamsung = /SamsungBrowser/.test(ua)

  if (isIOS) return isSafari ? 'ios-safari' : 'ios-other'
  if (isAndroid) {
    if (isSamsung) return 'android-samsung'
    if (isChrome)  return 'android-chrome'
    return 'android-other'
  }
  if (isChrome || isEdge) return 'desktop-chromium'
  return 'desktop-other'
}

const INSTRUCTIONS = {
  'ios-safari': {
    title: 'Install di iPhone / iPad',
    icon: '🍎',
    steps: [
      { n: 1, text: <>Tap ikon <Share2 size={14} style={{ verticalAlign: 'middle', color: '#2563EB' }} /> di toolbar bawah Safari</> },
      { n: 2, text: <>Gulir ke bawah, pilih <strong>"Add to Home Screen"</strong></> },
      { n: 3, text: <>Tap <strong>"Add"</strong> di kanan atas</> },
    ],
    note: null,
  },
  'ios-other': {
    title: 'Buka di Safari dulu',
    icon: '🧭',
    steps: [
      { n: 1, text: <>Browser ini tidak mendukung install di iOS</> },
      { n: 2, text: <>Salin URL lalu buka di <strong>Safari</strong></> },
      { n: 3, text: <>Tap Share → <strong>"Add to Home Screen"</strong></> },
    ],
    note: 'Install PWA di iPhone hanya bisa dari Safari.',
  },
  'android-chrome': {
    title: 'Install di Android',
    icon: '🤖',
    steps: null,
    note: null,
  },
  'android-samsung': {
    title: 'Install di Samsung Browser',
    icon: '📱',
    steps: [
      { n: 1, text: <>Tap ikon <strong>☰</strong> (menu) di kanan bawah</> },
      { n: 2, text: <>Pilih <strong>"Tambahkan halaman ke"</strong></> },
      { n: 3, text: <>Tap <strong>"Layar utama"</strong></> },
    ],
    note: null,
  },
  'android-other': {
    title: 'Install Aplikasi',
    icon: '📲',
    steps: [
      { n: 1, text: <>Tap menu <strong>⋮</strong> di pojok kanan atas</> },
      { n: 2, text: <>Pilih <strong>"Tambahkan ke layar utama"</strong></> },
    ],
    note: 'Untuk pengalaman terbaik, buka di Chrome.',
  },
  'desktop-chromium': {
    title: 'Install di Desktop',
    icon: '💻',
    steps: [
      { n: 1, text: <>Klik ikon <strong>⊕</strong> di ujung kanan address bar</> },
      { n: 2, text: <>Klik <strong>"Install"</strong> pada dialog yang muncul</> },
    ],
    note: null,
  },
  'desktop-other': {
    title: 'Gunakan Chrome atau Edge',
    icon: '🌐',
    steps: [
      { n: 1, text: <>Buka link ini di <strong>Chrome</strong> atau <strong>Edge</strong></> },
      { n: 2, text: <>Klik ikon install di address bar</> },
    ],
    note: 'Browser ini belum mendukung install PWA.',
  },
}

export default function InstallGate({ children }) {
  const [status, setStatus]                 = useState('loading')
  const [device, setDevice]                 = useState('')
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    if (standalone) { setStatus('ready'); return }

    setDevice(detectDevice())
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

  const info = INSTRUCTIONS[device] || INSTRUCTIONS['desktop-other']
  const showNativeBtn = (device === 'android-chrome' || device === 'desktop-chromium') && deferredPrompt

  return (
    <div style={s.overlay}>
      <div style={s.card}>
        <div style={s.appRow}>
          <img src="/favicon.svg" style={s.appIcon} alt="" />
          <div>
            <div style={s.appName}>Stok Gudang</div>
            <div style={s.appSub}>stok-barang-gudang.vercel.app</div>
          </div>
        </div>

        <div style={s.deviceBadge}>{info.icon} {info.title}</div>

        <p style={s.desc}>
          Install aplikasi ini ke layar utama untuk akses cepat dan tampilan penuh.
        </p>

        {showNativeBtn ? (
          <button onClick={handleInstall} style={s.installBtn}>
            <Download size={18} /> Install Sekarang
          </button>
        ) : info.steps ? (
          <div style={s.steps}>
            {info.steps.map(({ n, text }) => (
              <div key={n} style={s.step}>
                <span style={s.num}>{n}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        ) : null}

        {info.note && <p style={s.note}>{info.note}</p>}
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
    background: '#fff', borderRadius: 20, padding: '28px 24px',
    maxWidth: 360, width: '100%',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
  },
  appRow:   { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 },
  appIcon:  { width: 56, height: 56, borderRadius: 14, flexShrink: 0 },
  appName:  { fontSize: 17, fontWeight: 800, color: '#0F172A' },
  appSub:   { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  deviceBadge: {
    display: 'inline-block', background: '#EFF6FF', color: '#2563EB',
    fontSize: 13, fontWeight: 700, padding: '5px 12px', borderRadius: 99,
    marginBottom: 12,
  },
  desc: { fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 16 },
  installBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', padding: '14px 0', borderRadius: 12,
    background: '#2563EB', color: '#fff', border: 'none',
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  steps: { marginBottom: 4 },
  step:  { display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#334155', marginBottom: 10, lineHeight: 1.5 },
  num:   { flexShrink: 0, width: 22, height: 22, borderRadius: 99, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, marginTop: 1 },
  note:  { fontSize: 11, color: '#94A3B8', marginTop: 10, textAlign: 'center', lineHeight: 1.5 },
}
