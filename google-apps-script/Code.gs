// ============================================================
// STOK GUDANG — Google Apps Script Backend
// Sheet: Master_Stok | Barang_Masuk | Barang_Keluar
//
// Master_Stok kolom:
//   A: Kode    B: Nama    C: Stok Awal
//   D: Total Masuk (SUMIF)   E: Total Keluar (SUMIF)
//   F: Stok Akhir (formula)  G: Kadaluarsa   H: Posisi Rak
// ============================================================

const SHEET_MASTER = 'Master_Stok'
const SHEET_MASUK  = 'Barang_Masuk'
const SHEET_KELUAR = 'Barang_Keluar'

// ---- ROUTER ----

function doGet(e) {
  const action = e.parameter.action
  try {
    let result
    if      (action === 'ping')       result = { status: 'ok' }
    else if (action === 'search')     result = searchByBarcode(e.parameter.barcode)
    else if (action === 'getAllStock') result = getAllStock()
    else if (action === 'getHistory') result = getHistory(e.parameter.barcode)
    else                              result = { error: 'Unknown action: ' + action }
    return jsonResponse(result)
  } catch (err) {
    return jsonResponse({ error: err.message })
  }
}

function doPost(e) {
  try {
    const data   = JSON.parse(e.postData.contents)
    const action = data.action
    let result
    if      (action === 'stockIn')    result = stockIn(data)
    else if (action === 'stockOut')   result = stockOut(data)
    else if (action === 'updateItem') result = updateItem(data)
    else if (action === 'addItem')    result = addItem(data)
    else                              result = { error: 'Unknown action: ' + action }
    return jsonResponse(result)
  } catch (err) {
    return jsonResponse({ error: err.message })
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}

// ---- SEARCH ----

function searchByBarcode(barcode) {
  if (!barcode) return { found: false }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MASTER)
  if (!sheet || sheet.getLastRow() < 2) return { found: false }

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues()
  for (const r of data) {
    if (r[0].toString().trim() === barcode.toString().trim()) {
      return {
        found:   true,
        barcode: r[0].toString(),
        nama:    r[1].toString(),
        qty:     r[5].toString(),   // kolom F: Stok Akhir (hasil formula)
        exp:     r[6] ? formatTgl(r[6]) : '',
        posisi:  r[7].toString(),
      }
    }
  }
  return { found: false }
}

// ---- ALL STOCK ----

function getAllStock() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MASTER)
  if (!sheet || sheet.getLastRow() < 2) return { items: [] }

  const data  = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues()
  const items = data
    .filter(r => r[0])
    .map(r => ({
      barcode: r[0].toString(),
      nama:    r[1].toString(),
      qty:     r[5].toString(),
      exp:     r[6] ? formatTgl(r[6]) : '',
      posisi:  r[7].toString(),
    }))
  return { items }
}

// ---- HISTORY ----

function getHistory(barcode) {
  const ss       = SpreadsheetApp.getActiveSpreadsheet()
  const sheetIn  = ss.getSheetByName(SHEET_MASUK)
  const sheetOut = ss.getSheetByName(SHEET_KELUAR)
  const history  = []

  if (sheetIn && sheetIn.getLastRow() > 1) {
    sheetIn.getRange(2, 1, sheetIn.getLastRow() - 1, 5).getValues()
      .filter(r => !barcode || r[1].toString().trim() === barcode.toString().trim())
      .forEach(r => history.push({
        tanggal: r[0] ? new Date(r[0]).toISOString() : '',
        tipe: 'MASUK', barcode: r[1].toString(),
        nama: r[2].toString(), qty: r[3].toString(), catatan: r[4].toString(),
      }))
  }

  if (sheetOut && sheetOut.getLastRow() > 1) {
    sheetOut.getRange(2, 1, sheetOut.getLastRow() - 1, 5).getValues()
      .filter(r => !barcode || r[1].toString().trim() === barcode.toString().trim())
      .forEach(r => history.push({
        tanggal: r[0] ? new Date(r[0]).toISOString() : '',
        tipe: 'KELUAR', barcode: r[1].toString(),
        nama: r[2].toString(), qty: r[3].toString(), catatan: r[4].toString(),
      }))
  }

  history.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
  return { history: history.slice(0, 50) }
}

