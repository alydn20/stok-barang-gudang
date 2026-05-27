// ============================================================
// STOK GUDANG — Google Apps Script Backend
// Sheet: Master_Stok | Barang_Masuk | Barang_Keluar
//
// Master_Stok kolom:
//   A: Kode    B: Nama    C: Stok Awal
//   D: Total Masuk   E: Total Keluar   F: Stok Akhir
//   G: Kadaluarsa    H: Posisi Rak     I: Kategori   J: No. Batch
//
// Barang_Masuk / Barang_Keluar kolom:
//   A: Tanggal   B: Barcode   C: Nama   D: Qty   E: Catatan   F: No. Batch
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
    else if (action === 'getStats')   result = getStats(e.parameter)
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

// ---- HELPER: key = "barcode|batch" atau "barcode" jika batch kosong ----

function _makeKey(barcode, batch) {
  const b = (batch || '').toString().trim()
  return b ? `${barcode}|${b}` : barcode.toString().trim()
}

// Hitung total qty per key dari sheet transaksi (kolom F = batch)
function _sumByKey(sheet) {
  const result = {}
  if (!sheet || sheet.getLastRow() < 2) return result
  sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues()
    .forEach(r => {
      const bc = r[1].toString().trim()
      if (!bc) return
      const key = _makeKey(bc, r[5])
      result[key] = (result[key] || 0) + (Number(r[3]) || 0)
    })
  return result
}

// ---- SEARCH — kembalikan semua batch untuk barcode ini ----

function searchByBarcode(barcode) {
  if (!barcode) return { found: false, batches: [] }
  const ss    = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(SHEET_MASTER)
  if (!sheet || sheet.getLastRow() < 2) return { found: false, batches: [] }

  const totMasuk  = _sumByKey(ss.getSheetByName(SHEET_MASUK))
  const totKeluar = _sumByKey(ss.getSheetByName(SHEET_KELUAR))

  const batches = []
  sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues().forEach(r => {
    if (r[0].toString().trim() !== barcode.toString().trim()) return
    const bc    = r[0].toString().trim()
    const batch = r[9] ? r[9].toString().trim() : ''
    const key   = _makeKey(bc, batch)
    const qty   = (Number(r[2]) || 0) + (totMasuk[key] || 0) - (totKeluar[key] || 0)
    batches.push({
      barcode:  bc,
      nama:     r[1].toString(),
      stokAwal: Number(r[2]) || 0,
      qty:      qty.toString(),
      exp:      r[6] ? formatTgl(r[6]) : '',
      posisi:   r[7].toString(),
      kategori: r[8] ? r[8].toString() : '',
      batch:    batch,
    })
  })

  if (batches.length === 0) return { found: false, batches: [] }

  const totalQty = batches.reduce((s, b) => s + Number(b.qty), 0)
  return {
    found:    true,
    batches,
    barcode:  batches[0].barcode,
    nama:     batches[0].nama,
    qty:      totalQty.toString(),
    exp:      batches[0].exp,
    posisi:   batches[0].posisi,
    kategori: batches[0].kategori,
  }
}

// ---- ALL STOCK ----

