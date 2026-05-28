// Stok Barang (By Aliyudin) — v5
const CACHE = 'stok-barang-v5'

self.addEventListener('install', () => { /* tunggu perintah SKIP_WAITING dari user */ })

self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
))

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
})

// Terima perintah dari UpdateGate untuk aktifkan versi baru
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
