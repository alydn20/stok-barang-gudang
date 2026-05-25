import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
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
      <Layout>
        <Routes>
          <Route path="/"        element={<Home />}      />
          <Route path="/masuk"   element={<StockIn />}   />
          <Route path="/keluar"  element={<StockOut />}  />
          <Route path="/cari"    element={<Search />}    />
          <Route path="/stok"    element={<StockList />} />
          <Route path="/settings"element={<Settings />}  />
        </Routes>
      </Layout>
      <Navbar />
    </BrowserRouter>
  )
}
