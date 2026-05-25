import React, { useState } from 'react'
import { CheckCircle2, XCircle, Wifi, WifiOff, Settings2, BookOpen, Info, Loader2, Server } from 'lucide-react'
import { sheetsApi } from '../services/sheetsApi'

export default function Settings() {
  const [testing,    setTesting]    = useState(false)
  const [testResult, setTestResult] = useState(null)
  const configured = sheetsApi.isConfigured()

  const handleTest = async () => {
    setTesting(true); setTestResult(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_GAS_URL}?action=ping`)
      const data = await res.json()
      setTestResult({ ok: data.status === 'ok', msg: data.status === 'ok' ? 'Koneksi ke Google Sheets berhasil.' : 'Server merespons tapi status tidak valid.' })
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

      {/* Status koneksi */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}>
          <Server size={18} color="#2563EB" />
          <h3 style={s.cardTitle}>Status Koneksi Google Sheets</h3>
        </div>

        <div style={{ ...s.statusRow, background: configured ? '#F0FDF4' : '#FEF2F2', borderColor: configured ? '#BBF7D0' : '#FECACA' }}>
          {configured
            ? <><CheckCircle2 size={18} color="#16A34A" /><div><p style={{ fontWeight: 600, color: '#15803D', fontSize: 14 }}>Terhubung ke server</p><p style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>URL dikonfigurasi via Vercel — berlaku untuk semua perangkat.</p></div></>
            : <><WifiOff size={18} color="#DC2626" /><div><p style={{ fontWeight: 600, color: '#B91C1C', fontSize: 14 }}>Belum dikonfigurasi</p><p style={{ fontSize: 12, color: '#991B1B', marginTop: 2 }}>Tambahkan VITE_GAS_URL di Vercel Environment Variables.</p></div></>
          }
        </div>

        {configured && (
          <>
            {testResult && (
              <div className={`alert ${testResult.ok ? 'alert-success' : 'alert-danger'} fade-in`} style={{ marginTop: 10 }}>
                {testResult.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {testResult.msg}
              </div>
            )}
            <button onClick={handleTest} disabled={testing} className="btn btn-ghost btn-full" style={{ marginTop: 12 }}>
              {testing ? <><Loader2 size={16} className="spin" /> Menguji...</> : <><Wifi size={16} /> Test Koneksi</>}
            </button>
          </>
        )}
      </div>

      {/* Cara set env var di Vercel */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}>
          <BookOpen size={18} color="#7C3AED" />
          <h3 style={s.cardTitle}>Cara Set URL di Vercel</h3>
        </div>
        <ol style={s.stepList}>
          {[
            'Buka dashboard.vercel.com → pilih project stok-barang-gudang.',
            'Klik tab Settings → Environment Variables.',
            'Klik Add New, isi Key: VITE_GAS_URL',
            'Isi Value dengan URL Google Apps Script.',
            'Centang Environment: Production, Preview, Development.',
            'Klik Save, lalu klik Redeploy agar perubahan aktif.',
            'Semua perangkat otomatis terhubung ke sheet yang sama.',
          ].map((step, i) => (
            <li key={i} style={s.step}>
              <span style={s.stepNum}>{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Cara buat GAS */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}>
          <BookOpen size={18} color="#16A34A" />
          <h3 style={s.cardTitle}>Cara Buat Google Apps Script</h3>
        </div>
        <ol style={s.stepList}>
          {[
            'Buka Google Sheets, buat spreadsheet baru.',
            'Klik Extensions → Apps Script.',
            'Copy-paste isi file google-apps-script/Code.gs.',
            'Klik Deploy → New deployment → Web app.',
            'Execute as: Me — Access: Anyone.',
            'Klik Deploy, copy URL yang muncul.',
            'Paste URL tersebut ke Vercel (langkah di atas).',
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
        {[
          ['Versi', '1.0.0'],
          ['Platform', 'React + Vite'],
          ['Database', 'Google Sheets via Apps Script'],
          ['Scanner', '@zxing/library (kamera)'],
          ['Dibuat oleh', 'Muhamad Aliyudin · PEMULAOLD'],
        ].map(([label, val], i, arr) => (
          <div key={label} style={{ ...s.aboutRow, border: i === arr.length - 1 ? 'none' : undefined }}>
            <span style={s.aboutLabel}>{label}</span>
            <span style={s.aboutVal}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const s = {
  titleRow:   { display: 'flex', alignItems: 'center', gap: 10 },
  titleIcon:  { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 20, fontWeight: 700, color: '#0F172A' },
  card:       { padding: 18, marginBottom: 14 },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle:  { fontSize: 15, fontWeight: 700, color: '#1E293B' },
  statusRow:  { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 10, border: '1.5px solid', marginBottom: 4 },
  stepList:   { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 },
  step:       { display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#334155', lineHeight: 1.5 },
  stepNum:    { flexShrink: 0, width: 20, height: 20, background: '#EFF6FF', color: '#2563EB', borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  aboutRow:   { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' },
  aboutLabel: { fontSize: 13, color: '#64748B' },
  aboutVal:   { fontSize: 13, fontWeight: 600, color: '#1E293B', textAlign: 'right', maxWidth: '60%' },
}
