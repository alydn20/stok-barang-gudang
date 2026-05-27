import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PackagePlus, PackageMinus, ScanSearch, LayoutList, Settings2, Boxes } from 'lucide-react'

const nav = [
  { to: '/',         icon: LayoutDashboard, label: 'Beranda'  },
  { to: '/masuk',    icon: PackagePlus,     label: 'Masuk'    },
  { to: '/keluar',   icon: PackageMinus,    label: 'Keluar'   },
  { to: '/cari',     icon: ScanSearch,      label: 'Cari'     },
  { to: '/stok',     icon: LayoutList,      label: 'Stok'     },
]

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Boxes size={20} color="#fff" />
          </div>
          <div className="sidebar-brand-texts">
            <span className="sidebar-brand-name">Stok Gudang</span>
            <span className="sidebar-brand-sub">Manajemen Inventaris</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="sidebar-link-icon">
                <Icon size={17} strokeWidth={1.9} />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="sidebar-divider" />

          <NavLink
            to="/settings"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-link-icon">
              <Settings2 size={17} strokeWidth={1.9} />
            </span>
            <span>Setelan</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-row">
            <div className="sidebar-footer-avatar">A</div>
            <div>
              <span className="sidebar-footer-name">Aliyudin</span>
              <span className="sidebar-footer-tag">Admin</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-content">
        {children}
      </div>
    </div>
  )
}
