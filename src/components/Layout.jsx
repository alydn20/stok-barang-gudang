import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PackagePlus, PackageMinus, ScanSearch, LayoutList, Settings2, Boxes } from 'lucide-react'

const nav = [
  { to: '/',         icon: LayoutDashboard, label: 'Beranda'  },
  { to: '/masuk',    icon: PackagePlus,     label: 'Masuk'    },
  { to: '/keluar',   icon: PackageMinus,    label: 'Keluar'   },
  { to: '/cari',     icon: ScanSearch,      label: 'Cari'     },
  { to: '/stok',     icon: LayoutList,      label: 'Stok'     },
  { to: '/settings', icon: Settings2,       label: 'Setelan'  },
]

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      {/* Sidebar — desktop only, hidden on mobile via CSS */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Boxes size={22} color="#2563EB" />
          <span className="sidebar-brand-name">Stok Gudang</span>
        </div>

        <nav className="sidebar-nav">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

      </aside>

      {/* Main content */}
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}
