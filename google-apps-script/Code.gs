// ============================================================
// STOK GUDANG — Google Apps Script Backend
// Sheet: Master_Stok | Barang_Masuk | Barang_Keluar
//
// Master_Stok kolom:
//   A: Kode    B: Nama    C: Stok Awal
//   D: (kosong)  E: (kosong)  F: (kosong)
//   G: Kadaluarsa   H: Posisi Rak   I: Kategori
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
    else if (action === 'getStats')   result = getStats()
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
    else if (action === 'deleteItem') result = deleteItem(data)
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

// ---- HELPER: hitung total per barcode dari sheet transaksi ----

function _sumByBarcode(sheet) {
  const result = {}
  if (!sheet || sheet.getLastRow() < 2) return result
  sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues()
    .forEach(r => {
      const bc = r[1].toString().trim()
      if (bc) result[bc] = (result[bc] || 0) + (Number(r[3]) || 0)
    })
  return result
}

// ---- SEARCH ----

function searchByBarcode(barcode) {
  if (!barcode) return { found: false }
  const ss     = SpreadsheetApp.getActiveSpreadsheet()
  const sheet  = ss.getSheetByName(SHEET_MASTER)
  if (!sheet || sheet.getLastRow() < 2) return { found: false }

  const totMasuk  = _sumByBarcode(ss.getSheetByName(SHEET_MASUK))
  const totKeluar = _sumByBarcode(ss.getSheetByName(SHEET_KELUAR))

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues()
  for (const r of data) {
    if (r[0].toString().trim() === barcode.toString().trim()) {
      const bc  = r[0].toString()
      const qty = (Number(r[2]) || 0) + (totMasuk[bc] || 0) - (totKeluar[bc] || 0)
      return {
        found:    true,
        barcode:  bc,
        nama:     r[1].toString(),
        qty:      qty.toString(),
        exp:      r[6] ? formatTgl(r[6]) : '',
        posisi:   r[7].toString(),
        kategori: r[8] ? r[8].toString() : '',
      }
    }
  }
  return { found: false }
}

// ---- ALL STOCK ----

function getAllStock() {
  const ss     = SpreadsheetApp.getActiveSpreadsheet()
  const sheet  = ss.getSheetByName(SHEET_MASTER)
  if (!sheet || sheet.getLastRow() < 2) return { items: [] }

  const totMasuk  = _sumByBarcode(ss.getSheetByName(SHEET_MASUK))
  const totKeluar = _sumByBarcode(ss.getSheetByName(SHEET_KELUAR))

  const items = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues()
    .filter(r => r[0])
    .map(r => {
      const bc  = r[0].toString()
      const qty = (Number(r[2]) || 0) + (totMasuk[bc] || 0) - (totKeluar[bc] || 0)
      return {
        barcode:  bc,
        nama:     r[1].toString(),
        qty:      qty.toString(),
        exp:      r[6] ? formatTgl(r[6]) : '',
        posisi:   r[7].toString(),
        kategori: r[8] ? r[8].toString() : '',
      }
    })
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
  const { barcode, nama, qty, exp, posisi, catatan, tanggal, kategori } = data
  const ss      = SpreadsheetApp.getActiveSpreadsheet()
  const sheetIn = ss.getSheetByName(SHEET_MASUK)
  if (!sheetIn) return { success: false, error: 'Sheet Barang_Masuk tidak ditemukan.' }

  sheetIn.appendRow([
    tanggal ? new Date(tanggal) : new Date(),
    barcode, nama || '', Number(qty) || 0, catatan || ''
  ])

  upsertMaster(barcode, nama, exp, posisi, undefined, kategori)
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

function updateItem(data) { return upsertMaster(data.barcode, data.nama, data.exp, data.posisi, undefined, data.kategori) }
function addItem(data)    { return upsertMaster(data.barcode, data.nama || 'BARANG BARU', data.exp, data.posisi, Number(data.qty) || 0, data.kategori) }

// ---- UPSERT MASTER STOK ----

function upsertMaster(barcode, nama, exp, posisi, stokAwal, kategori) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MASTER)
  if (!sheet) return { success: false, error: 'Master_Stok tidak ditemukan.' }

  const lastRow = sheet.getLastRow()

  if (lastRow > 1) {
    const kodes = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
    for (let i = 0; i < kodes.length; i++) {
      if (kodes[i][0].toString().trim() === barcode.toString().trim()) {
        const row = i + 2
        if (nama)                    sheet.getRange(row, 2).setValue(nama)
        if (exp !== undefined && exp) sheet.getRange(row, 7).setValue(exp)
        if (posisi)                  sheet.getRange(row, 8).setValue(posisi)
        if (kategori !== undefined)  sheet.getRange(row, 9).setValue(kategori || '')
        return { success: true }
      }
    }
  }

  sheet.appendRow([
    barcode, nama || 'BARANG BARU', stokAwal !== undefined ? stokAwal : 0,
    '', '', '', exp || '', posisi || '', kategori || ''
  ])
  return { success: true }
}

