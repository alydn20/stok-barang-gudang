const GAS_KEY = 'gas_url'

function getUrl() {
  return localStorage.getItem(GAS_KEY) || import.meta.env.VITE_GAS_URL || ''
}

async function callGAS(action, params = {}) {
  const url = getUrl()
  if (!url) throw new Error('GAS URL belum diset. Buka Settings dan masukkan URL Google Apps Script.')
  const qs = new URLSearchParams({ action, ...params })
  const res = await fetch(`${url}?${qs}`)
  if (!res.ok) throw new Error(`HTTP error ${res.status}`)
  return res.json()
}

async function postGAS(action, data) {
  const url = getUrl()
  if (!url) throw new Error('GAS URL belum diset. Buka Settings dan masukkan URL Google Apps Script.')
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
  getAllStock: () => callGAS('getAllStock'),
  getHistory: (barcode = '') => callGAS('getHistory', barcode ? { barcode } : {}),
  stockIn: (data) => postGAS('stockIn', data),
  stockOut: (data) => postGAS('stockOut', data),
  updateItem: (data) => postGAS('updateItem', data),
  addItem: (data) => postGAS('addItem', data),
}
