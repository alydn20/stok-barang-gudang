import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PackagePlus, PackageMinus, ScanSearch, LayoutList, Settings2 } from 'lucide-react'

const nav = [
  { to: '/',        icon: LayoutDashboard, label: 'Beranda'  },
  { to: '/masuk',   icon: PackagePlus,     label: 'Masuk'    },
  { to: '/keluar',  icon: PackageMinus,    label: 'Keluar'   },
  { to: '/cari',    icon: ScanSearch,      label: 'Cari'     },
  { to: '/stok',    icon: LayoutList,      label: 'Stok'     },
  { to: '/settings',icon: Settings2,       label: 'Setelan'  },
]

export default function Navbar() {
  return (
    <nav style={s.nav}>
      <div style={s.inner}>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({ ...s.link, ...(isActive ? s.active : {}) })}
          >
            {({ isActive }) => (
              <>
                <span style={{ ...s.iconWrap, ...(isActive ? s.iconWrapActive : {}) }}>
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                </span>
                <span style={s.label}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

const s = {
  nav: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: '#fff',
    borderTop: '1px solid #E2E8F0',
    zIndex: 100,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  inner: {
    maxWidth: 520,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '6px 4px 8px',
  },
  link: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    textDecoration: 'none', color: '#94A3B8',
    flex: 1, padding: '2px 4px',
    borderRadius: 8,
  },
  active: { color: '#2563EB' },
  iconWrap: {
    width: 36, height: 28,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapActive: { background: '#EFF6FF' },
  label: { fontSize: 10, fontWeight: 500, lineHeight: 1 },
}