function getAllStock() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(SHEET_MASTER)
  if (!sheet || sheet.getLastRow() < 2) return { items: [] }

  const totMasuk  = _sumByKey(ss.getSheetByName(SHEET_MASUK))
  const totKeluar = _sumByKey(ss.getSheetByName(SHEET_KELUAR))

  const items = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues()
    .filter(r => r[0])
    .map(r => {
      const bc    = r[0].toString().trim()
      const batch = r[9] ? r[9].toString().trim() : ''
      const key   = _makeKey(bc, batch)
      const qty   = (Number(r[2]) || 0) + (totMasuk[key] || 0) - (totKeluar[key] || 0)
      return {
        barcode:  bc,
        nama:     r[1].toString(),
        stokAwal: Number(r[2]) || 0,
        qty:      qty.toString(),
        exp:      r[6] ? formatTgl(r[6]) : '',
        posisi:   r[7].toString(),
        kategori: r[8] ? r[8].toString() : '',
        batch:    batch,
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
    sheetIn.getRange(2, 1, sheetIn.getLastRow() - 1, 6).getValues()
      .filter(r => !barcode || r[1].toString().trim() === barcode.toString().trim())
      .forEach(r => history.push({
        tanggal: r[0] ? new Date(r[0]).toISOString() : '',
        tipe: 'MASUK', barcode: r[1].toString(),
        nama: r[2].toString(), qty: r[3].toString(),
        catatan: r[4].toString(), batch: r[5] ? r[5].toString() : '',
      }))
  }

  if (sheetOut && sheetOut.getLastRow() > 1) {
    sheetOut.getRange(2, 1, sheetOut.getLastRow() - 1, 6).getValues()
      .filter(r => !barcode || r[1].toString().trim() === barcode.toString().trim())
      .forEach(r => history.push({
        tanggal: r[0] ? new Date(r[0]).toISOString() : '',
        tipe: 'KELUAR', barcode: r[1].toString(),
        nama: r[2].toString(), qty: r[3].toString(),
        catatan: r[4].toString(), batch: r[5] ? r[5].toString() : '',
      }))
  }

  history.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
  return { history: history.slice(0, 50) }
}

// ---- STOCK IN ----

function stockIn(data) {
  const { barcode, nama, qty, exp, posisi, catatan, tanggal, kategori, stokAwal, batch } = data
  const ss      = SpreadsheetApp.getActiveSpreadsheet()
  const sheetIn = ss.getSheetByName(SHEET_MASUK)
  if (!sheetIn) return { success: false, error: 'Sheet Barang_Masuk tidak ditemukan.' }

  if (Number(qty) > 0) {
    sheetIn.appendRow([
      tanggal ? new Date(tanggal) : new Date(),
      barcode, nama || '', Number(qty), catatan || '', batch || ''
    ])
    SpreadsheetApp.flush()
  }

  upsertMaster(barcode, nama, exp, posisi, stokAwal !== undefined ? Number(stokAwal) : undefined, kategori, batch || '')
  return { success: true }
}

// ---- STOCK OUT ----

function stockOut(data) {
  const { barcode, qty, catatan, tanggal, batch } = data
  const ss       = SpreadsheetApp.getActiveSpreadsheet()
  const sheetOut = ss.getSheetByName(SHEET_KELUAR)
  if (!sheetOut) return { success: false, error: 'Sheet Barang_Keluar tidak ditemukan.' }

  const info = searchByBarcode(barcode)
  if (!info.found) return { success: false, error: 'Barang tidak ditemukan.' }

  let targetBatch = (batch || '').trim()
  let itemName    = info.nama

  if (batch) {
    // Batch spesifik dipilih user
    const batchInfo = info.batches.find(b => b.batch === targetBatch)
    if (!batchInfo) return { success: false, error: `Batch "${batch}" tidak ditemukan.` }
    if (Number(batchInfo.qty) < Number(qty))
      return { success: false, error: `Stok batch ini tidak cukup. Tersedia: ${batchInfo.qty} pcs.` }
    itemName = batchInfo.nama
  } else {
    // Auto FIFO: pilih batch dengan exp paling dekat yang masih ada stok
    const available = info.batches
      .filter(b => Number(b.qty) > 0)
      .sort((a, b) => {
        if (!a.exp && !b.exp) return 0
        if (!a.exp) return 1
        if (!b.exp) return -1
        return new Date(a.exp) - new Date(b.exp)
      })
    if (available.length === 0) return { success: false, error: 'Stok tidak tersedia.' }
    if (Number(available[0].qty) < Number(qty))
      return { success: false, error: `Stok tidak cukup. Tersedia: ${available[0].qty} pcs (batch ${available[0].batch || 'default'}).` }
    targetBatch = available[0].batch
    itemName    = available[0].nama
  }

  sheetOut.appendRow([
    tanggal ? new Date(tanggal) : new Date(),
    barcode, itemName, Number(qty) || 0, catatan || '', targetBatch
  ])
  SpreadsheetApp.flush()

  upsertMaster(barcode, null, null, null, undefined, undefined, targetBatch)
  return { success: true }
}

// ---- UPDATE / ADD ITEM ----

function updateItem(data) {
  return upsertMaster(
    data.barcode, data.nama, data.exp, data.posisi,
    data.stokAwal !== undefined ? Number(data.stokAwal) : undefined,
    data.kategori, data.batch || ''
  )
}
function addItem(data) {
  return upsertMaster(
    data.barcode, data.nama || 'BARANG BARU', data.exp, data.posisi,
    Number(data.qty) || 0, data.kategori, data.batch || ''
  )
}

// ---- UPSERT MASTER STOK ----

function upsertMaster(barcode, nama, exp, posisi, stokAwal, kategori, batch) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MASTER)
  if (!sheet) return { success: false, error: 'Master_Stok tidak ditemukan.' }

  const batchVal = (batch || '').toString().trim()
  const lastRow  = sheet.getLastRow()

  if (lastRow > 1) {
    const data = sheet.getRange(2, 1, lastRow - 1, 10).getValues()
    for (let i = 0; i < data.length; i++) {
      const rowBC    = data[i][0].toString().trim()
      const rowBatch = data[i][9] ? data[i][9].toString().trim() : ''
      if (rowBC === barcode.toString().trim() && rowBatch === batchVal) {
        const row = i + 2
        if (nama)                     sheet.getRange(row, 2).setValue(nama)
        if (stokAwal !== undefined)   sheet.getRange(row, 3).setValue(Number(stokAwal) || 0)
        if (exp !== undefined && exp) sheet.getRange(row, 7).setValue(exp)
        if (posisi)                   sheet.getRange(row, 8).setValue(posisi)
        if (kategori !== undefined)   sheet.getRange(row, 9).setValue(kategori || '')
        _updateRowTotals(sheet, barcode.toString().trim(), batchVal, row)
        return { success: true }
      }
    }
  }

  const newRow  = sheet.getLastRow() + 1
  const saVal   = stokAwal !== undefined ? Number(stokAwal) : 0
  sheet.appendRow([barcode, nama || 'BARANG BARU', saVal, 0, 0, saVal, exp || '', posisi || '', kategori || '', batchVal])
  _updateRowTotals(sheet, barcode.toString().trim(), batchVal, newRow)
  return { success: true }
}

