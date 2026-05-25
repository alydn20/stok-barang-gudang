import React, { useState } from 'react'
import { CheckCircle2, XCircle, Save, Wifi, WifiOff, Settings2, BookOpen, Info } from 'lucide-react'

const GAS_KEY = 'gas_url'

export default function Settings() {
  const [gasUrl, setGasUrl]     = useState(() => localStorage.getItem(GAS_KEY) || '')
  const [saved,  setSaved]      = useState(false)
  const [testing, setTesting]   = useState(false)
  const [testResult, setTestResult] = useState(null)

  const handleSave = () => {
    localStorage.setItem(GAS_KEY, gasUrl.trim())
    setSaved(true)
    setTimeout(() => { setSaved(false); window.location.reload() }, 800)
  }

  const handleTest = async () => {
    if (!gasUrl.trim()) return
    setTesting(true); setTestResult(null)
    try {
      const res  = await fetch(`${gasUrl.trim()}?action=ping`)
      const data = await res.json()
      setTestResult({ ok: data.status === 'ok', msg: data.status === 'ok' ? 'Koneksi berhasil!' : 'Response tidak valid dari server.' })
    } catch (e) {
      setTestResult({ ok: false, msg: 'Gagal terhubung: ' + e.message })
    } finally { setTesting(false) }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={s.titleRow}>
          <div style={{ ...s.titleIcon, background: '#F1F5F9' }}>
            <Settings2 size={20} color="#475569" />
          </div>
          <h2 style={s.title}>Pengaturan</h2>
        </div>
      </div>

      {/* GAS URL */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}>
          <Wifi size={18} color="#2563EB" />
          <h3 style={s.cardTitle}>Koneksi Google Sheets</h3>
        </div>
        <p style={s.desc}>Masukkan URL Web App dari Google Apps Script untuk menghubungkan aplikasi ke Google Sheets.</p>

        <label className="label" style={{ marginTop: 12 }}>URL Google Apps Script</label>
        <textarea
          className="input"
          value={gasUrl}
          onChange={e => setGasUrl(e.target.value)}
          placeholder="https://script.google.com/macros/s/.../exec"
          rows={3}
          style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
        />

        {testResult && (
          <div className={`alert ${testResult.ok ? 'alert-success' : 'alert-danger'} fade-in`} style={{ marginTop: 10 }}>
            {testResult.ok ? <CheckCircle2 size={16} /> : <WifiOff size={16} />}
            {testResult.msg}
          </div>
        )}

        <div style={s.btnRow}>
          <button onClick={handleTest} disabled={testing || !gasUrl.trim()} className="btn btn-ghost" style={{ flex: 1 }}>
            {testing ? 'Menguji...' : 'Test Koneksi'}
          </button>
          <button onClick={handleSave} disabled={!gasUrl.trim()} className="btn btn-primary" style={{ flex: 1 }}>
            <Save size={16} />
            {saved ? 'Tersimpan!' : 'Simpan'}
          </button>
        </div>
      </div>

      {/* Setup guide */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}>
          <BookOpen size={18} color="#7C3AED" />
          <h3 style={s.cardTitle}>Cara Setup</h3>
        </div>
        <ol style={s.stepList}>
          {[
            'Buka Google Sheets, buat spreadsheet baru.',
            'Klik Extensions → Apps Script.',
            'Copy-paste isi file google-apps-script/Code.gs.',
            'Klik Deploy → New deployment.',
            'Pilih type: Web app.',
            'Execute as: Me — Access: Anyone.',
            'Klik Deploy, copy URL yang muncul.',
            'Paste URL di kolom atas, lalu simpan.',
          ].map((step, i) => (
            <li key={i} style={s.step}>
              <span style={s.stepNum}>{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* About */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}>
          <Info size={18} color="#64748B" />
          <h3 style={s.cardTitle}>Tentang Aplikasi</h3>
        </div>
        <div style={s.aboutRow}>
          <span style={s.aboutLabel}>Versi</span>
          <span style={s.aboutVal}>1.0.0</span>
        </div>
        <div style={s.aboutRow}>
          <span style={s.aboutLabel}>Platform</span>
          <span style={s.aboutVal}>React + Vite</span>
        </div>
        <div style={s.aboutRow}>
          <span style={s.aboutLabel}>Database</span>
          <span style={s.aboutVal}>Google Sheets via Apps Script</span>
        </div>
        <div style={{ ...s.aboutRow, border: 'none' }}>
          <span style={s.aboutLabel}>Scanner</span>
          <span style={s.aboutVal}>@zxing/library (kamera)</span>
        </div>
      </div>
    </div>
  )
}

const s = {
  titleRow:   { display: 'flex', alignItems: 'center', gap: 10 },
  titleIcon:  { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 20, fontWeight: 700, color: '#0F172A' },
  card:       { padding: 18, marginBottom: 14 },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle:  { fontSize: 15, fontWeight: 700, color: '#1E293B' },
  desc:       { fontSize: 13, color: '#64748B', lineHeight: 1.6 },
  btnRow:     { display: 'flex', gap: 8, marginTop: 12 },
  stepList:   { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 },
  step:       { display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#334155', lineHeight: 1.5 },
  stepNum:    { flexShrink: 0, width: 20, height: 20, background: '#EFF6FF', color: '#2563EB', borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  aboutRow:   { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' },
  aboutLabel: { fontSize: 13, color: '#64748B' },
  aboutVal:   { fontSize: 13, fontWeight: 600, color: '#1E293B' },
}
