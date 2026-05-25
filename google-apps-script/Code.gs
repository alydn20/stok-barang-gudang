// ============================================================
// STOK GUDANG - Google Apps Script Backend
// Deploy sebagai Web App dengan akses: Anyone
// ============================================================

const SHEET_NAME_STOCK   = 'STOK'
const SHEET_NAME_HISTORY = 'RIWAYAT'

// Headers untuk setiap sheet
const STOCK_HEADERS   = ['barcode', 'nama', 'qty', 'exp', 'posisi', 'updatedAt']
const HISTORY_HEADERS = ['tanggal', 'tipe', 'barcode', 'nama', 'qty', 'exp', 'posisi', 'catatan']

function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(name)
  if (!sheet) {
    sheet = ss.insertSheet(name)
    sheet.appendRow(headers)
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1976d2').setFontColor('#ffffff')
    sheet.setFrozenRows(1)
  }
  return sheet
}

function doGet(e) {
  const action = e.parameter.action
  try {
    let result
    if      (action === 'ping')         result = { status: 'ok' }
    else if (action === 'search')       result = searchByBarcode(e.parameter.barcode)
    else if (action === 'getAllStock')   result = getAllStock()
    else if (action === 'getHistory')   result = getHistory(e.parameter.barcode)
    else                                result = { error: 'Unknown action' }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)
    const action = data.action
    let result
    if      (action === 'stockIn')    result = stockIn(data)
    else if (action === 'stockOut')   result = stockOut(data)
    else if (action === 'addItem')    result = addItem(data)
    else if (action === 'updateItem') result = updateItem(data)
    else                              result = { error: 'Unknown action' }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

// ---- STOCK ----

function searchByBarcode(barcode) {
  if (!barcode) return { found: false }
  const sheet = getOrCreateSheet(SHEET_NAME_STOCK, STOCK_HEADERS)
  const data  = sheet.getDataRange().getValues()
  const headers = data[0]
  for (let i = 1; i < data.length; i++) {
    const row = rowToObj(data[i], headers)
    if (String(row.barcode).trim() === String(barcode).trim()) {
      return { found: true, ...row }
    }
  }
  return { found: false }
}

function getAllStock() {
  const sheet = getOrCreateSheet(SHEET_NAME_STOCK, STOCK_HEADERS)
  const data  = sheet.getDataRange().getValues()
  if (data.length <= 1) return { items: [] }
  const headers = data[0]
  const items = data.slice(1).map(row => rowToObj(row, headers))
  return { items }
}

function stockIn(data) {
  const { barcode, nama, qty, exp, posisi, catatan, tanggal } = data
  const sheet = getOrCreateSheet(SHEET_NAME_STOCK, STOCK_HEADERS)
  const rows  = sheet.getDataRange().getValues()
  const headers = rows[0]
  let found = false

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(barcode).trim()) {
      const newQty = Number(rows[i][2]) + Number(qty)
      sheet.getRange(i + 1, 3).setValue(newQty)                          // qty
      if (exp)    sheet.getRange(i + 1, 4).setValue(exp)                  // exp
      if (posisi) sheet.getRange(i + 1, 5).setValue(posisi)               // posisi
      sheet.getRange(i + 1, 6).setValue(new Date().toISOString())         // updatedAt
      found = true
      break
    }
  }

  if (!found) {
    sheet.appendRow([barcode, nama, Number(qty), exp || '', posisi || '', new Date().toISOString()])
  }

  // Catat riwayat
  logHistory('MASUK', barcode, nama, qty, exp, posisi, catatan, tanggal)
  return { success: true }
}

function stockOut(data) {
  const { barcode, qty, catatan, tanggal } = data
  const sheet = getOrCreateSheet(SHEET_NAME_STOCK, STOCK_HEADERS)
  const rows  = sheet.getDataRange().getValues()

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(barcode).trim()) {
      const currentQty = Number(rows[i][2])
      const outQty     = Number(qty)
      if (outQty > currentQty) return { success: false, error: 'Stok tidak cukup' }
      sheet.getRange(i + 1, 3).setValue(currentQty - outQty)
      sheet.getRange(i + 1, 6).setValue(new Date().toISOString())
      logHistory('KELUAR', rows[i][0], rows[i][1], qty, rows[i][3], rows[i][4], catatan, tanggal)
      return { success: true }
    }
  }
  return { success: false, error: 'Barang tidak ditemukan' }
}

function addItem(data) {
  const { barcode, nama, qty, exp, posisi } = data
  const sheet = getOrCreateSheet(SHEET_NAME_STOCK, STOCK_HEADERS)
  sheet.appendRow([barcode, nama, Number(qty) || 0, exp || '', posisi || '', new Date().toISOString()])
  return { success: true }
}

function updateItem(data) {
  const { barcode, nama, posisi, exp } = data
  const sheet = getOrCreateSheet(SHEET_NAME_STOCK, STOCK_HEADERS)
  const rows  = sheet.getDataRange().getValues()
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(barcode).trim()) {
      if (nama)   sheet.getRange(i + 1, 2).setValue(nama)
      if (exp)    sheet.getRange(i + 1, 4).setValue(exp)
      if (posisi) sheet.getRange(i + 1, 5).setValue(posisi)
      sheet.getRange(i + 1, 6).setValue(new Date().toISOString())
      return { success: true }
    }
  }
  return { success: false, error: 'Barang tidak ditemukan' }
}

// ---- HISTORY ----

function getHistory(barcode) {
  const sheet = getOrCreateSheet(SHEET_NAME_HISTORY, HISTORY_HEADERS)
  const data  = sheet.getDataRange().getValues()
  if (data.length <= 1) return { history: [] }
  const headers = data[0]
  let rows = data.slice(1).map(row => rowToObj(row, headers)).reverse() // newest first
  if (barcode) rows = rows.filter(r => String(r.barcode).trim() === String(barcode).trim())
  return { history: rows.slice(0, 50) }
}

function logHistory(tipe, barcode, nama, qty, exp, posisi, catatan, tanggal) {
  const sheet = getOrCreateSheet(SHEET_NAME_HISTORY, HISTORY_HEADERS)
  sheet.appendRow([
    tanggal || new Date().toISOString(),
    tipe, barcode, nama, qty, exp || '', posisi || '', catatan || ''
  ])
}

// ---- UTIL ----

function rowToObj(row, headers) {
  const obj = {}
  headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? String(row[i]) : '' })
  return obj
}
