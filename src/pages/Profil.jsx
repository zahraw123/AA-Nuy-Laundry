// src/pages/Profil.jsx
// Halaman profil — untuk admin maupun user
// Membaca & mengupdate data dari Firestore collection 'users'

import { useState, useEffect, useRef } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { db, auth } from '../firebase/config'

export default function Profil({ user }) {
  const [form, setForm] = useState({
    nama: '',
    email: '',
    telepon: '',
    alamat: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    passwordLama: '',
    passwordBaru: '',
    konfirmasi: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPass, setSavingPass] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [passMsg, setPassMsg] = useState('')
  const [passErr, setPassErr] = useState('')
  const [activeTab, setActiveTab] = useState('profil') // 'profil' | 'keamanan'
  const timerRef = useRef(null)

  // ── Load data dari Firestore ──────────────────────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const ref = doc(db, 'users', user.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const d = snap.data()
          setForm({
            nama: d.nama || '',
            email: d.email || '',
            telepon: d.telepon || '',
            alamat: d.alamat || '',
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [user.uid])

  const showSuccess = (msg, setter) => {
    setter(msg)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setter(''), 3500)
  }

  // ── Simpan profil ─────────────────────────────────────────────────────────
  const handleSaveProfil = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    try {
      const ref = doc(db, 'users', user.uid)
      await updateDoc(ref, {
        nama: form.nama,
        telepon: form.telepon,
        alamat: form.alamat,
      })
      showSuccess('Profil berhasil disimpan!', setSuccessMsg)
    } catch (err) {
      setErrorMsg('Gagal menyimpan: ' + err.message)
    }
    setSaving(false)
  }

  // ── Ganti password ────────────────────────────────────────────────────────
  const handleGantiPassword = async (e) => {
    e.preventDefault()
    setPassErr('')
    if (passwordForm.passwordBaru !== passwordForm.konfirmasi) {
      setPassErr('Password baru dan konfirmasi tidak cocok.')
      return
    }
    if (passwordForm.passwordBaru.length < 6) {
      setPassErr('Password baru minimal 6 karakter.')
      return
    }
    setSavingPass(true)
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        passwordForm.passwordLama
      )
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, passwordForm.passwordBaru)
      setPasswordForm({ passwordLama: '', passwordBaru: '', konfirmasi: '' })
      showSuccess('Password berhasil diubah!', setPassMsg)
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPassErr('Password lama salah.')
      } else {
        setPassErr('Gagal mengubah password: ' + err.message)
      }
    }
    setSavingPass(false)
  }

  const inisial = (form.nama || form.email || 'U').charAt(0).toUpperCase()

  if (loading) {
    return (
      <div style={s.loadWrap}>
        <div style={s.spinner} />
        <span style={{ color: '#64748b', marginTop: 12 }}>Memuat profil...</span>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <style>{css}</style>

      {/* ── HERO CARD ── */}
      <div style={s.hero}>
        <div style={s.heroBg} />
        <div style={s.heroContent}>
          <div style={s.avatar}>{inisial}</div>
          <div>
            <h2 style={s.heroName}>{form.nama || '—'}</h2>
            <span style={s.badge}>
              {user?.role === 'admin' ? '🛡️ Admin' : '👤 Pelanggan'}
            </span>
            <p style={s.heroEmail}>{form.email}</p>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={s.tabRow}>
        <button
          style={{ ...s.tab, ...(activeTab === 'profil' ? s.tabActive : {}) }}
          onClick={() => setActiveTab('profil')}
        >
          ✏️ Edit Profil
        </button>
        <button
          style={{ ...s.tab, ...(activeTab === 'keamanan' ? s.tabActive : {}) }}
          onClick={() => setActiveTab('keamanan')}
        >
          🔐 Keamanan
        </button>
      </div>

      {/* ── TAB PROFIL ── */}
      {activeTab === 'profil' && (
        <div style={s.card} className="profil-card">
          <h3 style={s.cardTitle}>Informasi Pribadi</h3>

          <form onSubmit={handleSaveProfil}>
            <div style={s.grid2}>
              <div style={s.fieldGroup}>
                <label style={s.label}>NAMA LENGKAP</label>
                <input
                  style={s.input}
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Nama lengkap"
                  required
                />
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>EMAIL</label>
                <input
                  style={{ ...s.input, ...s.inputDisabled }}
                  value={form.email}
                  disabled
                  title="Email tidak dapat diubah di sini"
                />
                <span style={s.hint}>Email tidak dapat diubah</span>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>NO. TELEPON</label>
                <input
                  style={s.input}
                  value={form.telepon}
                  onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  type="tel"
                />
              </div>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>ALAMAT</label>
              <textarea
                style={s.textarea}
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                placeholder="Alamat lengkap"
                rows={3}
              />
            </div>

            {successMsg && <div style={s.successBox}>✅ {successMsg}</div>}
            {errorMsg && <div style={s.errorBox}>⚠️ {errorMsg}</div>}

            <button type="submit" style={s.saveBtn} disabled={saving}>
              {saving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
            </button>
          </form>
        </div>
      )}

      {/* ── TAB KEAMANAN ── */}
      {activeTab === 'keamanan' && (
        <div style={s.card} className="profil-card">
          <h3 style={s.cardTitle}>Ganti Password</h3>

          {auth.currentUser?.providerData[0]?.providerId === 'google.com' ? (
            <div style={s.infoBox}>
              ℹ️ Akun Anda menggunakan <strong>Login Google</strong>. Password
              dikelola oleh Google dan tidak dapat diubah di sini.
            </div>
          ) : (
            <form onSubmit={handleGantiPassword}>
              <div style={s.fieldGroup}>
                <label style={s.label}>PASSWORD LAMA</label>
                <input
                  style={s.input}
                  type="password"
                  placeholder="Masukkan password lama"
                  value={passwordForm.passwordLama}
                  onChange={(e) => setPasswordForm({ ...passwordForm, passwordLama: e.target.value })}
                  required
                />
              </div>

              <div style={s.grid2}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>PASSWORD BARU</label>
                  <input
                    style={s.input}
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={passwordForm.passwordBaru}
                    onChange={(e) => setPasswordForm({ ...passwordForm, passwordBaru: e.target.value })}
                    required
                  />
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.label}>KONFIRMASI PASSWORD</label>
                  <input
                    style={s.input}
                    type="password"
                    placeholder="Ulangi password baru"
                    value={passwordForm.konfirmasi}
                    onChange={(e) => setPasswordForm({ ...passwordForm, konfirmasi: e.target.value })}
                    required
                  />
                </div>
              </div>

              {passMsg && <div style={s.successBox}>✅ {passMsg}</div>}
              {passErr && <div style={s.errorBox}>⚠️ {passErr}</div>}

              <button type="submit" style={s.saveBtn} disabled={savingPass}>
                {savingPass ? '⏳ Mengubah...' : '🔑 Ubah Password'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  page: {
    maxWidth: 780,
    margin: '0 auto',
    padding: '24px 16px 40px',
    fontFamily: "'DM Sans', sans-serif",
    width: '100%',
    boxSizing: 'border-box',
  },
  loadWrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: 300,
  },
  spinner: {
    width: 36, height: 36, border: '3px solid #e2e8f0',
    borderTop: '3px solid #3b82f6', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },

  // Hero
  hero: {
    borderRadius: 20, overflow: 'hidden',
    marginBottom: 20, position: 'relative',
    boxShadow: '0 8px 32px rgba(30,58,138,0.15)',
  },
  heroBg: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #60a5fa 100%)',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    padding: '32px',
    flexWrap: 'wrap',
  },
  avatar: {
    width: 80, height: 80, borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    border: '3px solid rgba(255,255,255,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '2rem', fontWeight: 800, color: '#fff',
    flexShrink: 0,
    backdropFilter: 'blur(8px)',
  },
  heroName: {
    margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 700,
    color: '#fff',
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(4px)',
    color: '#fff', fontSize: '0.78rem', fontWeight: 600,
    padding: '3px 10px', borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.3)',
    marginBottom: 6,
  },
  heroEmail: {
    margin: '4px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem',
  },

  // Tabs
  tabRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tab: {
    flex: 1,
    minWidth: 140,
    padding: '9px 20px',
    border: '2px solid #e2e8f0',
    borderRadius: 12,
    background: '#f8fafc',
    cursor: 'pointer',
    fontSize: '0.88rem',
    fontWeight: 500,
    color: '#64748b',
    transition: 'all 0.15s',
    fontFamily: "'DM Sans', sans-serif",
  },
  tabActive: {
    background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    color: '#fff', border: '2px solid transparent',
    fontWeight: 700,
  },

  // Card
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '28px 28px 32px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
    border: '1px solid #f1f5f9',
    width: '100%',
    boxSizing: 'border-box',
  },
  cardTitle: {
    margin: '0 0 24px', fontSize: '1rem', fontWeight: 700,
    color: '#1e293b', paddingBottom: 14,
    borderBottom: '2px solid #f1f5f9',
  },

  // Form
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '0 20px',
  },
  fieldGroup: { marginBottom: 16 },
  label: {
    display: 'block', fontSize: '0.72rem', fontWeight: 700,
    color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 6,
  },
  input: {
    width: '100%', padding: '12px 14px',
    border: '2px solid #e2e8f0', borderRadius: 12,
    fontSize: '0.93rem', color: '#1e293b',
    boxSizing: 'border-box', outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.15s',
  },
  inputDisabled: {
    background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed',
  },
  textarea: {
    width: '100%', padding: '12px 14px',
    border: '2px solid #e2e8f0', borderRadius: 12,
    fontSize: '0.93rem', color: '#1e293b',
    boxSizing: 'border-box', outline: 'none', resize: 'vertical',
    fontFamily: "'DM Sans', sans-serif",
  },
  hint: { fontSize: '0.72rem', color: '#94a3b8', marginTop: 4, display: 'block' },

  // Buttons & alerts
  saveBtn: {
    marginTop: 8,
    padding: '13px 28px',
    background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: '0.93rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    width: '100%',
  },
  successBox: {
    background: '#f0fdf4', color: '#15803d',
    border: '1px solid #bbf7d0',
    padding: '10px 14px', borderRadius: 10,
    fontSize: '0.88rem', marginBottom: 12,
  },
  errorBox: {
    background: '#fef2f2', color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '10px 14px', borderRadius: 10,
    fontSize: '0.88rem', marginBottom: 12,
  },
  infoBox: {
    background: '#eff6ff', color: '#1d4ed8',
    border: '1px solid #bfdbfe',
    padding: '14px 18px', borderRadius: 12,
    fontSize: '0.9rem', lineHeight: 1.6,
  },
}

const css = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .profil-card {
    animation: fadeUp 0.3s ease;
  }

  input:focus,
  textarea:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
  }

  /* ======================
     TABLET
  ====================== */
  @media (max-width: 768px) {
    .profil-card {
      padding: 22px 18px !important;
    }
  }

  /* ======================
     MOBILE
  ====================== */
  @media (max-width: 600px) {

    .profil-card {
      padding: 18px 14px !important;
    }

    /* Hero */
    div[style*="display: flex"][style*="align-items: center"] {
      flex-direction: column;
      text-align: center;
    }

    /* Grid form */
    div[style*="grid-template-columns: 1fr 1fr"] {
      grid-template-columns: 1fr !important;
      gap: 0 !important;
    }
  }
`