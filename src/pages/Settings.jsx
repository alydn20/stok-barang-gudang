import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Save } from 'lucide-react'

const GAS_KEY = 'gas_url'

export default function Settings() {
  const [gasUrl, setGasUrl] = useState(() => localStorage.getItem(GAS_KEY) || '')
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const handleSave = () => {
    localStorage.setItem(GAS_KEY, gasUrl)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    window.__GAS_URL__ = gasUrl
    // Force reload agar config terbaca
    window.location.reload()
  }

  const handleTest = async () => {
    if (!gasUrl) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${gasUrl}?action=ping`)
      const data = await res.json()
      setTestResult({ ok: data.status === 'ok', msg: data.status === 'ok' ? 'Koneksi berhasil!' : 'Response tidak valid' })
    } catch (e) {
      setTestResult({ ok: false, msg: 'Gagal terhubung: ' + e.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Pengaturan</h2>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Google Apps Script URL</h3>
        <p style={styles.desc}>
          Paste URL Web App dari Google Apps Script di sini.
          Ikuti panduan setup di README untuk mendapatkan URL ini.
        </p>
        <textarea
          style={styles.textarea}
          value={gasUrl}
          onChange={e => setGasUrl(e.target.value)}
          placeholder="https://script.google.com/macros/s/.../exec"
          rows={3}
        />
        {testResult && (
          <div style={{ ...styles.statusBox, background: testResult.ok ? '#e8f5e9' : '#ffebee', color: testResult.ok ? '#2e7d32' : '#c62828' }}>
            {testResult.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {testResult.msg}
          </div>
        )}
        <div style={styles.btnRow}>
          <button onClick={handleTest} disabled={testing || !gasUrl} style={styles.btnTest}>
            {testing ? 'Testing...' : 'Test Koneksi'}
          </button>
          <button onClick={handleSave} style={styles.btnSave}>
            <Save size={16} /> {saved ? 'Tersimpan!' : 'Simpan'}
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Cara Setup Google Apps Script</h3>
        <ol style={styles.steps}>
          <li>Buka Google Sheets, buat spreadsheet baru</li>
          <li>Klik <b>Extensions</b> → <b>Apps Script</b></li>
          <li>Copy-paste kode dari file <code>google-apps-script/Code.gs</code></li>
          <li>Klik <b>Deploy</b> → <b>New deployment</b></li>
          <li>Pilih type: <b>Web app</b></li>
          <li>Execute as: <b>Me</b>, Access: <b>Anyone</b></li>
          <li>Copy URL dan paste di atas</li>
        </ol>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Tentang Aplikasi</h3>
        <p style={styles.desc}>Stok Gudang v1.0 — Aplikasi manajemen stok pribadi</p>
        <p style={{ ...styles.desc, marginTop: 4 }}>Fitur: Scanner barcode, in/out barang, pencarian posisi rak, terhubung Google Sheets</p>
      </div>
    </div>
  )
}

const styles = {
  page: { padding: '24px 16px 100px', maxWidth: 480, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 20 },
  card: { background: '#fff', borderRadius: 14, padding: 18, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  cardTitle: { fontSize: 16, fontWeight: 700, marginBottom: 8 },
  desc: { fontSize: 13, color: '#666', lineHeight: 1.5 },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', resize: 'vertical', marginTop: 8, outline: 'none' },
  btnRow: { display: 'flex', gap: 8, marginTop: 10 },
  btnTest: { flex: 1, padding: '10px', background: '#e3f2fd', color: '#1976d2', border: '1px solid #90caf9', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  btnSave: { flex: 1, padding: '10px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  statusBox: { padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 8 },
  steps: { paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, fontSize: 13, color: '#444', lineHeight: 1.6 },
}