// ---- DELETE ITEM ----

function deleteItem(data) {
  const { barcode } = data
  if (!barcode) return { success: false, error: 'Barcode diperlukan.' }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MASTER)
  if (!sheet) return { success: false, error: 'Master_Stok tidak ditemukan.' }

  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return { success: false, error: 'Barang tidak ditemukan.' }

  const kodes = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
  for (let i = 0; i < kodes.length; i++) {
    if (kodes[i][0].toString().trim() === barcode.toString().trim()) {
      sheet.deleteRow(i + 2)
      return { success: true }
    }
  }
  return { success: false, error: 'Barang tidak ditemukan.' }
}

// ---- STATS ----

function getStats() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet()
  const sheet   = ss.getSheetByName(SHEET_MASTER)
  const sheetIn = ss.getSheetByName(SHEET_MASUK)
  const sheetOut= ss.getSheetByName(SHEET_KELUAR)

  const totMasuk  = _sumByBarcode(sheetIn)
  const totKeluar = _sumByBarcode(sheetOut)

  let totalItem = 0, totalStok = 0, lowStock = 0, expiringSoon = 0, expired = 0
  const today = new Date(); today.setHours(0,0,0,0)
  const in30  = new Date(today); in30.setDate(today.getDate() + 30)

  if (sheet && sheet.getLastRow() > 1) {
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues().filter(r => r[0])
    totalItem = rows.length
    rows.forEach(r => {
      const bc  = r[0].toString()
      const qty = (Number(r[2]) || 0) + (totMasuk[bc] || 0) - (totKeluar[bc] || 0)
      totalStok += qty
      if (qty <= 3)  lowStock++
      if (r[6]) {
        const exp = new Date(r[6]); exp.setHours(0,0,0,0)
        if (exp < today)          expired++
        else if (exp <= in30)     expiringSoon++
      }
    })
  }

  return {
    totalItem,
    totalStok,
    lowStock,
    expiringSoon,
    expired,
    todayMasuk:  _sumToday(sheetIn),
    todayKeluar: _sumToday(sheetOut),
    weeklyChart: _weeklyChart(sheetIn, sheetOut),
  }
}

function _sumToday(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return 0
  const today = new Date(); today.setHours(0,0,0,0)
  let sum = 0
  sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues().forEach(r => {
    if (!r[0]) return
    const d = new Date(r[0]); d.setHours(0,0,0,0)
    if (d.getTime() === today.getTime()) sum += (Number(r[3]) || 0)
  })
  return sum
}

