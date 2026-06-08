// src/App.jsx

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AppProvider } from './context/AppContext'
import { onAuthChange } from './firebase/authService'

import Layout from './components/Layout'

// Auth pages
import LoginLanding   from './pages/LoginLanding'
import UserLogin      from './pages/UserLogin'
import UserRegister   from './pages/UserRegister'
import VerifyEmail    from './pages/VerifyEmail'

// Admin pages
import Dashboard        from './pages/Dashboard'
import FormPemesanan    from './pages/FormPemesanan'
import FormPembayaran   from './pages/FormPembayaran'
import StatusCucian     from './pages/StatusCucian'
import DetailPesanan    from './pages/DetailPesanan'
import Laporan          from './pages/Laporan'
import SistemAntarJemput from './pages/SistemAntarJemput'

// User pages
import UserDashboard    from './pages/UserDashboard'
import UserAntarJemput  from './pages/UserAntarJemput'
import UserStatusCucian from './pages/UserStatusCucian'
import UserRiwayat      from './pages/UserRiwayat'
import UserStatusAntarJemput from './pages/UserStatusAntarJemput'

// Shared
import Profil from './pages/Profil'

// ─── Route guards ────────────────────────────────────────────────────────────
function RequireAdmin({ user, children }) {
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'admin') return <Navigate to="/user/dashboard" replace />
  return children
}

function RequireUser({ user, children }) {
  if (!user) return <Navigate to="/" replace />
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return children
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const unsubscribe = onAuthChange((userData) => setUser(userData))
    return () => unsubscribe()
  }, [])

  if (user === undefined) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', fontSize: '1.1rem', color: '#64748b',
      }}>
        ⏳ Memuat aplikasi...
      </div>
    )
  }

  const defaultPath = user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'

  return (
    <BrowserRouter>
      <Routes>

        {/* ── Auth ── */}
        <Route path="/"
          element={user ? <Navigate to={defaultPath} replace /> : <LoginLanding onLogin={setUser} />}
        />
        <Route path="/login"
          element={user ? <Navigate to={defaultPath} replace /> : <UserLogin onLogin={setUser} />}
        />
        <Route path="/register"
          element={user ? <Navigate to={defaultPath} replace /> : <UserRegister />}
        />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* ── Admin ── */}
        <Route
          path="/admin"
          element={
            <RequireAdmin user={user}>
              <AppProvider currentUser={user}>
                <Layout user={user} onLogout={() => setUser(null)} />
              </AppProvider>
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"         element={<Dashboard />} />
          <Route path="form-pemesanan"    element={<FormPemesanan />} />
          <Route path="form-pembayaran"   element={<FormPembayaran />} />
          <Route path="status-cucian"     element={<StatusCucian />} />
          <Route path="detail-pesanan"    element={<DetailPesanan />} />
          <Route path="laporan"           element={<Laporan />} />
          <Route path="antar-jemput"      element={<SistemAntarJemput />} />
          <Route path="profil"            element={<Profil user={user} />} />
        </Route>

        {/* ── User / Pelanggan ── */}
        <Route
          path="/user"
          element={
            <RequireUser user={user}>
              <AppProvider currentUser={user}>
                <Layout user={user} onLogout={() => setUser(null)} />
              </AppProvider>
            </RequireUser>
          }
        >
          <Route index element={<Navigate to="/user/dashboard" replace />} />
          <Route path="dashboard"     element={<UserDashboard />} />
          <Route path="antar-jemput"  element={<UserAntarJemput user={user} />} />
          <Route path="status-penjemputan"  element={<UserStatusAntarJemput user={user} />} />
          <Route path="status-cucian" element={<UserStatusCucian />} />
          <Route path="riwayat"       element={<UserRiwayat />} />
          <Route path="profil"        element={<Profil user={user} />} />
        </Route>

        {/* ── Fallback ── */}
        <Route
          path="*"
          element={user ? <Navigate to={defaultPath} replace /> : <Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  )
}