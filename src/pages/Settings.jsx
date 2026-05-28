import React, { useState, useEffect } from 'react'
import {
  CheckCircle2, XCircle, Save, Wifi,
  Settings2, Info, Loader2, Server,
  HardDrive, Cloud, SlidersHorizontal, CalendarClock,
  BellRing, ExternalLink,
} from 'lucide-react'
import { sheetsApi } from '../services/sheetsApi'

const LS_KEY      = 'gas_url'
const LS_STRATEGY = 'stockout_strategy'
export const LS_EXP_DAYS = 'exp_threshold_days'

const EXP_PRESETS = [7, 14, 30, 60, 90]

const STRATEGIES = [
  { val: 'FEFO',   label: 'Auto FEFO',  desc: 'Batch exp. paling dekat diambil duluan (default)' },
  { val: 'LIFO',   label: 'Auto LIFO',  desc: 'Batch exp. paling jauh diambil duluan' },
  { val: 'MANUAL', label: 'Manual',     desc: 'Selalu pilih batch sendiri, tidak ada auto' },
]

export default function Settings() {
  const [gasUrl,     setGasUrl]     = useState('')
  const [saving,     setSaving]     = useState(false)
  const [testing,    setTesting]    = useState(false)
  const [saveResult, setSaveResult] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [source,     setSource]     = useState('')
  const [strategy,       setStrategy]       = useState(localStorage.getItem(LS_STRATEGY) || 'MANUAL')
  const [expDays,        setExpDays]        = useState(Number(localStorage.getItem(LS_EXP_DAYS) || 30))

  useEffect(() => {
    // Load GAS URL
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

    // Load expDays dari GAS
    sheetsApi.getSettings()
      .then(d => {
        if (d.expDays != null) {
          const n = Number(d.expDays)
          setExpDays(n)
          localStorage.setItem(LS_EXP_DAYS, String(n))
        }
      })
      .catch(() => {})
  }, [])

  const handleStrategyChange = (val) => {
    setStrategy(val)
    localStorage.setItem(LS_STRATEGY, val)
  }

  const handleExpDaysChange = (val) => {
    const n = Math.max(1, Math.min(365, Number(val)))
    setExpDays(n)
    localStorage.setItem(LS_EXP_DAYS, String(n))
    sheetsApi.saveSettings({ expDays: n }).catch(() => {})
  }

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

      {/* Strategi Barang Keluar */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}>
          <SlidersHorizontal size={18} color="#DC2626" />
          <h3 style={s.cardTitle}>Strategi Barang Keluar</h3>
        </div>
        <p style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>Urutan pengambilan batch saat barang keluar</p>
        {STRATEGIES.map(opt => (
          <button key={opt.val} type="button"
            onClick={() => handleStrategyChange(opt.val)}
            style={{ ...s.stratOption, ...(strategy === opt.val ? s.stratActive : {}) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: strategy === opt.val ? '#2563EB' : '#1E293B' }}>{opt.label}</span>
              {strategy === opt.val && <CheckCircle2 size={16} color="#2563EB" />}
            </div>
            <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{opt.desc}</p>
          </button>
        ))}
      </div>

      {/* Batas Kadaluarsa */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}>
          <CalendarClock size={18} color="#D97706" />
          <h3 style={s.cardTitle}>Batas Peringatan Kadaluarsa</h3>
        </div>
        <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
          Tampilkan label "Segera Exp" jika kadaluarsa dalam &lt;= <strong>{expDays} hari</strong>
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {EXP_PRESETS.map(d => (
            <button key={d} type="button"
              onClick={() => handleExpDaysChange(d)}
              style={{ ...s.expBtn, ...(expDays === d ? s.expBtnActive : {}) }}>
              {d} hari
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label className="label" style={{ whiteSpace: 'nowrap', margin: 0 }}>Custom:</label>
          <input
            className="input"
            type="number"
            min={1} max={365}
            value={expDays}
            onChange={e => handleExpDaysChange(e.target.value)}
            style={{ width: 80, textAlign: 'center' }}
          />
          <span style={{ fontSize: 12, color: '#64748B' }}>hari</span>
        </div>
      </div>

      {/* Notifikasi Telegram */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}>
          <BellRing size={18} color="#0EA5E9" />
          <h3 style={s.cardTitle}>Notifikasi Telegram</h3>
        </div>
        <p style={{ fontSize: 12, color: '#64748B', marginBottom: 14, lineHeight: 1.7 }}>
          Laporan harian otomatis dikirim setiap hari pukul <strong>07:00 WIB</strong>.
          Follow bot terlebih dahulu, lalu kirim pesan sambutan.
        </p>
        <a href="https://t.me/StokBarangByAliyudin_BOT" target="_blank" rel="noopener noreferrer"
          style={s.tgFollowBtn}>
          <BellRing size={15} />
          Follow @StokBarangByAliyudin_BOT
          <ExternalLink size={13} style={{ marginLeft: 'auto' }} />
        </a>
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 8, textAlign: 'center' }}>
          Buka bot → klik <strong>Start</strong> → pesan sambutan otomatis terkirim
        </p>
      </div>

      {/* Tentang */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}><Info size={18} color="#64748B" /><h3 style={s.cardTitle}>Tentang</h3></div>
        {[
          ['Versi',      '1.0.0'],
          ['Platform',   'React + Vite'],
          ['Database',   'Google Sheets'],
          ['Dibuat oleh','Muhamad Aliyudin'],
        ].map(([l, v], i, a) => (
          <div key={l} style={{ ...s.aboutRow, borderBottom: i === a.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
            <span style={s.aboutLabel}>{l}</span>
            <span style={l === 'Dibuat oleh' ? s.aboutCredit : s.aboutVal}>{v}</span>
          </div>
        ))}
        <div style={s.creditTag}>PEMULAOLD</div>
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
  aboutRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' },
  aboutLabel:  { fontSize: 13, color: '#64748B' },
  aboutVal:    { fontSize: 13, fontWeight: 600, color: '#1E293B', textAlign: 'right' },
  aboutCredit: { fontSize: 13, fontWeight: 700, color: '#2563EB' },
  creditTag:   { marginTop: 10, display: 'inline-block', background: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: 11, padding: '3px 12px', borderRadius: 99, letterSpacing: 0.5 },
  stratOption: { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', textAlign: 'left', width: '100%', marginBottom: 6, display: 'block' },
  stratActive: { borderColor: '#2563EB', background: '#EFF6FF' },
  expBtn:        { padding: '6px 14px', borderRadius: 99, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748B' },
  expBtnActive:  { borderColor: '#D97706', background: '#FFFBEB', color: '#92400E' },
  tgFollowBtn:   { display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 10, background: '#0EA5E9', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', width: '100%', boxSizing: 'border-box' },
}