function _weeklyChart(sheetIn, sheetOut) {
  const days = []
  const today = new Date(); today.setHours(0,0,0,0)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    days.push({ date: Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM'), masuk: 0, keluar: 0 })
  }

  function fill(sheet, key) {
    if (!sheet || sheet.getLastRow() < 2) return
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues().forEach(r => {
      if (!r[0]) return
      const d = new Date(r[0]); d.setHours(0,0,0,0)
      const label = Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM')
      const slot = days.find(x => x.date === label)
      if (slot) slot[key] += (Number(r[3]) || 0)
    })
  }
  fill(sheetIn,  'masuk')
  fill(sheetOut, 'keluar')
  return days
}

// ---- UTIL ----

function formatTgl(val) {
  try {
    return Utilities.formatDate(new Date(val), Session.getScriptTimeZone(), 'yyyy-MM-dd')
  } catch { return val.toString() }
}

// ============================================================
// SETUP TEMPLATE — jalankan SEKALI dari menu atau Run button
// Membuat header, warna, lebar kolom, freeze, dan format
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚙️ Stok Gudang')
    .addItem('Setup Template (jalankan sekali)', 'setupSpreadsheet')
    .addItem('Refresh Conditional Formatting', 'applyConditionalFormatting')
    .addToUi()
}

function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  ss.setSpreadsheetTimeZone('Asia/Jakarta')

  _setupMaster(ss)
  _setupMasuk(ss)
  _setupKeluar(ss)

  // Urutkan tab
  const order = [SHEET_MASTER, SHEET_MASUK, SHEET_KELUAR]
  order.forEach((name, i) => {
    const s = ss.getSheetByName(name)
    if (s) ss.setActiveSheet(s), ss.moveActiveSheet(i + 1)
  })

  ss.getSheetByName(SHEET_MASTER).activate()
  SpreadsheetApp.getUi().alert('✅ Template berhasil diterapkan!')
}

// ---- MASTER STOK ----

function _setupMaster(ss) {
  let sheet = ss.getSheetByName(SHEET_MASTER)
  if (!sheet) sheet = ss.insertSheet(SHEET_MASTER)

  sheet.clear()
  sheet.clearConditionalFormatRules()

  // ── Header ──
  const headers = [
    'Kode Barcode','Nama Barang','Stok Awal',
    'Total Masuk','Total Keluar','Stok Akhir',
    'Kadaluarsa','Posisi Rak','Kategori'
  ]
  const hRange = sheet.getRange(1, 1, 1, headers.length)
  hRange.setValues([headers])
       .setBackground('#1E3A5F')
       .setFontColor('#FFFFFF')
       .setFontWeight('bold')
       .setFontSize(11)
       .setHorizontalAlignment('center')
       .setVerticalAlignment('middle')
  sheet.setRowHeight(1, 38)
  sheet.setFrozenRows(1)

  // ── Lebar kolom ──
  sheet.setColumnWidth(1, 150)   // Kode
  sheet.setColumnWidth(2, 220)   // Nama
  sheet.setColumnWidth(3, 90)    // Stok Awal
  sheet.setColumnWidth(4, 110)   // Total Masuk
  sheet.setColumnWidth(5, 110)   // Total Keluar
  sheet.setColumnWidth(6, 100)   // Stok Akhir
  sheet.setColumnWidth(7, 120)   // Kadaluarsa
  sheet.setColumnWidth(8, 160)   // Posisi Rak
  sheet.setColumnWidth(9, 130)   // Kategori

  // ── Format kolom angka ──
  sheet.getRange('C:F').setNumberFormat('#,##0')
  sheet.getRange('G:G').setNumberFormat('dd MMM yyyy')

  // ── Conditional formatting ──
  applyConditionalFormatting()

  // ── Border header ──
  hRange.setBorder(true, true, true, true, true, true, '#FFFFFF', SpreadsheetApp.BorderStyle.SOLID)

  // ── Proteksi header ──
  const prot = sheet.getRange('A1:I1').protect().setDescription('Header terkunci')
  prot.setWarningOnly(true)
}

