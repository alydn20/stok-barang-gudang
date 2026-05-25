import React, { useState, useEffect } from 'react'
import { Download, Share2, ChevronRight, Smartphone, Monitor, ArrowDown } from 'lucide-react'

function detectDevice() {
  const ua = navigator.userAgent
  const isIOS     = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
  const isAndroid = /Android/.test(ua)
  const isSafari  = /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua) && !/FxiOS/.test(ua)
  const isChrome  = /Chrome/.test(ua) && !/Edg/.test(ua) && !/OPR/.test(ua) && !/SamsungBrowser/.test(ua)
  const isEdge    = /Edg\//.test(ua)
  const isSamsung = /SamsungBrowser/.test(ua)
  const isFirefox = /Firefox/.test(ua) || /FxiOS/.test(ua)
  const isOpera   = /OPR\//.test(ua) || /Opera/.test(ua)

  if (isIOS) {
    if (isSafari)  return 'ios-safari'
    if (isChrome)  return 'ios-chrome'
    if (isFirefox) return 'ios-firefox'
    return 'ios-other'
  }
  if (isAndroid) {
    if (isSamsung) return 'android-samsung'
    if (isChrome)  return 'android-chrome'
    if (isFirefox) return 'android-firefox'
    if (isOpera)   return 'android-opera'
    return 'android-other'
  }
  if (isEdge)    return 'desktop-edge'
  if (isChrome)  return 'desktop-chrome'
  if (isFirefox) return 'desktop-firefox'
  if (isSafari)  return 'desktop-safari'
  return 'desktop-other'
}