function _updateRowTotals(sheet, barcode, batch, row) {
  const ss        = SpreadsheetApp.getActiveSpreadsheet()
  const key       = _makeKey(barcode, batch)
  const totMasuk  = _sumByKey(ss.getSheetByName(SHEET_MASUK))
  const totKeluar = _sumByKey(ss.getSheetByName(SHEET_KELUAR))
  const stokAwal  = Number(sheet.getRange(row, 3).getValue()) || 0
  const masuk     = totMasuk[key]  || 0
  const keluar    = totKeluar[key] || 0
  sheet.getRange(row, 4).setValue(masuk)
  sheet.getRange(row, 5).setValue(keluar)
  sheet.getRange(row, 6).setValue(stokAwal + masuk - keluar)
}

// Jalankan dari menu untuk refresh semua baris
function refreshAllFormulas() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(SHEET_MASTER)
  if (!sheet || sheet.getLastRow() < 2) return
  const lastRow = sheet.getLastRow()
  const data    = sheet.getRange(2, 1, lastRow - 1, 10).getValues()
  for (let i = 0; i < data.length; i++) {
    const bc    = data[i][0].toString().trim()
    const batch = data[i][9] ? data[i][9].toString().trim() : ''
    if (bc) _updateRowTotals(sheet, bc, batch, i + 2)
  }
  SpreadsheetApp.getUi().alert(`✅ Total stok diperbarui untuk ${lastRow - 1} baris.`)
}

// ---- DELETE ITEM ----

function deleteItem(data) {
  const { barcode, batch } = data
  if (!barcode) return { success: false, error: 'Barcode diperlukan.' }
  const batchVal = (batch || '').toString().trim()

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MASTER)
  if (!sheet) return { success: false, error: 'Master_Stok tidak ditemukan.' }
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return { success: false, error: 'Barang tidak ditemukan.' }

  const rows = sheet.getRange(2, 1, lastRow - 1, 10).getValues()
  for (let i = 0; i < rows.length; i++) {
    const rowBC    = rows[i][0].toString().trim()
    const rowBatch = rows[i][9] ? rows[i][9].toString().trim() : ''
    if (rowBC === barcode.toString().trim() && rowBatch === batchVal) {
      sheet.deleteRow(i + 2)
      return { success: true }
    }
  }
  return { success: false, error: 'Barang tidak ditemukan.' }
}

// ---- STATS ----

