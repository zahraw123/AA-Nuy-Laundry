

import { useState } from 'react'
import {
  collection, addDoc, serverTimestamp,
  doc, runTransaction,
} from 'firebase/firestore'
import { db } from '../firebase/config'

// ── ID generator ─────────────────────────────────────────────────────────────
async function generatePickupId() {
  const ref  = doc(db, 'meta', 'pickupCounter')
  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const n    = (snap.exists() ? snap.data().count : 0) + 1
    tx.set(ref, { count: n })
    return n
  })
  return `PKP-${String(next).padStart(3, '0')}`
}

const fmt = (d) => d.toISOString().split('T')[0]

// ── Tipe layanan antar jemput ─────────────────────────────────────────────────
const TIPE_LAYANAN = [
  {
    value: 'Jemput',
    label: 'Jemput Cucian',
    icon: '🚗',
    desc: 'Kami jemput cucian kotor dari rumah kamu',
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    value: 'Antar',
    label: 'Antar Cucian',
    icon: '🏠',
    desc: 'Kami antar cucian bersih ke rumah kamu',
    color: '#10b981',
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
  {
    value: 'Antar & Jemput',
    label: 'Antar & Jemput',
    icon: '🔄',
    desc: 'Kami jemput cucian kotor & antar balik cucian bersih',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
]

// ── Slot waktu ────────────────────────────────────────────────────────────────
const SLOT_WAKTU = [
  { label: 'Secepatnya',   desc: 'Kami segera hubungi kamu', icon: '⚡' },
  { label: 'Pagi (08–12)', desc: 'Senin – Sabtu',            icon: '🌅' },
  { label: 'Siang (12–15)',desc: 'Senin – Sabtu',            icon: '☀️' },
  { label: 'Sore (15–18)', desc: 'Senin – Sabtu',            icon: '🌆' },
]

export default function UserAntarJemput({ user }) {
  const [tipe,    setTipe]    = useState('Jemput')
  const [alamat,  setAlamat]  = useState(user?.alamat || '')
  const [slot,    setSlot]    = useState('Secepatnya')
  const [catatan, setCatatan] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error,   setError]   = useState('')

  const reset = () => {
    setTipe('Jemput')
    setAlamat(user?.alamat || '')
    setSlot('Secepatnya')
    setCatatan('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!alamat.trim()) { setError('Alamat wajib diisi.'); return }
    setError('')
    setLoading(true)
    try {
      const pickupId = await generatePickupId()
      await addDoc(collection(db, 'pickup_requests'), {
        id:               pickupId,
        userUid:          user?.uid         || '',
        nama:             user?.nama        || user?.displayName || user?.email || 'Pelanggan',
        telepon:          user?.telepon     || user?.phone       || '',
        email:            user?.email       || '',
        tipeLayanan:      tipe,
        alamat:           alamat.trim(),
        slotWaktu:        slot,
        catatan:          catatan.trim(),
        status:           tipe === 'Antar' ? 'Menunggu Antar' : 'Menunggu Jemput',
        tanggalRequest:   fmt(new Date()),
        layanan:          [],
        berat:            null,
        totalHarga:       null,
        statusPembayaran: 'Belum Bayar',
        metodePembayaran: null,
        createdAt:        serverTimestamp(),
        updatedAt:        serverTimestamp(),
      })
      setSuccess({ id: pickupId, tipe })
      reset()
    } catch (err) {
      console.error(err)
      setError('Gagal mengirim permintaan. Silakan coba lagi.')
    }
    setLoading(false)
  }

  const tipeAktif = TIPE_LAYANAN.find(t => t.value === tipe) || TIPE_LAYANAN[0]

  // ── Sukses ────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="center-page">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
            🚗 Layanan Antar Jemput
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Kami yang datang ke kamu</p>
        </div>

        <div style={{
          background: '#d1fae5', border: '1px solid #6ee7b7',
          borderRadius: 16, padding: '40px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '3.5rem' }}>🎉</div>
          <div style={{ fontWeight: 700, color: '#065f46', fontSize: '1.1rem', marginTop: 12 }}>
            Permintaan Berhasil Dikirim!
          </div>
          <div style={{ color: '#047857', fontSize: '0.88rem', marginTop: 6 }}>
            Tipe layanan: <strong>{success.tipe}</strong>
          </div>
          <div style={{ color: '#047857', fontSize: '0.88rem', marginTop: 4 }}>
            Nomor permintaan kamu:
          </div>
          <div style={{
            fontSize: '1.6rem', fontWeight: 800, color: '#1e3a8a',
            letterSpacing: 1, marginTop: 6,
          }}>
            {success.id}
          </div>

          <div style={{
            background: '#a7f3d0', borderRadius: 8,
            padding: '10px 14px', marginTop: 16,
            fontSize: '0.82rem', color: '#065f46', textAlign: 'left',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>📋 Selanjutnya:</div>
            {success.tipe === 'Antar' ? (
              <div>Admin akan menghubungi kamu untuk konfirmasi waktu pengantaran.</div>
            ) : (
              <>
                <div>1. Admin akan menghubungi kamu untuk konfirmasi waktu jemput</div>
                <div style={{ marginTop: 4 }}>2. Setelah dijemput & ditimbang, admin akan membuat pesanan resmi</div>
                <div style={{ marginTop: 4 }}>3. Pantau status di menu <strong>Status Cucian</strong></div>
              </>
            )}
          </div>

          <button
            onClick={() => setSuccess(null)}
            style={{
              marginTop: 20, padding: '11px 32px',
              background: '#059669', color: 'white',
              border: 'none', borderRadius: 10,
              cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
            }}
          >
            + Buat Permintaan Baru
          </button>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="center-page">

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
          🚗 Layanan Antar Jemput
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
          Pilih layanan — kami yang datang ke kamu
        </p>
      </div>

      {/* Info user */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: 12, padding: '12px 16px', marginBottom: 20,
      }}>
        <span style={{ fontSize: '1.4rem' }}>👤</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.92rem' }}>
            {user?.nama || user?.displayName || user?.email || 'Pelanggan'}
          </div>
          <div style={{ color: '#60a5fa', fontSize: '0.8rem', marginTop: 2 }}>
            {user?.telepon || user?.phone || '⚠️ Telepon belum diisi — lengkapi di Profil'}
          </div>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>

          {/* Pilihan tipe layanan */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 10, fontSize: '0.9rem' }}>
              🛎️ Pilih Tipe Layanan *
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TIPE_LAYANAN.map(t => {
                const active = tipe === t.value
                return (
                  <div
                    key={t.value}
                    onClick={() => setTipe(t.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                      border: `2px solid ${active ? t.color : '#e2e8f0'}`,
                      background: active ? t.bg : 'white',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '1.8rem' }}>{t.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: active ? t.color : '#1e293b' }}>
                        {t.label}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{t.desc}</div>
                    </div>
                    {active && (
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: t.color, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                      }}>✓</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Alamat */}
          <div className="form-group">
            <label className="form-label">
              📍 {tipe === 'Antar' ? 'Alamat Pengantaran' : 'Alamat Penjemputan'} *
            </label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Tulis alamat lengkap, termasuk nama jalan, nomor rumah, patokan, dll."
              value={alamat}
              onChange={e => setAlamat(e.target.value)}
              style={{ resize: 'vertical' }}
            />
            {error && !alamat.trim() && (
              <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: '4px 0 0' }}>⚠️ {error}</p>
            )}
          </div>

          {/* Slot waktu */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 10, fontSize: '0.9rem' }}>
              🕐 Waktu {tipe === 'Antar' ? 'Pengantaran' : 'Penjemputan'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {SLOT_WAKTU.map(s => {
                const active = slot === s.label
                return (
                  <div
                    key={s.label}
                    onClick={() => setSlot(s.label)}
                    style={{
                      padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${active ? tipeAktif.color : '#e2e8f0'}`,
                      background: active ? tipeAktif.bg : 'white',
                      position: 'relative', transition: 'all 0.15s',
                    }}
                  >
                    {active && (
                      <div style={{ position: 'absolute', top: 8, right: 10, color: tipeAktif.color, fontWeight: 700 }}>✓</div>
                    )}
                    <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>{s.label}</div>
                    <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: 2 }}>{s.desc}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Catatan */}
          <div className="form-group">
            <label className="form-label">📝 Catatan (opsional)</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Contoh: hubungi dulu sebelum datang, titip ke satpam jika tidak ada di rumah..."
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Error umum */}
          {error && alamat.trim() && (
            <div style={{
              background: '#fee2e2', color: '#dc2626',
              padding: '10px 14px', borderRadius: 8,
              fontSize: '0.85rem', marginBottom: 14,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Tombol */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', background: tipeAktif.color }}
              disabled={loading}
            >
              {loading ? '⏳ Mengirim...' : `${tipeAktif.icon} Minta ${tipeAktif.label}`}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              disabled={loading}
              onClick={reset}
            >
              🔄 Reset
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}