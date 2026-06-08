import { useState } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '../firebase/authService'
import {
  useAdminNotifications,
  useUserNotifications,
  markPickupStatusAsSeen,
} from '../hooks/useNotifications'

// Badge kecil di sebelah label menu 

function NavBadge({ count }) {
  if (!count) return null
  return (
    <span style={{
      marginLeft: 'auto',
      minWidth: 18, height: 18,
      background: '#ef4444', color: 'white',
      borderRadius: 99, fontSize: '0.65rem', fontWeight: 800,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 5px', lineHeight: 1,
      animation: 'badgePop 0.3s ease',
      flexShrink: 0,
    }}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

// Badge dot kecil di atas icon
function DotBadge({ show }) {
  if (!show) return null
  return (
    <span style={{
      position: 'absolute', top: 4, right: 4,
      width: 8, height: 8, borderRadius: '50%',
      background: '#ef4444',
      border: '2px solid white',
      animation: 'badgePop 0.3s ease',
    }} />
  )
}

// ── Layout utama ──────────────────────────────────────────────────────────────

export default function Layout({ user, onLogout }) {
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  const location = useLocation()
  const navigate = useNavigate()

  // Ambil notifikasi sesuai role
  const adminNotif = useAdminNotifications()   
  const userNotif  = useUserNotifications(user?.role === 'user' ? user?.uid : null)

  const isAdmin = user?.role === 'admin'

  // Peta path → jumlah badge
  const badgeMap = isAdmin
    ? {
        '/admin/antar-jemput':    adminNotif.antarJemput,
        '/admin/form-pemesanan':  adminNotif.orders,
      }
    : {
        '/user/status-penjemputan': userNotif.statusPenjemputan,
      }

  const adminMenu = [
    { path: '/admin/dashboard',          icon: '📊', label: 'Dashboard' },
    { path: '/admin/form-pemesanan',     icon: '📝', label: 'Form Pemesanan' },
    { path: '/admin/form-pembayaran',    icon: '💳', label: 'Pembayaran' },
    { path: '/admin/status-cucian',      icon: '🔄', label: 'Status Cucian' },
    { path: '/admin/detail-pesanan',     icon: '👥', label: 'Detail Pesanan' },
    { path: '/admin/laporan',            icon: '📈', label: 'Laporan' },
    { path: '/admin/profil',             icon: '👤', label: 'Profil' },
    { path: '/admin/antar-jemput',       icon: '🛵', label: 'Sistem Antar Jemput' },
  ]

  const userMenu = [
    { path: '/user/dashboard',           icon: '🏠', label: 'Dashboard' },
    { path: '/user/antar-jemput',        icon: '🛵', label: 'Antar Jemput' },
    { path: '/user/status-penjemputan',  icon: '🚚', label: 'Status Penjemputan' },
    { path: '/user/status-cucian',       icon: '🔄', label: 'Status Cucian' },
    { path: '/user/profil',              icon: '👤', label: 'Profil' },
  ]

  const menuItems = isAdmin ? adminMenu : userMenu

  const handleLogout = async () => {
    try {
      await logout()
      if (onLogout) onLogout()
      navigate('/', { replace: true })
    } catch (err) {
      console.log('Logout error:', err)
    }
  }

  const handleNavClick = (path) => {
    setMobileOpen(false)

    if (!isAdmin && path === '/user/status-penjemputan') {
    }
  }

  const currentPage =
    menuItems.find((m) => location.pathname.startsWith(m.path))?.label || ''

  const inisial = (user?.nama || user?.email || 'U').charAt(0).toUpperCase()

  // Total badge untuk topbar mobile
  const totalBadge = isAdmin ? adminNotif.total : userNotif.total

  return (
    <div className="app-layout">
      <style>{`
        @keyframes badgePop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>

        <div className="sidebar-logo">
          <h1>🧺 AA NUY</h1>
          <p>{isAdmin ? 'Admin Panel' : 'Pelanggan'}</p>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const badge   = badgeMap[item.path] || 0
            const active  = location.pathname.startsWith(item.path)

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
                title={collapsed ? item.label : ''}
                style={{ position: 'relative' }}
              >
                <span className="nav-icon">{item.icon}</span>

                {/* Dot badge saat sidebar collapsed */}
                {collapsed && <DotBadge show={badge > 0} />}

                <span className="nav-label" style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 4 }}>
                  {item.label}
                  {/* Badge count saat sidebar terbuka */}
                  {!collapsed && <NavBadge count={badge} />}
                </span>
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid #f1f5f9' }}>
          {!collapsed && (
            <div style={{
              padding: '8px 12px', marginBottom: 8,
              background: '#f8fafc', borderRadius: 10,
              overflow: 'hidden',
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>
                {user?.nama || 'Pengguna'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {user?.email}
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="nav-item"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
            title={collapsed ? 'Logout' : ''}
          >
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <button
            className="topbar-toggle"
            style={{ position: 'relative' }}
            onClick={() => {
              if (window.innerWidth < 768) setMobileOpen(!mobileOpen)
              else setCollapsed(!collapsed)
            }}
          >
            ☰
            {/* Dot merah di tombol hamburger jika ada notif & sidebar tertutup (mobile) */}
            {totalBadge > 0 && !mobileOpen && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                width: 8, height: 8, borderRadius: '50%',
                background: '#ef4444', border: '2px solid white',
              }} />
            )}
          </button>

          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
              {currentPage}
            </h2>
          </div>

          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            onClick={() => navigate(isAdmin ? '/admin/profil' : '/user/profil')}
          >
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: '0.85rem',
              }}>
                {inisial}
              </div>
              {/* Dot merah di avatar jika ada notif */}
              {totalBadge > 0 && (
                <span style={{
                  position: 'absolute', top: 0, right: 0,
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#ef4444', border: '2px solid white',
                }} />
              )}
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                {user?.nama || 'Pengguna'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                {user?.role || 'user'}
              </div>
            </div>
          </div>
        </header>

        <div className="page-content">
          <div className="page-container">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}