function getStats(params) {
  const ss      = SpreadsheetApp.getActiveSpreadsheet()
  const sheet   = ss.getSheetByName(SHEET_MASTER)
  const sheetIn = ss.getSheetByName(SHEET_MASUK)
  const sheetOut= ss.getSheetByName(SHEET_KELUAR)
  const startDate = params && params.startDate ? new Date(params.startDate) : null
  const endDate   = params && params.endDate   ? new Date(params.endDate)   : null

  const totMasuk  = _sumByKey(sheetIn)
  const totKeluar = _sumByKey(sheetOut)

  let totalItem = 0, totalStok = 0, lowStock = 0, expiringSoon = 0, expired = 0
  const today = new Date(); today.setHours(0,0,0,0)
  const in30  = new Date(today); in30.setDate(today.getDate() + 30)

  if (sheet && sheet.getLastRow() > 1) {
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues().filter(r => r[0])
    totalItem = rows.length
    rows.forEach(r => {
      const bc    = r[0].toString().trim()
      const batch = r[9] ? r[9].toString().trim() : ''
      const key   = _makeKey(bc, batch)
      const qty   = (Number(r[2]) || 0) + (totMasuk[key] || 0) - (totKeluar[key] || 0)
      totalStok += qty
      if (qty <= 3) lowStock++
      if (r[6]) {
        const exp = new Date(r[6]); exp.setHours(0,0,0,0)
        if (exp < today)      expired++
        else if (exp <= in30) expiringSoon++
      }
    })
  }

  return {
    totalItem, totalStok, lowStock, expiringSoon, expired,
    todayMasuk:  _sumToday(sheetIn),
    todayKeluar: _sumToday(sheetOut),
    weeklyChart: _weeklyChart(sheetIn, sheetOut, startDate, endDate),
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

function _weeklyChart(sheetIn, sheetOut, startDate, endDate) {
  const tz    = Session.getScriptTimeZone()
  const end   = endDate   ? new Date(endDate)   : new Date()
  const start = startDate ? new Date(startDate) : new Date(end)
  end.setHours(23,59,59,999)
  if (!startDate) start.setDate(end.getDate() - 6)
  start.setHours(0,0,0,0)
  const diffDays = Math.round((end - start) / 86400000)
  if (diffDays > 31) start.setTime(end.getTime() - 31 * 86400000)

  const days = []
  const cur  = new Date(start)
  while (cur <= end) {
    days.push({ date: Utilities.formatDate(new Date(cur), tz, 'dd/MM'), masuk: 0, keluar: 0 })
    cur.setDate(cur.getDate() + 1)
  }
  function fill(sheet, key) {
    if (!sheet || sheet.getLastRow() < 2) return
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues().forEach(r => {
      if (!r[0]) return
      const d = new Date(r[0]); d.setHours(0,0,0,0)
      if (d < start || d > end) return
      const label = Utilities.formatDate(d, tz, 'dd/MM')
      const slot  = days.find(x => x.date === label)
      if (slot) slot[key] += (Number(r[3]) || 0)
    })
  }
  fill(sheetIn,  'masuk')
  fill(sheetOut, 'keluar')
  return days
}

// ---- UTIL ----

function formatTgl(val) {
  try { return Utilities.formatDate(new Date(val), Session.getScriptTimeZone(), 'yyyy-MM-dd') }
  catch { return val.toString() }
}

// ============================================================
// SETUP TEMPLATE
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚙️ Stok Gudang')
    .addItem('✅ Format & Perbaiki Semua (Data Aman)', 'perbaikiSemua')
    .addSeparator()
    .addItem('⚠️ Setup Template BARU (Hapus Semua Data)', 'setupSpreadsheet')
    .addToUi()
}

// ---- FORMAT & PERBAIKI SEMUA (gabungan format + migrasi + refresh) ----

function perbaikiSemua() {
  const ui   = SpreadsheetApp.getUi()
  const resp = ui.alert(
    '✅ Format & Perbaiki Semua',
    'Tindakan ini akan:\n' +
    '1. Terapkan format warna & kolom\n' +
    '2. Isi kolom Batch yang kosong dengan "NO001"\n' +
    '3. Hitung ulang Total Masuk / Keluar / Stok Akhir\n\n' +
    'Data tidak akan dihapus. Lanjutkan?',
    ui.ButtonSet.YES_NO
  )
  if (resp !== ui.Button.YES) return

  const ss = SpreadsheetApp.getActiveSpreadsheet()
  ss.setSpreadsheetTimeZone('Asia/Jakarta')

  // 1. Format semua sheet
  _formatMasterOnly(ss)
  _formatTransaksiOnly(ss, SHEET_MASUK,  '#15803D', '#DCFCE7', '#F0FDF4')
  _formatTransaksiOnly(ss, SHEET_KELUAR, '#B91C1C', '#FEE2E2', '#FFF1F2')
  applyConditionalFormatting()

  // 2. Isi batch kosong dengan NO001
  let count = 0
  const master = ss.getSheetByName(SHEET_MASTER)
  if (master && master.getLastRow() > 1) {
    const vals = master.getRange(2, 10, master.getLastRow() - 1, 1).getValues()
    vals.forEach((r, i) => {
      if (r[0].toString().trim() === '') { master.getRange(i + 2, 10).setValue('NO001'); count++ }
    })
  }
  const masuk = ss.getSheetByName(SHEET_MASUK)
  if (masuk && masuk.getLastRow() > 1) {
    const vals = masuk.getRange(2, 6, masuk.getLastRow() - 1, 1).getValues()
    vals.forEach((r, i) => {
      if (r[0].toString().trim() === '') { masuk.getRange(i + 2, 6).setValue('NO001'); count++ }
    })
  }
  const keluar = ss.getSheetByName(SHEET_KELUAR)
  if (keluar && keluar.getLastRow() > 1) {
    const vals = keluar.getRange(2, 6, keluar.getLastRow() - 1, 1).getValues()
    vals.forEach((r, i) => {
      if (r[0].toString().trim() === '') { keluar.getRange(i + 2, 6).setValue('NO001'); count++ }
    })
  }

  // 3. Hitung ulang semua total di Master_Stok
  SpreadsheetApp.flush()
  if (master && master.getLastRow() > 1) {
    const data = master.getRange(2, 1, master.getLastRow() - 1, 10).getValues()
    data.forEach((r, i) => {
      const bc    = r[0].toString().trim()
      const batch = r[9] ? r[9].toString().trim() : ''
      if (bc) _updateRowTotals(master, bc, batch, i + 2)
    })
  }

  ui.alert(`✅ Selesai!\n${count} baris batch diisi "NO001".\nSemua format & total stok sudah diperbarui.`)
}

// ---- FORMAT SAJA (dipakai internal oleh perbaikiSemua & setupSpreadsheet) ----

function applyFormatOnly() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  ss.setSpreadsheetTimeZone('Asia/Jakarta')
  _formatMasterOnly(ss)
  _formatTransaksiOnly(ss, SHEET_MASUK,  '#15803D', '#DCFCE7', '#F0FDF4')
  _formatTransaksiOnly(ss, SHEET_KELUAR, '#B91C1C', '#FEE2E2', '#FFF1F2')
  applyConditionalFormatting()
  SpreadsheetApp.getUi().alert('✅ Format warna berhasil diterapkan. Data tidak dihapus.')
}

