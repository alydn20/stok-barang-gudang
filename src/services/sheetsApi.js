// Prioritas URL: 1) Vercel KV (/api/config)  2) localStorage  3) env var
const LS_KEY = 'gas_url'
let _url = null

async function getUrl() {
  if (_url) return _url

  // 1. Coba dari server (Vercel KV)
  try {
    const res = await fetch('/api/config')
    if (res.ok) {
      const data = await res.json()
      if (data.gasUrl) { _url = data.gasUrl; return _url }
    }
  } catch {}

  // 2. Fallback localStorage
  const local = localStorage.getItem(LS_KEY)
  if (local) { _url = local; return _url }

  // 3. Fallback build-time env var
  _url = import.meta.env.VITE_GAS_URL || ''
  return _url
}

async function callGAS(action, params = {}) {
  const url = await getUrl()
  if (!url) throw new Error('URL belum dikonfigurasi. Buka halaman Setelan.')
  const res = await fetch(`/api/gas?${new URLSearchParams({ _url: url, action, ...params })}`)
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res.json()
}

async function postGAS(action, data) {
  const url = await getUrl()
  if (!url) throw new Error('URL belum dikonfigurasi. Buka halaman Setelan.')
  const res = await fetch('/api/gas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ _url: url, action, ...data }),
  })
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res.json()
}

export const sheetsApi = {
  searchByBarcode: (barcode)      => callGAS('search', { barcode }),
  getAllStock:      ()             => callGAS('getAllStock'),
  getHistory:      (barcode = '') => callGAS('getHistory', barcode ? { barcode } : {}),
  getStats:        ()             => callGAS('getStats'),
  stockIn:         (data)         => postGAS('stockIn', data),
  stockOut:        (data)         => postGAS('stockOut', data),
  updateItem:      (data)         => postGAS('updateItem', data),
  addItem:         (data)         => postGAS('addItem', data),
  deleteItem:      (data)         => postGAS('deleteItem', data),
  resetCache:      ()             => { _url = null },
}
