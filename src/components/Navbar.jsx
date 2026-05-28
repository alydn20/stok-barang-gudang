import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PackagePlus, PackageMinus, ScanSearch, LayoutList, ClipboardList, Settings2 } from 'lucide-react'

const nav = [
  { to: '/',          icon: LayoutDashboard, label: 'Beranda'  },
  { to: '/masuk',     icon: PackagePlus,     label: 'Masuk'    },
  { to: '/keluar',    icon: PackageMinus,    label: 'Keluar'   },
  { to: '/cari',      icon: ScanSearch,      label: 'Cari'     },
  { to: '/stok',      icon: LayoutList,      label: 'Stok'     },
  { to: '/riwayat',   icon: ClipboardList,   label: 'Riwayat'  },
  { to: '/settings',  icon: Settings2,       label: 'Setelan'  },
]

// Bottom nav — visible on mobile only, hidden on desktop via CSS
export default function Navbar() {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `bottom-nav-link${isActive ? ' active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <span className="bottom-nav-icon">
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                </span>
                <span className="bottom-nav-label">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