function _formatMasterOnly(ss) {
  const sheet = ss.getSheetByName(SHEET_MASTER)
  if (!sheet) return
  const headerColor = '#1E3A5F'
  const numCols = 10

  sheet.getRange(1, 1, 1, numCols)
    .setBackground(headerColor).setFontColor('#FFFFFF')
    .setFontWeight('bold').setFontSize(11)
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setBorder(true,true,true,true,true,true,'#FFFFFF',SpreadsheetApp.BorderStyle.SOLID)
  sheet.setRowHeight(1, 38)
  sheet.setFrozenRows(1)

  sheet.setColumnWidth(1, 150); sheet.setColumnWidth(2, 220); sheet.setColumnWidth(3, 90)
  sheet.setColumnWidth(4, 110); sheet.setColumnWidth(5, 110); sheet.setColumnWidth(6, 100)
  sheet.setColumnWidth(7, 120); sheet.setColumnWidth(8, 160); sheet.setColumnWidth(9, 130)
  sheet.setColumnWidth(10, 120)

  sheet.getRange('C:F').setNumberFormat('#,##0')
  sheet.getRange('G:G').setNumberFormat('dd MMM yyyy')

  try {
    sheet.getBandings().forEach(b => b.remove())
    const rows = Math.max(sheet.getLastRow(), 2)
    const banding = sheet.getRange(1, 1, rows, numCols).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY)
    banding.setHeaderRowColor(headerColor)
    banding.setFirstRowColor('#EFF6FF')
    banding.setSecondRowColor('#FFFFFF')
  } catch(e) {}
}

