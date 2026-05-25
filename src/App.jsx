import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import StockIn from './pages/StockIn'
import StockOut from './pages/StockOut'
import Search from './pages/Search'
import StockList from './pages/StockList'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/masuk" element={<StockIn />} />
        <Route path="/keluar" element={<StockOut />} />
        <Route path="/cari" element={<Search />} />
        <Route path="/stok" element={<StockList />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <Navbar />
      <div style={credit}>
        Dibuat oleh&nbsp;<strong>Muhamad Aliyudin</strong>&nbsp;
        <span style={tag}>PEMULAOLD</span>
      </div>
    </BrowserRouter>
  )
}

const credit = {
  position: 'fixed',
  bottom: 62,
  left: 0,
  right: 0,
  textAlign: 'center',
  fontSize: 11,
  color: '#94A3B8',
  pointerEvents: 'none',
  zIndex: 99,
  letterSpacing: 0.2,
}

const tag = {
  display: 'inline-block',
  background: '#EFF6FF',
  color: '#2563EB',
  fontWeight: 700,
  fontSize: 10,
  padding: '1px 7px',
  borderRadius: 99,
  letterSpacing: 0.5,
}
