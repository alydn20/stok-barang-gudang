import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, PackagePlus, PackageMinus, Search, List, Settings } from 'lucide-react'

const nav = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/masuk', icon: PackagePlus, label: 'Masuk' },
  { to: '/keluar', icon: PackageMinus, label: 'Keluar' },
  { to: '/cari', icon: Search, label: 'Cari' },
  { to: '/stok', icon: List, label: 'Stok' },
  { to: '/settings', icon: Settings, label: 'Setting' },
]

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      {nav.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.active : {}) })} end={to === '/'}>
          <Icon size={22} />
          <span style={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

const styles = {
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', zIndex: 100 },
  link: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none', color: '#999', fontSize: 10, padding: '4px 8px', borderRadius: 8 },
  active: { color: '#1976d2' },
  label: { fontSize: 10 },
}
