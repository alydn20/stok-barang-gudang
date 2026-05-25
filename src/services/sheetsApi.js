// URL bersumber dari environment variable Vercel (VITE_GAS_URL)
// Semua device otomatis pakai URL yang sama tanpa konfigurasi per-browser
const GAS_URL = import.meta.env.VITE_GAS_URL || ''

async function callGAS(action, params = {}) {
  if (!GAS_URL) throw new Error('GAS_URL belum dikonfigurasi. Hubungi admin.')
  const qs = new URLSearchParams({ action, ...params })
  const res = await fetch(`${GAS_URL}?${qs}`)
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res.json()
}

async function postGAS(action, data) {
  if (!GAS_URL) throw new Error('GAS_URL belum dikonfigurasi. Hubungi admin.')
  const res = await fetch(GAS_URL, {
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

  isConfigured: () => Boolean(GAS_URL),
}
