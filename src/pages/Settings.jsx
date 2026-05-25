import React, { useState, useEffect } from 'react'
import {
  CheckCircle2, XCircle, Save, Wifi, Settings2,
  BookOpen, Info, Loader2, Server, KeyRound,
  HardDrive, Cloud,
} from 'lucide-react'
import { sheetsApi } from '../services/sheetsApi'

const LS_KEY       = 'gas_url'
const ADMIN_LS_KEY = 'admin_key'

export default function Settings() {
  const [gasUrl,     setGasUrl]     = useState('')
  const [adminKey,   setAdminKey]   = useState(() => localStorage.getItem(ADMIN_LS_KEY) || '')
  const [saving,     setSaving]     = useState(false)
  const [testing,    setTesting]    = useState(false)
  const [saveResult, setSaveResult] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [source,     setSource]     = useState('') // 'server' | 'local' | ''

  useEffect(() => {
    // Coba baca dari server dulu, fallback localStorage
    fetch('/api/config')
      .then(r => r.json())
      .then(d => {
        if (d.gasUrl) { setGasUrl(d.gasUrl); setSource('server') }
        else {
          const local = localStorage.getItem(LS_KEY)
          if (local) { setGasUrl(local); setSource('local') }
        }
      })
      .catch(() => {
        const local = localStorage.getItem(LS_KEY)
        if (local) { setGasUrl(local); setSource('local') }
      })
      .finally(() => setLoading(false))
  }, [])

  // Simpan ke browser (localStorage) — langsung, tanpa perlu KV
  const handleSaveLocal = () => {
    if (!gasUrl.trim()) return setSaveResult({ ok: false, msg: 'URL tidak boleh kosong.' })
    localStorage.setItem(LS_KEY, gasUrl.trim())
    sheetsApi.resetCache()
    setSource('local')
    setSaveResult({ ok: true, msg: 'URL tersimpan di browser ini. Untuk semua perangkat, gunakan Simpan ke Server.' })
  }

  // Simpan ke server (Vercel KV) — berlaku semua perangkat
  const handleSaveServer = async () => {
    if (!gasUrl.trim())   return setSaveResult({ ok: false, msg: 'URL tidak boleh kosong.' })
    if (!adminKey.trim()) return setSaveResult({ ok: false, msg: 'Admin key wajib diisi untuk simpan ke server.' })
    setSaving(true); setSaveResult(null)
    localStorage.setItem(ADMIN_LS_KEY, adminKey)
    try {
      const res  = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gasUrl: gasUrl.trim(), adminKey: adminKey.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem(LS_KEY, gasUrl.trim())
        sheetsApi.resetCache()
        setSource('server')
        setSaveResult({ ok: true, msg: 'URL tersimpan di server. Semua perangkat otomatis pakai URL ini.' })
      } else {
        setSaveResult({ ok: false, msg: data.error || 'Gagal menyimpan ke server.' })
      }
    } catch (e) {
      setSaveResult({ ok: false, msg: 'Tidak dapat terhubung ke server: ' + e.message })
    } finally { setSaving(false) }
  }

  const handleTest = async () => {
    if (!gasUrl.trim()) return
    setTesting(true); setTestResult(null)
    try {
      const res  = await fetch(`/api/gas?${new URLSearchParams({ _url: gasUrl.trim(), action: 'ping' })}`)
      const data = await res.json()
      setTestResult({ ok: data.status === 'ok', msg: data.status === 'ok' ? 'Koneksi ke Google Sheets berhasil.' : 'Server merespons tapi status tidak valid: ' + JSON.stringify(data) })
    } catch (e) {
      setTestResult({ ok: false, msg: 'Gagal terhubung: ' + e.message })
    } finally { setTesting(false) }
  }

  const sourceLabel = source === 'server'
    ? { text: 'Tersimpan di server (semua perangkat)', color: '#166534', bg: '#F0FDF4', border: '#BBF7D0' }
    : source === 'local'
    ? { text: 'Tersimpan di browser ini saja', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' }
    : null

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

      {/* URL Config */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}>
          <Server size={18} color="#2563EB" />
          <h3 style={s.cardTitle}>URL Google Apps Script</h3>
        </div>

        {loading ? (
          <div style={s.loadingRow}><Loader2 size={16} className="spin" /> Memuat konfigurasi...</div>
        ) : (
          <>
            {/* Status badge */}
            {sourceLabel && (
              <div style={{ ...s.sourceBadge, background: sourceLabel.bg, border: `1px solid ${sourceLabel.border}`, color: sourceLabel.color }}>
                {source === 'server' ? <Cloud size={13} /> : <HardDrive size={13} />}
                {sourceLabel.text}
              </div>
            )}

            <label className="label" style={{ marginTop: 12 }}>URL Apps Script</label>
            <textarea
              className="input"
              value={gasUrl}
              onChange={e => { setGasUrl(e.target.value); setSaveResult(null) }}
              placeholder="https://script.google.com/macros/s/.../exec"
              rows={3}
              style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
            />

            {/* Feedback */}
            {(saveResult || testResult) && (
              <div className={`alert ${(saveResult || testResult).ok ? 'alert-success' : 'alert-danger'} fade-in`} style={{ marginTop: 10 }}>
                {(saveResult || testResult).ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {(saveResult || testResult).msg}
              </div>
            )}

            {/* Test */}
            <button onClick={handleTest} disabled={testing || !gasUrl.trim()} className="btn btn-ghost btn-full" style={{ marginTop: 10 }}>
              {testing ? <><Loader2 size={15} className="spin" /> Menguji...</> : <><Wifi size={15} /> Test Koneksi</>}
            </button>

            <div style={s.dividerRow}><span style={s.dividerLine}/><span style={s.dividerText}>Pilih cara menyimpan</span><span style={s.dividerLine}/></div>

            {/* Simpan ke Browser */}
            <button onClick={handleSaveLocal} disabled={!gasUrl.trim()} className="btn btn-ghost btn-full" style={{ border: '1.5px solid #FDE68A', color: '#92400E', background: '#FFFBEB', marginBottom: 8 }}>
              <HardDrive size={15} /> Simpan ke Browser <span style={{ fontSize: 12, fontWeight: 400 }}>(browser ini saja)</span>
            </button>

            {/* Simpan ke Server */}
            <div style={s.serverSection}>
              <label className="label" style={{ marginBottom: 6 }}>
                <KeyRound size={13} /> Admin Key <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>— butuh Vercel KV</span>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  type="password"
                  value={adminKey}
                  onChange={e => setAdminKey(e.target.value)}
                  placeholder="Password dari ADMIN_KEY Vercel"
                  style={{ flex: 1 }}
                />
                <button onClick={handleSaveServer} disabled={saving || !gasUrl.trim()} className="btn btn-primary" style={{ flexShrink: 0 }}>
                  {saving ? <Loader2 size={15} className="spin" /> : <><Cloud size={15} /> Simpan ke Server</>}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="settings-layout">

      {/* Setup Vercel KV */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}>
          <BookOpen size={18} color="#7C3AED" />
          <h3 style={s.cardTitle}>Setup Vercel KV <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>(opsional)</span></h3>
        </div>
        <p style={s.desc}>Agar URL tersimpan di server dan berlaku untuk semua perangkat.</p>
        <ol style={s.stepList}>
          {[
            'Buka dashboard.vercel.com → tab Storage.',
            'Klik Create → pilih KV → beri nama → Create.',
            'Connect to Project → pilih stok-barang-gudang.',
            'Settings → Environment Variables.',
            'Tambah: Key = ADMIN_KEY, Value = password kamu.',
            'Save → Redeploy project.',
          ].map((step, i) => (
            <li key={i} style={s.step}>
              <span style={s.stepNum}>{i + 1}</span><span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Tentang */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}><Info size={18} color="#64748B" /><h3 style={s.cardTitle}>Tentang</h3></div>
        {[
          ['Versi',      '1.0.0'],
          ['Platform',   'React + Vite'],
          ['Database',   'Google Sheets'],
          ['Dibuat oleh','Muhamad Aliyudin · PEMULAOLD'],
        ].map(([l, v], i, a) => (
          <div key={l} style={{ ...s.aboutRow, border: i === a.length - 1 ? 'none' : undefined }}>
            <span style={s.aboutLabel}>{l}</span>
            <span style={s.aboutVal}>{v}</span>
          </div>
        ))}
      </div>

      </div>
    </div>
  )
}

const s = {
  titleRow:    { display: 'flex', alignItems: 'center', gap: 10 },
  titleIcon:   { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 20, fontWeight: 700, color: '#0F172A' },
  card:        { padding: 18, marginBottom: 14 },
  cardHeader:  { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle:   { fontSize: 15, fontWeight: 700, color: '#1E293B' },
  desc:        { fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 10 },
  loadingRow:  { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: '#64748B', fontSize: 13 },
  sourceBadge: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 4 },
  dividerRow:  { display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 10px' },
  dividerLine: { flex: 1, height: 1, background: '#E2E8F0' },
  dividerText: { fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' },
  serverSection: { background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', border: '1px solid #E2E8F0' },
  stepList:    { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 },
  step:        { display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#334155', lineHeight: 1.5 },
  stepNum:     { flexShrink: 0, width: 20, height: 20, background: '#EFF6FF', color: '#2563EB', borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  aboutRow:    { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' },
  aboutLabel:  { fontSize: 13, color: '#64748B' },
  aboutVal:    { fontSize: 13, fontWeight: 600, color: '#1E293B', textAlign: 'right', maxWidth: '60%' },
}
