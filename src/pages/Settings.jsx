import React, { useState, useEffect } from 'react'
import {
  CheckCircle2, XCircle, Save, Wifi,
  Settings2, Info, Loader2, Server,
  HardDrive, Cloud,
} from 'lucide-react'
import { sheetsApi } from '../services/sheetsApi'

const LS_KEY = 'gas_url'

export default function Settings() {
  const [gasUrl,     setGasUrl]     = useState('')
  const [saving,     setSaving]     = useState(false)
  const [testing,    setTesting]    = useState(false)
  const [saveResult, setSaveResult] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [source,     setSource]     = useState('')

  useEffect(() => {
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

  const handleSave = () => {
    if (!gasUrl.trim()) return setSaveResult({ ok: false, msg: 'URL tidak boleh kosong.' })
    localStorage.setItem(LS_KEY, gasUrl.trim())
    sheetsApi.resetCache()
    setSource('local')
    setSaveResult({ ok: true, msg: 'URL tersimpan.' })
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
    ? { text: 'URL dari server (Vercel env)', color: '#166534', bg: '#F0FDF4', border: '#BBF7D0', icon: <Cloud size={13} /> }
    : source === 'local'
    ? { text: 'Tersimpan di browser ini', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', icon: <HardDrive size={13} /> }
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

      <div className="settings-layout">

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
            {sourceLabel && (
              <div style={{ ...s.sourceBadge, background: sourceLabel.bg, border: `1px solid ${sourceLabel.border}`, color: sourceLabel.color }}>
                {sourceLabel.icon}
                {sourceLabel.text}
              </div>
            )}

            <label className="label" style={{ marginTop: 12 }}>URL Apps Script</label>
            <textarea
              className="input"
              value={gasUrl}
              onChange={e => { if (source !== 'server') { setGasUrl(e.target.value); setSaveResult(null); setTestResult(null) } }}
              placeholder="https://script.google.com/macros/s/.../exec"
              rows={3}
              readOnly={source === 'server'}
              style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13, opacity: source === 'server' ? 0.7 : 1, cursor: source === 'server' ? 'not-allowed' : 'text' }}
            />

            {source === 'server' && (
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 6, lineHeight: 1.6 }}>
                URL dikunci dari server. Untuk mengubah: buka <strong>Vercel → Settings → Environments → Production</strong> → edit variabel <code style={{ background: '#F1F5F9', padding: '1px 5px', borderRadius: 4 }}>GAS_URL</code> → Redeploy.
              </div>
            )}

            {(saveResult || testResult) && (
              <div className={`alert ${(saveResult || testResult).ok ? 'alert-success' : 'alert-danger'} fade-in`} style={{ marginTop: 10 }}>
                {(saveResult || testResult).ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {(saveResult || testResult).msg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={handleTest} disabled={testing || !gasUrl.trim()} className="btn btn-ghost" style={{ flex: 1 }}>
                {testing ? <><Loader2 size={15} className="spin" /> Menguji...</> : <><Wifi size={15} /> Test Koneksi</>}
              </button>
              {source !== 'server' && (
                <button onClick={handleSave} disabled={!gasUrl.trim()} className="btn btn-primary" style={{ flex: 1 }}>
                  <Save size={15} /> Simpan
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Tentang */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}><Info size={18} color="#64748B" /><h3 style={s.cardTitle}>Tentang</h3></div>
        {[
          ['Versi',    '1.0.0'],
          ['Platform', 'React + Vite'],
          ['Database', 'Google Sheets'],
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
  loadingRow:  { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: '#64748B', fontSize: 13 },
  sourceBadge: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 4 },
  aboutRow:    { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' },
  aboutLabel:  { fontSize: 13, color: '#64748B' },
  aboutVal:    { fontSize: 13, fontWeight: 600, color: '#1E293B', textAlign: 'right' },
}
