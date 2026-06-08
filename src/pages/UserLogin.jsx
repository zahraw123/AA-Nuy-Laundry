// src/pages/UserLogin.jsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser, loginWithGoogle } from '../firebase/authService'

export default function UserLogin({ onLogin, onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const userData = await loginUser(email, password)
      // Beritahu App.jsx → setUser → redirect otomatis lewat route guard
      if (onLogin) onLogin(userData)
    } catch (err) {
      if (err.code === 'auth/email-not-verified') {
        setError('Email belum diverifikasi. Silakan cek inbox email Anda.')
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Email atau password salah')
      } else if (err.code === 'auth/user-not-found') {
        setError('Akun tidak ditemukan')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Terlalu banyak percobaan. Coba lagi nanti.')
      } else {
        setError(err.message || 'Login gagal')
      }
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const userData = await loginWithGoogle()
      if (onLogin) onLogin(userData)
    } catch (err) {
      if (err.code === 'auth/admin-use-email') {
        setError('Admin harus login menggunakan email & password.')
      } else {
        setError('Login Google gagal. Coba lagi.')
      }
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button onClick={onBack || (() => navigate('/'))} style={styles.backBtn}>
          ← Kembali
        </button>

        <h1 style={styles.title}>🧺 AA NUY Laundry</h1>
        <p style={styles.subtitle}>Masuk sebagai Pelanggan</p>

        <form onSubmit={handleLogin}>
          <label style={styles.label}>EMAIL</label>
          <input
            type="email"
            placeholder="Email Anda"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label style={styles.label}>PASSWORD</label>
          <input
            type="password"
            placeholder="Password"
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div style={styles.error}>⚠️ {error}</div>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? '⏳ Masuk...' : '🔑 Masuk'}
          </button>
        </form>

        <div style={styles.divider}><span>atau</span></div>

        <button onClick={handleGoogleLogin} style={styles.googleBtn} disabled={loading}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={{ width: 20, height: 20 }}
          />
          Masuk dengan Google
        </button>

        <p style={styles.registerText}>
          Belum punya akun?{' '}
          <button onClick={() => navigate('/register')} style={styles.registerLink}>
            Daftar sekarang
          </button>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #93c5fd 100%)',
  },
  card: {
    width: 420, background: '#fff', padding: '36px 32px',
    borderRadius: 24, boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
  },
  backBtn: {
    border: 'none', background: 'none', cursor: 'pointer',
    color: '#64748b', fontSize: '0.85rem', padding: 0, marginBottom: 16,
  },
  title: {
    textAlign: 'center', color: '#1e3a8a',
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '2rem', fontWeight: 700, marginBottom: 4,
  },
  subtitle: { textAlign: 'center', color: '#64748b', fontSize: '0.88rem', marginTop: 0, marginBottom: 20 },
  label: { fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginTop: 12, marginBottom: 6 },
  input: {
    width: '100%', padding: '13px 16px', border: '2px solid #e2e8f0',
    borderRadius: 12, fontSize: '0.95rem', outline: 'none',
    color: '#1e293b', boxSizing: 'border-box',
  },
  button: {
    width: '100%', padding: 14, marginTop: 20, border: 'none', borderRadius: 12,
    background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    color: 'white', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
  },
  divider: { textAlign: 'center', margin: '16px 0', color: '#94a3b8', fontSize: '0.85rem' },
  googleBtn: {
    width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 12,
    background: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#1e293b',
  },
  error: {
    background: '#fee2e2', color: '#dc2626', padding: '10px 14px',
    borderRadius: 8, fontSize: '0.85rem', marginTop: 8,
  },
  registerText: { textAlign: 'center', marginTop: 20, color: '#64748b', fontSize: '0.88rem' },
  registerLink: {
    background: 'none', border: 'none', color: '#3b82f6',
    cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', textDecoration: 'underline',
  },
}
