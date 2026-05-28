import React from 'react'
import { ClipboardList } from 'lucide-react'
import HistoryPanel from '../components/HistoryPanel'

export default function History() {
  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={20} color="#7C3AED" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>Riwayat</h2>
        </div>
      </div>
      <HistoryPanel />
    </div>
  )
}