const GUIDES = {
  'android-chrome': {
    badge: '🤖 Android · Chrome',
    title: 'Install Stok Gudang',
    native: true,
    steps: [
      { icon: '⬇️', text: 'Tap tombol **Install Sekarang** di bawah', sub: 'Atau tap ikon ⊕ di address bar Chrome' },
      { icon: '✅', text: 'Tap **Install** pada dialog konfirmasi', sub: 'App akan otomatis tersimpan di layar utama' },
      { icon: '🚀', text: 'Buka dari layar utama HP kamu', sub: 'Ikon Stok Gudang akan muncul seperti app biasa' },
    ],
  },
  'android-samsung': {
    badge: '📱 Android · Samsung Browser',
    title: 'Install di Samsung Browser',
    native: false,
    steps: [
      { icon: '☰', text: 'Tap ikon **☰** (tiga garis) di kanan bawah', sub: 'Menu utama Samsung Browser' },
      { icon: '📌', text: 'Pilih **"Tambahkan halaman ke"**', sub: 'Ada di bagian tengah menu' },
      { icon: '🏠', text: 'Pilih **"Layar Utama"**', sub: 'Bukan "Bookmark" atau "Favorit"' },
      { icon: '✅', text: 'Tap **"Tambahkan"** untuk konfirmasi', sub: 'Ikon akan muncul di home screen' },
    ],
  },
  'android-firefox': {
    badge: '🦊 Android · Firefox',
    title: 'Install di Firefox Android',
    native: false,
    steps: [
      { icon: '⋮', text: 'Tap ikon **⋮** (tiga titik) di kanan atas', sub: 'Menu utama Firefox' },
      { icon: '📲', text: 'Pilih **"Install"** atau **"Add to Home Screen"**', sub: 'Firefox mendukung PWA di beberapa versi' },
      { icon: '💡', text: 'Tidak ada opsi install? Pakai **Chrome**', sub: 'Salin URL → buka di Chrome untuk install' },
    ],
    note: 'Untuk pengalaman terbaik, buka di Chrome.',
  },
  'android-opera': {
    badge: '🎭 Android · Opera',
    title: 'Install di Opera Android',
    native: false,
    steps: [
      { icon: '⊕', text: 'Tap ikon **+** atau **⋮** di browser', sub: 'Cari opsi "Add to phone" atau "Home screen"' },
      { icon: '🏠', text: 'Pilih **"Add to Home Screen"**', sub: 'Konfirmasi nama app' },
      { icon: '💡', text: 'Lebih mudah? Pakai **Chrome**', sub: 'Salin URL → buka di Chrome untuk install cepat' },
    ],
  },
  'android-other': {
    badge: '📲 Android',
    title: 'Install di Android',
    native: false,
    steps: [
      { icon: '⋮', text: 'Tap menu **⋮** atau **⚙️** di browser kamu', sub: 'Biasanya di sudut kanan atas' },
      { icon: '🏠', text: 'Cari opsi **"Add to Home Screen"** atau **"Install"**', sub: 'Mungkin ada di sub-menu "More tools"' },
      { icon: '✅', text: 'Konfirmasi dan **Tambahkan**', sub: 'Ikon akan muncul di layar utama' },
      { icon: '💡', text: 'Tidak ketemu? Buka di **Chrome**', sub: 'Chrome punya tombol install otomatis' },
    ],
  },
  'ios-safari': {
    badge: '🍎 iPhone / iPad · Safari',
    title: 'Install di iPhone / iPad',
    native: false,
    steps: [
      { icon: '↑', text: 'Tap ikon **Share** (kotak dengan panah ke atas)', sub: 'Ada di toolbar bawah Safari — tengah bawah' },
      { icon: '📲', text: 'Gulir ke bawah, tap **"Add to Home Screen"**', sub: 'Atau "Tambahkan ke Layar Utama" (Bahasa Indonesia)' },
      { icon: '✏️', text: 'Edit nama jika perlu, lalu tap **"Add"**', sub: 'Pojok kanan atas layar' },
      { icon: '🚀', text: 'Buka dari layar utama iPhone kamu', sub: 'Stok Gudang akan muncul seperti app biasa' },
    ],
    note: 'Pastikan menggunakan Safari. Browser lain di iPhone tidak bisa install PWA.',
  },
  'ios-chrome': {
    badge: '🍎 iPhone · Chrome',
    title: 'Chrome di iPhone tidak bisa install',
    native: false,
    steps: [
      { icon: '📋', text: 'Salin URL ini: **stok-barang-gudang.vercel.app**', sub: 'Tap & tahan di address bar → Copy' },
      { icon: '🧭', text: 'Buka **Safari** (app warna kompas biru)', sub: 'Safari sudah terinstall di setiap iPhone' },
      { icon: '📌', text: 'Paste URL di Safari dan buka situsnya', sub: 'Tap address bar → Paste → Enter' },
      { icon: '↑', text: 'Tap Share → **"Add to Home Screen"**', sub: 'Lanjut dari sini untuk install' },
    ],
    note: 'Apple hanya mengizinkan install PWA melalui Safari.',
  },
  'ios-firefox': {
    badge: '🍎 iPhone · Firefox',
    title: 'Firefox di iPhone tidak bisa install',
    native: false,
    steps: [
      { icon: '📋', text: 'Salin URL: **stok-barang-gudang.vercel.app**', sub: '' },
      { icon: '🧭', text: 'Buka **Safari** di iPhone kamu', sub: 'App bawaan iOS — ikon kompas biru' },
      { icon: '↑', text: 'Tap Share → **"Add to Home Screen"**', sub: 'Install dari Safari' },
    ],
    note: 'Install PWA di iPhone hanya bisa dari Safari.',
  },
  'ios-other': {
    badge: '🍎 iPhone · Browser lain',
    title: 'Gunakan Safari untuk install',
    native: false,
    steps: [
      { icon: '🧭', text: 'Buka **Safari** di iPhone kamu', sub: 'Ikon kompas biru, app bawaan iOS' },
      { icon: '🔗', text: 'Buka **stok-barang-gudang.vercel.app**', sub: '' },
      { icon: '↑', text: 'Tap ikon Share → **"Add to Home Screen"**', sub: 'Lalu tap Add untuk konfirmasi' },
    ],
    note: 'Apple hanya mengizinkan install PWA melalui Safari.',
  },
  'desktop-chrome': {
    badge: '💻 Desktop · Chrome',
    title: 'Install di Chrome',
    native: true,
    steps: [
      { icon: '⊕', text: 'Klik ikon **⊕** di ujung kanan address bar', sub: 'Ikon install — muncul otomatis jika belum install' },
      { icon: '📲', text: 'Klik **"Install Stok Gudang"**', sub: 'Dialog konfirmasi akan muncul' },
      { icon: '🚀', text: 'App terbuka di jendela sendiri', sub: 'Shortcut juga tersimpan di taskbar & desktop' },
    ],
    note: 'Atau klik tombol Install di bawah jika tersedia.',
  },
  'desktop-edge': {
    badge: '💻 Desktop · Edge',
    title: 'Install di Microsoft Edge',
    native: true,
    steps: [
      { icon: '⊕', text: 'Klik ikon **⊕** di address bar Edge', sub: 'Kanan address bar — "App available"' },
      { icon: '📲', text: 'Klik **"Install"**', sub: 'Konfirmasi install Stok Gudang' },
      { icon: '🚀', text: 'App tersimpan di Start Menu & Taskbar', sub: '' },
    ],
    note: 'Atau gunakan menu ··· → Apps → Install this site as an app.',
  },
  'desktop-firefox': {
    badge: '💻 Desktop · Firefox',
    title: 'Firefox belum support install PWA',
    native: false,
    steps: [
      { icon: '🌐', text: 'Buka di **Google Chrome** atau **Microsoft Edge**', sub: 'Salin URL lalu paste di Chrome/Edge' },
      { icon: '⊕', text: 'Klik ikon install di address bar', sub: 'Akan muncul di pojok kanan address bar' },
      { icon: '✅', text: 'Klik **Install** untuk konfirmasi', sub: '' },
    ],
    note: 'Firefox desktop belum mendukung fitur install PWA secara penuh.',
  },
  'desktop-safari': {
    badge: '💻 Desktop · Safari (Mac)',
    title: 'Install di Safari Mac',
    native: false,
    steps: [
      { icon: '📂', text: 'Klik menu **File** di menu bar Mac', sub: '' },
      { icon: '📲', text: 'Pilih **"Add to Dock"** (macOS Sonoma+)', sub: 'Atau "Add to Home Screen"' },
      { icon: '🚀', text: 'App tersimpan di Dock Mac kamu', sub: '' },
    ],
    note: 'Butuh macOS Sonoma (14) atau lebih baru.',
  },
  'desktop-other': {
    badge: '💻 Desktop · Browser lain',
    title: 'Gunakan Chrome atau Edge',
    native: false,
    steps: [
      { icon: '🌐', text: 'Buka **Chrome** atau **Edge** di komputer kamu', sub: '' },
      { icon: '🔗', text: 'Buka **stok-barang-gudang.vercel.app**', sub: '' },
      { icon: '⊕', text: 'Klik ikon install di address bar', sub: 'Lalu klik Install' },
    ],
    note: 'Browser lain belum mendukung install PWA.',
  },
}

