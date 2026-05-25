// GAS URL diambil dari server (/api/config) saat pertama kali dipakai
// Fallback ke build-time env var jika server tidak tersedia
let _url = null

async function getUrl() {
  if (_url) return _url
  try {
    const res = await fetch('/api/config')
    if (res.ok) {
      const data = await res.json()
      if (data.gasUrl) { _url = data.gasUrl; return _url }
    }
  } catch {}
  _url = import.meta.env.VITE_GAS_URL || ''
  return _url
}

async function callGAS(action, params = {}) {
  const url = await getUrl()
  if (!url) throw new Error('URL Google Apps Script belum dikonfigurasi. Buka halaman Setelan.')
  const res = await fetch(`${url}?${new URLSearchParams({ action, ...params })}`)
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res.json()
}

async function postGAS(action, data) {
  const url = await getUrl()
  if (!url) throw new Error('URL Google Apps Script belum dikonfigurasi. Buka halaman Setelan.')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...data }),
  })
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res.json()
}

export const sheetsApi = {
  searchByBarcode: (barcode) => callGAS('search', { barcode }),
  getAllStock:      ()        => callGAS('getAllStock'),
  getHistory:      (barcode = '') => callGAS('getHistory', barcode ? { barcode } : {}),
  stockIn:         (data)    => postGAS('stockIn', data),
  stockOut:        (data)    => postGAS('stockOut', data),
  updateItem:      (data)    => postGAS('updateItem', data),
  addItem:         (data)    => postGAS('addItem', data),

  // Reset cache supaya URL terbaru langsung dipakai setelah save
  resetCache: () => { _url = null },
}
