// src/pages/LoginLanding.jsx

import { useState } from 'react'
import { loginAdmin } from '../firebase/authService'
import UserLogin from './Userlogin'

// ⚠️ TIDAK pakai useNavigate di sini.
// Redirect ditangani App.jsx lewat onAuthChange → setUser → route guard.
// LoginLanding cukup panggil onLogin(userData) agar App.jsx update state-nya.

export default function LoginLanding({ onLogin }) {
  const [mode, setMode] = useState(null) // null | 'admin' | 'user'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAdminSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const userData = await loginAdmin(email, password)
      // Beritahu App.jsx → setUser(userData) → route guard redirect otomatis
      if (onLogin) onLogin(userData)
    } catch (err) {
      let msg = 'Login gagal. Coba lagi.'
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Email atau password salah!'
      } else if (err.code === 'auth/user-not-found') {
        msg = 'Akun tidak ditemukan!'
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Terlalu banyak percobaan. Coba lagi nanti.'
      } else if (err.code === 'auth/not-admin') {
        msg = 'Akun ini bukan admin.'
      } else if (err.message) {
        msg = err.message
      }
      setError(msg)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }

    setLoading(false)
  }

  if (mode === 'user') {
    return (
      <UserLogin
        onLogin={onLogin}   // langsung teruskan ke App.jsx
        onBack={() => setMode(null)}
      />
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.bubbleTop} />
      <div style={styles.bubbleBot} />
      <div style={styles.bubbleMid} />

      {mode === null && (
        <div style={styles.card}>
          <div style={styles.logo}>🧺 AA NUY</div>
          <p style={styles.subtitle}>Laundry Management System</p>
          <p style={styles.hint}>Masuk sebagai</p>

          <div style={styles.roleGrid}>
            <button style={styles.roleBtn} onClick={() => setMode('admin')}>
              <span style={styles.roleIcon}>🛡️</span>
              <span style={styles.roleTitle}>Admin</span>
              <span style={styles.roleDesc}>Kelola pesanan, laporan & pembayaran</span>
            </button>
            <button style={{ ...styles.roleBtn, ...styles.roleBtnUser }} onClick={() => setMode('user')}>
              <span style={styles.roleIcon}>👤</span>
              <span style={styles.roleTitle}>Pelanggan</span>
              <span style={styles.roleDesc}>Cek status cucian & pesanan kamu</span>
            </button>
          </div>
        </div>
      )}

      {mode === 'admin' && (
        <div style={{ ...styles.card, ...(shake ? styles.shake : {}) }}>
          <button onClick={() => { setMode(null); setError('') }} style={styles.backBtn}>
            ← Kembali
          </button>
          <div style={styles.logo}>🛡️ Admin</div>
          <p style={styles.subtitle}>Masuk sebagai Admin AA NUY</p>

          <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={styles.label}>EMAIL</label>
            <input
              style={styles.input}
              type="email"
              placeholder="Email admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label style={styles.label}>PASSWORD</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <div style={styles.errorBox}>⚠️ {error}</div>}

            <button style={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? '⏳ Masuk...' : '🔐 Masuk sebagai Admin'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #93c5fd 100%)',
    position: 'relative', overflow: 'hidden',
  },
  bubbleTop: {
    position: 'absolute', width: 600, height: 600, background: 'rgba(255,255,255,0.05)',
    borderRadius: '50%', top: -200, right: -100,
  },
  bubbleBot: {
    position: 'absolute', width: 400, height: 400, background: 'rgba(255,255,255,0.05)',
    borderRadius: '50%', bottom: -100, left: -100,
  },
  bubbleMid: {
    position: 'absolute', width: 200, height: 200, background: 'rgba(255,255,255,0.03)',
    borderRadius: '50%', top: '40%', left: '30%',
  },
  card: {
    background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
    borderRadius: 24, padding: '40px 36px', width: 420,
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)', position: 'relative', zIndex: 10,
  },
  logo: {
    fontFamily: "'Cormorant Garamond', serif", fontSize: '2.2rem', fontWeight: 700,
    color: '#1e3a8a', textAlign: 'center', marginBottom: 4,
  },
  subtitle: { textAlign: 'center', color: '#64748b', fontSize: '0.88rem', marginBottom: 8, marginTop: 0 },
  hint: { textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem', marginBottom: 28 },
  roleGrid: { display: 'flex', gap: 12 },
  roleBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '20px 12px', border: '2px solid #e2e8f0', borderRadius: 16,
    background: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: "'DM Sans', sans-serif",
  },
  roleBtnUser: { background: '#eff6ff', borderColor: '#bfdbfe' },
  roleIcon: { fontSize: '2rem' },
  roleTitle: { fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' },
  roleDesc: { fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.4 },
  backBtn: {
    background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
    fontSize: '0.85rem', padding: 0, marginBottom: 16, fontFamily: "'DM Sans', sans-serif",
  },
  label: {
    fontSize: '0.78rem', fontWeight: 600, color: '#64748b',
    marginBottom: 6, display: 'block', marginTop: 12,
  },
  input: {
    width: '100%', padding: '13px 16px', border: '2px solid #e2e8f0', borderRadius: 12,
    fontSize: '0.95rem', fontFamily: "'DM Sans', sans-serif", outline: 'none',
    marginBottom: 4, color: '#1e293b', boxSizing: 'border-box',
  },
  errorBox: {
    background: '#fee2e2', color: '#dc2626', padding: '10px 14px',
    borderRadius: 8, fontSize: '0.85rem', marginTop: 8, marginBottom: 4,
  },
  submitBtn: {
    width: '100%', padding: 14, background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    color: 'white', border: 'none', borderRadius: 12, fontSize: '0.95rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginTop: 16,
  },
  shake: { animation: 'shake 0.5s ease-in-out' },
}