function _formatTransaksiOnly(ss, name, headerColor, rowColor1, rowColor2) {
  const sheet = ss.getSheetByName(name)
  if (!sheet) return
  const numCols = 6

  sheet.getRange(1, 1, 1, numCols)
    .setBackground(headerColor).setFontColor('#FFFFFF')
    .setFontWeight('bold').setFontSize(11)
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
  sheet.setRowHeight(1, 38)
  sheet.setFrozenRows(1)

  // Rename Keterangan → Catatan jika perlu
  const e1 = sheet.getRange(1, 5).getValue().toString().trim()
  if (e1 === 'Keterangan' || e1 === '') sheet.getRange(1, 5).setValue('Catatan')

  sheet.setColumnWidth(1, 160); sheet.setColumnWidth(2, 150); sheet.setColumnWidth(3, 220)
  sheet.setColumnWidth(4, 90);  sheet.setColumnWidth(5, 200); sheet.setColumnWidth(6, 130)

  sheet.getRange('A:A').setNumberFormat('dd MMM yyyy HH:mm')
  sheet.getRange('D:D').setNumberFormat('#,##0')

  try {
    sheet.getBandings().forEach(b => b.remove())
    const rows = Math.max(sheet.getLastRow(), 2)
    const banding = sheet.getRange(1, 1, rows, numCols).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY)
    banding.setHeaderRowColor(headerColor)
    banding.setFirstRowColor(rowColor1)
    banding.setSecondRowColor(rowColor2)
  } catch(e) {}
}

// ---- SETUP TEMPLATE (menghapus semua data) ----

function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  ss.setSpreadsheetTimeZone('Asia/Jakarta')
  _setupMaster(ss)
  _setupMasuk(ss)
  _setupKeluar(ss)
  const order = [SHEET_MASTER, SHEET_MASUK, SHEET_KELUAR]
  order.forEach((name, i) => {
    const s = ss.getSheetByName(name)
    if (s) ss.setActiveSheet(s), ss.moveActiveSheet(i + 1)
  })
  ss.getSheetByName(SHEET_MASTER).activate()
  SpreadsheetApp.getUi().alert('✅ Template berhasil diterapkan!')
}

function _setupMaster(ss) {
  let sheet = ss.getSheetByName(SHEET_MASTER)
  if (!sheet) sheet = ss.insertSheet(SHEET_MASTER)
  sheet.clear()
  sheet.clearConditionalFormatRules()

  const headers = ['Kode Barcode','Nama Barang','Stok Awal','Total Masuk','Total Keluar','Stok Akhir','Kadaluarsa','Posisi Rak','Kategori','No. Batch']
  const hRange  = sheet.getRange(1, 1, 1, headers.length)
  hRange.setValues([headers])
       .setBackground('#1E3A5F').setFontColor('#FFFFFF')
       .setFontWeight('bold').setFontSize(11)
       .setHorizontalAlignment('center').setVerticalAlignment('middle')
  sheet.setRowHeight(1, 38)
  sheet.setFrozenRows(1)

  sheet.setColumnWidth(1, 150)
  sheet.setColumnWidth(2, 220)
  sheet.setColumnWidth(3, 90)
  sheet.setColumnWidth(4, 110)
  sheet.setColumnWidth(5, 110)
  sheet.setColumnWidth(6, 100)
  sheet.setColumnWidth(7, 120)
  sheet.setColumnWidth(8, 160)
  sheet.setColumnWidth(9, 130)
  sheet.setColumnWidth(10, 120)

  sheet.getRange('C:F').setNumberFormat('#,##0')
  sheet.getRange('G:G').setNumberFormat('dd MMM yyyy')

  try {
    sheet.getBandings().forEach(b => b.remove())
    const banding = sheet.getRange(1, 1, 500, headers.length).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY)
    banding.setHeaderRowColor('#1E3A5F')
    banding.setFirstRowColor('#EFF6FF')
    banding.setSecondRowColor('#FFFFFF')
  } catch(e) {}

  applyConditionalFormatting()
  hRange.setBorder(true, true, true, true, true, true, '#FFFFFF', SpreadsheetApp.BorderStyle.SOLID)
  const prot = sheet.getRange('A1:J1').protect().setDescription('Header terkunci')
  prot.setWarningOnly(true)
}

