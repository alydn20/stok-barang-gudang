import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Navbar from './components/Navbar'
import InstallGate from './components/InstallGate'
import UpdateGate from './components/UpdateGate'
import Home from './pages/Home'
import StockIn from './pages/StockIn'
import StockOut from './pages/StockOut'
import Search from './pages/Search'
import StockList from './pages/StockList'
import History from './pages/History'
import Settings from './pages/Settings'

export default function App() {
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(d => { if (d.expDays != null) localStorage.setItem('exp_threshold_days', String(d.expDays)) })
      .catch(() => {})
  }, [])

  return (
    <BrowserRouter>
      <UpdateGate>
        <InstallGate>
          <Layout>
            <Routes>
              <Route path="/"        element={<Home />}      />
              <Route path="/masuk"   element={<StockIn />}   />
              <Route path="/keluar"  element={<StockOut />}  />
              <Route path="/cari"    element={<Search />}    />
              <Route path="/stok"     element={<StockList />} />
              <Route path="/riwayat" element={<History />}   />
              <Route path="/settings"element={<Settings />}  />
            </Routes>
          </Layout>
          <Navbar />
        </InstallGate>
      </UpdateGate>
    </BrowserRouter>
  )
}