function renderText(text) {
  const parts = text.split(/\*\*(.*?)\*\*/)
  return parts.map((p, i) => i % 2 === 1 ? <strong key={i}>{p}</strong> : p)
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

  const guide = GUIDES[device] || GUIDES['desktop-other']
  const showInstallBtn = guide.native && deferredPrompt

  return (
    <div style={s.overlay}>
      <div style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <img src="/favicon.svg" style={s.appIcon} alt="" />
          <div>
            <div style={s.appName}>Stok Gudang</div>
            <div style={s.appUrl}>stok-barang-gudang.vercel.app</div>
          </div>
        </div>

        {/* Device badge */}
        <div style={s.badge}>{guide.badge}</div>

        <h2 style={s.title}>{guide.title}</h2>

        {/* Steps */}
        <div style={s.steps}>
          {guide.steps.map(({ icon, text, sub }, i) => (
            <div key={i} style={s.step}>
              <div style={s.stepIcon}>{icon}</div>
              <div style={s.stepBody}>
                <div style={s.stepText}>{renderText(text)}</div>
                {sub && <div style={s.stepSub}>{sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Install button for Android Chrome / Desktop */}
        {showInstallBtn && (
          <button onClick={handleInstall} style={s.installBtn}>
            <Download size={17} /> Install Sekarang
          </button>
        )}

        {/* Note */}
        {guide.note && <div style={s.note}>ℹ️ {guide.note}</div>}
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(15,23,42,0.93)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
    overflowY: 'auto',
  },
  card: {
    background: '#fff', borderRadius: 20, padding: '24px 20px',
    maxWidth: 380, width: '100%',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
    margin: 'auto',
  },
  header:  { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  appIcon: { width: 52, height: 52, borderRadius: 12, flexShrink: 0 },
  appName: { fontSize: 16, fontWeight: 800, color: '#0F172A' },
  appUrl:  { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  badge: {
    display: 'inline-block', background: '#F1F5F9', color: '#475569',
    fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99,
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 },
  steps: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 },
  step:  { display: 'flex', alignItems: 'flex-start', gap: 12 },
  stepIcon: {
    flexShrink: 0, width: 34, height: 34, borderRadius: 10,
    background: '#EFF6FF', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 16,
  },
  stepBody: { paddingTop: 2 },
  stepText: { fontSize: 13, color: '#1E293B', lineHeight: 1.5 },
  stepSub:  { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  installBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', padding: '13px 0', borderRadius: 12,
    background: '#2563EB', color: '#fff', border: 'none',
    fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12,
  },
  note: {
    background: '#F8FAFC', borderRadius: 10, padding: '10px 12px',
    fontSize: 12, color: '#64748B', lineHeight: 1.6,
  },
}
