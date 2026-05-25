import React, { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Save, Wifi, WifiOff, Settings2, BookOpen, Info, Loader2, Server, KeyRound } from 'lucide-react'
import { sheetsApi } from '../services/sheetsApi'

const ADMIN_KEY_LOCAL = 'admin_key'

export default function Settings() {
  const [gasUrl,    setGasUrl]    = useState('')
  const [adminKey,  setAdminKey]  = useState(() => localStorage.getItem(ADMIN_KEY_LOCAL) || '')
  const [saving,    setSaving]    = useState(false)
  const [testing,   setTesting]   = useState(false)
  const [saveResult, setSaveResult] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [loading,   setLoading]   = useState(true)

  // Ambil URL aktif dari server saat halaman dibuka
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(d => { if (d.gasUrl) setGasUrl(d.gasUrl) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!gasUrl.trim()) return setSaveResult({ ok: false, msg: 'URL tidak boleh kosong.' })
    if (!adminKey.trim()) return setSaveResult({ ok: false, msg: 'Admin key wajib diisi.' })

    setSaving(true); setSaveResult(null)
    localStorage.setItem(ADMIN_KEY_LOCAL, adminKey)

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gasUrl: gasUrl.trim(), adminKey: adminKey.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setSaveResult({ ok: true, msg: 'URL berhasil disimpan ke server. Semua perangkat otomatis pakai URL ini.' })
        sheetsApi.resetCache()
      } else {
        setSaveResult({ ok: false, msg: data.error || 'Gagal menyimpan.' })
      }
    } catch (e) {
      setSaveResult({ ok: false, msg: 'Tidak dapat terhubung ke server: ' + e.message })
    } finally { setSaving(false) }
  }

  const handleTest = async () => {
    if (!gasUrl.trim()) return
    setTesting(true); setTestResult(null)
    try {
      const res  = await fetch(`${gasUrl.trim()}?action=ping`)
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

      {/* Config card */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}>
          <Server size={18} color="#2563EB" />
          <h3 style={s.cardTitle}>URL Google Apps Script</h3>
        </div>
        <p style={s.desc}>URL ini disimpan di server Vercel — berlaku untuk semua perangkat secara otomatis.</p>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: '#64748B', fontSize: 13 }}>
            <Loader2 size={16} className="spin" /> Memuat konfigurasi dari server...
          </div>
        ) : (
          <>
            <label className="label" style={{ marginTop: 12 }}>URL Apps Script</label>
            <textarea
              className="input"
              value={gasUrl}
              onChange={e => setGasUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              rows={3}
              style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
            />

            <label className="label" style={{ marginTop: 10 }}>
              <KeyRound size={13} /> Admin Key
            </label>
            <input
              className="input"
              type="password"
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              placeholder="Isi sesuai ADMIN_KEY di Vercel env"
            />
            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Admin key disimpan di browser ini saja, tidak dikirim ke mana-mana kecuali saat menekan Simpan.</p>

            {(saveResult || testResult) && (
              <div className={`alert ${(saveResult || testResult).ok ? 'alert-success' : 'alert-danger'} fade-in`} style={{ marginTop: 10 }}>
                {(saveResult || testResult).ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {(saveResult || testResult).msg}
              </div>
            )}

            <div style={s.btnRow}>
              <button onClick={handleTest} disabled={testing || !gasUrl.trim()} className="btn btn-ghost" style={{ flex: 1 }}>
                {testing ? <><Loader2 size={15} className="spin" /> Menguji...</> : <><Wifi size={15} /> Test</>}
              </button>
              <button onClick={handleSave} disabled={saving || !gasUrl.trim()} className="btn btn-primary" style={{ flex: 2 }}>
                {saving ? <><Loader2 size={15} className="spin" /> Menyimpan...</> : <><Save size={15} /> Simpan ke Server</>}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Setup Vercel KV */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}>
          <BookOpen size={18} color="#7C3AED" />
          <h3 style={s.cardTitle}>Setup Vercel KV (sekali saja)</h3>
        </div>
        <ol style={s.stepList}>
          {[
            'Buka dashboard.vercel.com → tab Storage.',
            'Klik Create → pilih KV (Redis) → beri nama → Create.',
            'Klik Connect to Project → pilih stok-barang-gudang.',
            'Buka tab Settings → Environment Variables.',
            'Tambah: Key = ADMIN_KEY, Value = password pilihan kamu.',
            'Klik Save, lalu Redeploy project.',
            'Setelah itu, URL bisa disimpan langsung dari halaman ini.',
          ].map((step, i) => (
            <li key={i} style={s.step}>
              <span style={s.stepNum}>{i + 1}</span><span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Apps Script guide */}
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
            'Deploy → New deployment → Web app.',
            'Execute as: Me — Access: Anyone.',
            'Copy URL yang muncul, paste di kolom atas.',
          ].map((step, i) => (
            <li key={i} style={s.step}>
              <span style={s.stepNum}>{i + 1}</span><span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* About */}
      <div className="card" style={s.card}>
        <div style={s.cardHeader}><Info size={18} color="#64748B" /><h3 style={s.cardTitle}>Tentang</h3></div>
        {[['Versi','1.0.0'],['Platform','React + Vite'],['Database','Google Sheets'],['Dibuat oleh','Muhamad Aliyudin · PEMULAOLD']].map(([l,v],i,a)=>(
          <div key={l} style={{...s.aboutRow,border:i===a.length-1?'none':undefined}}>
            <span style={s.aboutLabel}>{l}</span><span style={s.aboutVal}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const s = {
  titleRow:   { display:'flex',alignItems:'center',gap:10 },
  titleIcon:  { width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center' },
  title:      { fontSize:20,fontWeight:700,color:'#0F172A' },
  card:       { padding:18,marginBottom:14 },
  cardHeader: { display:'flex',alignItems:'center',gap:8,marginBottom:10 },
  cardTitle:  { fontSize:15,fontWeight:700,color:'#1E293B' },
  desc:       { fontSize:13,color:'#64748B',lineHeight:1.6 },
  btnRow:     { display:'flex',gap:8,marginTop:12 },
  stepList:   { listStyle:'none',display:'flex',flexDirection:'column',gap:8 },
  step:       { display:'flex',gap:10,alignItems:'flex-start',fontSize:13,color:'#334155',lineHeight:1.5 },
  stepNum:    { flexShrink:0,width:20,height:20,background:'#EFF6FF',color:'#2563EB',borderRadius:99,fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',marginTop:1 },
  aboutRow:   { display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F1F5F9' },
  aboutLabel: { fontSize:13,color:'#64748B' },
  aboutVal:   { fontSize:13,fontWeight:600,color:'#1E293B',textAlign:'right',maxWidth:'60%' },
}