function applyConditionalFormatting() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_MASTER)
  if (!sheet) return
  sheet.clearConditionalFormatRules()
  const rules = []
  const maxRow = 500
  const fullRow = `A2:J${maxRow}`

  // Stok akhir cell — bold+red (prioritas tertinggi kolom F)
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThanOrEqualTo(3)
    .setBackground('#FEE2E2').setFontColor('#991B1B').setBold(true)
    .setRanges([sheet.getRange(`F2:F${maxRow}`)]).build())

  // Seluruh baris — stok rendah (merah muda)
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=$F2<=3`)
    .setBackground('#FEF2F2')
    .setRanges([sheet.getRange(fullRow)]).build())

  // Stok sedang 4-10
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(4, 10)
    .setBackground('#FEF9C3').setFontColor('#854D0E')
    .setRanges([sheet.getRange(`F2:F${maxRow}`)]).build())

  // Kadaluarsa cell — strikethrough
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenDateBefore(SpreadsheetApp.RelativeDate.TODAY)
    .setBackground('#F1F5F9').setFontColor('#94A3B8').setStrikethrough(true)
    .setRanges([sheet.getRange(`G2:G${maxRow}`)]).build())

  // Seluruh baris — sudah kadaluarsa (abu-abu)
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=AND($G2<>"", $G2<TODAY())`)
    .setBackground('#F8FAFC').setFontColor('#94A3B8')
    .setRanges([sheet.getRange(fullRow)]).build())

  // Kadaluarsa cell — segera exp (bold+orange)
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=AND(G2>=TODAY(), G2<=TODAY()+30)`)
    .setBackground('#FFF7ED').setFontColor('#C2410C').setBold(true)
    .setRanges([sheet.getRange(`G2:G${maxRow}`)]).build())

  // Seluruh baris — segera kadaluarsa (kuning muda)
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=AND($G2>=TODAY(), $G2<=TODAY()+30)`)
    .setBackground('#FFFBEB')
    .setRanges([sheet.getRange(fullRow)]).build())

  sheet.setConditionalFormatRules(rules)
}

function _setupSheet(ss, name, headers, headerColor, rowColor1, rowColor2) {
  let sheet = ss.getSheetByName(name)
  if (!sheet) sheet = ss.insertSheet(name)
  sheet.clear()

  const hRange = sheet.getRange(1, 1, 1, headers.length)
  hRange.setValues([headers])
       .setBackground(headerColor).setFontColor('#FFFFFF')
       .setFontWeight('bold').setFontSize(11)
       .setHorizontalAlignment('center').setVerticalAlignment('middle')
  sheet.setRowHeight(1, 38)
  sheet.setFrozenRows(1)

  sheet.setColumnWidth(1, 160)
  sheet.setColumnWidth(2, 150)
  sheet.setColumnWidth(3, 220)
  sheet.setColumnWidth(4, 90)
  sheet.setColumnWidth(5, 200)
  sheet.setColumnWidth(6, 130)

  sheet.getRange('A:A').setNumberFormat('dd MMM yyyy HH:mm')
  sheet.getRange('D:D').setNumberFormat('#,##0')

  try {
    const banding = sheet.getRange(1, 1, 500, headers.length).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY)
    banding.setHeaderRowColor(headerColor)
    banding.setFirstRowColor(rowColor1)
    banding.setSecondRowColor(rowColor2)
  } catch(e) {}
}

function _setupMasuk(ss) {
  _setupSheet(ss, SHEET_MASUK,
    ['Tanggal & Waktu','Kode Barcode','Nama Barang','Qty Masuk','Catatan','No. Batch'],
    '#15803D', '#DCFCE7', '#F0FDF4')
}

function _setupKeluar(ss) {
  _setupSheet(ss, SHEET_KELUAR,
    ['Tanggal & Waktu','Kode Barcode','Nama Barang','Qty Keluar','Catatan','No. Batch'],
    '#B91C1C', '#FEE2E2', '#FFF1F2')
}