function applyConditionalFormatting() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MASTER)
  if (!sheet) return
  sheet.clearConditionalFormatRules()
  const rules = []
  const maxRow = 500

  // Stok Akhir ≤ 3 → merah muda (kolom F)
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThanOrEqualTo(3)
    .setBackground('#FEE2E2').setFontColor('#991B1B').setBold(true)
    .setRanges([sheet.getRange(`F2:F${maxRow}`)])
    .build())

  // Stok Akhir 4–10 → kuning (kolom F)
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(4, 10)
    .setBackground('#FEF9C3').setFontColor('#854D0E')
    .setRanges([sheet.getRange(`F2:F${maxRow}`)])
    .build())

  // Kadaluarsa sudah lewat → abu (kolom G)
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenDateBefore(SpreadsheetApp.RelativeDate.TODAY)
    .setBackground('#F1F5F9').setFontColor('#94A3B8').setStrikethrough(true)
    .setRanges([sheet.getRange(`G2:G${maxRow}`)])
    .build())

  // Kadaluarsa dalam 30 hari → oranye (kolom G)
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=AND(G2>=TODAY(), G2<=TODAY()+30)`)
    .setBackground('#FFF7ED').setFontColor('#C2410C').setBold(true)
    .setRanges([sheet.getRange(`G2:G${maxRow}`)])
    .build())

  sheet.setConditionalFormatRules(rules)
}

// ---- BARANG MASUK ----

function _setupMasuk(ss) {
  let sheet = ss.getSheetByName(SHEET_MASUK)
  if (!sheet) sheet = ss.insertSheet(SHEET_MASUK)
  sheet.clear()

  const headers = ['Tanggal & Waktu','Kode Barcode','Nama Barang','Qty Masuk','Keterangan']
  const hRange  = sheet.getRange(1, 1, 1, headers.length)
  hRange.setValues([headers])
       .setBackground('#14532D')
       .setFontColor('#FFFFFF')
       .setFontWeight('bold')
       .setFontSize(11)
       .setHorizontalAlignment('center')
       .setVerticalAlignment('middle')
  sheet.setRowHeight(1, 38)
  sheet.setFrozenRows(1)

  sheet.setColumnWidth(1, 160)
  sheet.setColumnWidth(2, 150)
  sheet.setColumnWidth(3, 220)
  sheet.setColumnWidth(4, 90)
  sheet.setColumnWidth(5, 200)

  sheet.getRange('A:A').setNumberFormat('dd MMM yyyy HH:mm')
  sheet.getRange('D:D').setNumberFormat('#,##0')

  // Alternating row color via banding
  const dataRange = sheet.getRange(1, 1, 500, 5)
  try {
    const banding = dataRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY)
    banding.setHeaderRowColor('#14532D')
    banding.setFirstRowColor('#F0FDF4')
    banding.setSecondRowColor('#FFFFFF')
  } catch(e) {}
}

// ---- BARANG KELUAR ----

function _setupKeluar(ss) {
  let sheet = ss.getSheetByName(SHEET_KELUAR)
  if (!sheet) sheet = ss.insertSheet(SHEET_KELUAR)
  sheet.clear()

  const headers = ['Tanggal & Waktu','Kode Barcode','Nama Barang','Qty Keluar','Keterangan']
  const hRange  = sheet.getRange(1, 1, 1, headers.length)
  hRange.setValues([headers])
       .setBackground('#7F1D1D')
       .setFontColor('#FFFFFF')
       .setFontWeight('bold')
       .setFontSize(11)
       .setHorizontalAlignment('center')
       .setVerticalAlignment('middle')
  sheet.setRowHeight(1, 38)
  sheet.setFrozenRows(1)

  sheet.setColumnWidth(1, 160)
  sheet.setColumnWidth(2, 150)
  sheet.setColumnWidth(3, 220)
  sheet.setColumnWidth(4, 90)
  sheet.setColumnWidth(5, 200)

  sheet.getRange('A:A').setNumberFormat('dd MMM yyyy HH:mm')
  sheet.getRange('D:D').setNumberFormat('#,##0')

  try {
    const banding = sheet.getRange(1, 1, 500, 5).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY)
    banding.setHeaderRowColor('#7F1D1D')
    banding.setFirstRowColor('#FFF1F2')
    banding.setSecondRowColor('#FFFFFF')
  } catch(e) {}
}
