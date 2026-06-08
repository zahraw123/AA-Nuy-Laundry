import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../firebase/authService'

export default function UserRegister() {
  const [form, setForm] = useState({ nama: '', email: '', password: '', konfirmasi: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.konfirmasi) {
      setError('Password dan konfirmasi password tidak cocok.')
      return
    }
    if (form.password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }

    setLoading(true)
    try {
      await registerUser(form.email, form.password, form.nama)
      setSuccess(true)
    } catch (err) {
      console.log('REGISTER ERROR:', err.code, err.message)
      if (err.code === 'auth/email-already-in-use') {
        setError('Email sudah terdaftar. Coba login atau gunakan email lain.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Format email tidak valid.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password terlalu lemah.')
      } else {
        setError(err.message || 'Registrasi gagal. Coba lagi.')
      }
    }
    setLoading(false)
  }

  // ── Tampilan sukses ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>📧</div>
          <h2 style={styles.title}>Cek Email Anda!</h2>
          <p style={styles.successText}>
            Kami telah mengirim link verifikasi ke{' '}
            <strong>{form.email}</strong>. Klik link tersebut untuk
            mengaktifkan akun Anda, lalu login.
          </p>
          <p style={{ ...styles.successText, color: '#94a3b8', fontSize: '0.82rem' }}>
            Tidak menerima email? Periksa folder Spam / Junk.
          </p>
          <button style={styles.button} onClick={() => navigate('/login')}>
            Ke Halaman Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button onClick={() => navigate('/login')} style={styles.backBtn}>
          ← Sudah punya akun? Login
        </button>

        <h1 style={styles.title}>🧺 Daftar Akun</h1>
        <p style={styles.subtitle}>Buat akun pelanggan AA NUY Laundry</p>

        <form onSubmit={handleRegister}>
          <label style={styles.label}>NAMA LENGKAP</label>
          <input
            name="nama"
            type="text"
            placeholder="Nama lengkap"
            style={styles.input}
            value={form.nama}
            onChange={handleChange}
            required
          />

          <label style={styles.label}>EMAIL</label>
          <input
            name="email"
            type="email"
            placeholder="Email aktif Anda"
            style={styles.input}
            value={form.email}
            onChange={handleChange}
            required
          />

          <label style={styles.label}>PASSWORD</label>
          <input
            name="password"
            type="password"
            placeholder="Minimal 6 karakter"
            style={styles.input}
            value={form.password}
            onChange={handleChange}
            required
          />

          <label style={styles.label}>KONFIRMASI PASSWORD</label>
          <input
            name="konfirmasi"
            type="password"
            placeholder="Ulangi password"
            style={styles.input}
            value={form.konfirmasi}
            onChange={handleChange}
            required
          />

          {error && <div style={styles.error}>⚠️ {error}</div>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? '⏳ Mendaftar...' : '✅ Daftar Sekarang'}
          </button>
        </form>

        <p style={styles.note}>
          Setelah mendaftar, Anda akan mendapat email verifikasi. Akun baru
          bisa digunakan setelah email diverifikasi.
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #93c5fd 100%)',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    background: '#fff',
    padding: '36px 32px',
    borderRadius: 24,
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
  },
  backBtn: {
    border: 'none', background: 'none', cursor: 'pointer',
    color: '#3b82f6', fontSize: '0.85rem', padding: 0,
    marginBottom: 16, fontWeight: 500,
  },
  title: {
    textAlign: 'center', color: '#1e3a8a',
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.8rem', fontWeight: 700, marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center', color: '#64748b',
    fontSize: '0.88rem', marginTop: 0, marginBottom: 16,
  },
  label: {
    fontSize: '0.78rem', fontWeight: 600, color: '#64748b',
    display: 'block', marginTop: 12, marginBottom: 6,
  },
  input: {
    width: '100%', padding: '12px 16px',
    border: '2px solid #e2e8f0', borderRadius: 12,
    fontSize: '0.95rem', outline: 'none',
    color: '#1e293b', boxSizing: 'border-box',
  },
  button: {
    width: '100%', padding: 14, marginTop: 20,
    border: 'none', borderRadius: 12,
    background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    color: 'white', cursor: 'pointer',
    fontSize: '0.95rem', fontWeight: 600,
  },
  error: {
    background: '#fee2e2', color: '#dc2626',
    padding: '10px 14px', borderRadius: 8,
    fontSize: '0.85rem', marginTop: 8,
  },
  note: {
    textAlign: 'center', color: '#94a3b8',
    fontSize: '0.8rem', marginTop: 16, lineHeight: 1.5,
  },
  successIcon: { textAlign: 'center', fontSize: '3rem', marginBottom: 12 },
  successText: {
    textAlign: 'center', color: '#334155',
    fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 8,
  },
}