// ---- STOCK IN ----

function stockIn(data) {
  const { barcode, nama, qty, exp, posisi, catatan, tanggal } = data
  const ss      = SpreadsheetApp.getActiveSpreadsheet()
  const sheetIn = ss.getSheetByName(SHEET_MASUK)
  if (!sheetIn) return { success: false, error: 'Sheet Barang_Masuk tidak ditemukan.' }

  sheetIn.appendRow([
    tanggal ? new Date(tanggal) : new Date(),
    barcode, nama || '', Number(qty) || 0, catatan || ''
  ])

  // Update atau daftarkan barang di Master_Stok
  upsertMaster(barcode, nama, exp, posisi)
  return { success: true }
}

// ---- STOCK OUT ----

function stockOut(data) {
  const { barcode, qty, catatan, tanggal } = data
  const ss       = SpreadsheetApp.getActiveSpreadsheet()
  const sheetOut = ss.getSheetByName(SHEET_KELUAR)
  if (!sheetOut) return { success: false, error: 'Sheet Barang_Keluar tidak ditemukan.' }

  // Cek stok aktual
  const info = searchByBarcode(barcode)
  if (info.found && Number(info.qty) < Number(qty)) {
    return { success: false, error: `Stok tidak cukup. Tersedia: ${info.qty} pcs.` }
  }

  sheetOut.appendRow([
    tanggal ? new Date(tanggal) : new Date(),
    barcode, info.nama || '', Number(qty) || 0, catatan || ''
  ])
  return { success: true }
}

// ---- UPDATE / ADD ITEM ----

function updateItem(data) { return upsertMaster(data.barcode, data.nama, data.exp, data.posisi) }
function addItem(data)    { return upsertMaster(data.barcode, data.nama || 'BARANG BARU', data.exp, data.posisi, Number(data.qty) || 0) }

// ---- UPSERT MASTER STOK ----

function upsertMaster(barcode, nama, exp, posisi, stokAwal) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MASTER)
  if (!sheet) return { success: false, error: 'Master_Stok tidak ditemukan.' }

  const lastRow = sheet.getLastRow()

  // Cari baris yang ada
  if (lastRow > 1) {
    const kodes = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
    for (let i = 0; i < kodes.length; i++) {
      if (kodes[i][0].toString().trim() === barcode.toString().trim()) {
        const row = i + 2
        if (nama)   sheet.getRange(row, 2).setValue(nama)
        if (exp)    sheet.getRange(row, 7).setValue(exp)
        if (posisi) sheet.getRange(row, 8).setValue(posisi)
        return { success: true }
      }
    }
  }

  // Barang baru — tambah baris + pasang formula SUMIF
  const nextRow = sheet.getLastRow() + 1
  sheet.appendRow([
    barcode, nama || 'BARANG BARU', stokAwal !== undefined ? stokAwal : 0,
    '', '', '', exp || '', posisi || ''
  ])
  sheet.getRange(nextRow, 4).setFormula(`=SUMIF(${SHEET_MASUK}!B:B,A${nextRow},${SHEET_MASUK}!D:D)`)
  sheet.getRange(nextRow, 5).setFormula(`=SUMIF(${SHEET_KELUAR}!B:B,A${nextRow},${SHEET_KELUAR}!D:D)`)
  sheet.getRange(nextRow, 6).setFormula(`=C${nextRow}+D${nextRow}-E${nextRow}`)

  return { success: true }
}

// ---- UTIL ----

function formatTgl(val) {
  try {
    return Utilities.formatDate(new Date(val), Session.getScriptTimeZone(), 'yyyy-MM-dd')
  } catch { return val.toString() }
}
