// src/pages/UserDashboard.jsx

import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

const LAYANAN = [
  { nama: 'Cuci & Setrika', harga: 10000, satuan: '/kg', icon: '👕', desc: 'Bersih + rapi siap pakai' },
  { nama: 'Cuci Lipat', harga: 6000, satuan: '/kg', icon: '🫧', desc: 'Cuci tanpa setrika' },
  { nama: 'Setrika Saja', harga: 6000, satuan: '/kg', icon: '🔥', desc: 'Sudah dicuci, tinggal setrika' },
  { nama: 'Cuci Express', harga: 15000, satuan: '/kg', icon: '⚡', desc: 'Selesai dalam 1 hari' },
  { nama: 'Laundry Sepatu', harga: 25000, satuan: '/pasang', icon: '👟', desc: 'Bersih & wangi seperti baru' },
]

const JAM_OPERASIONAL = [
  { hari: 'Senin – Jumat', jam: '07.00 – 17.00' },
  { hari: 'Sabtu',         jam: '07.00 – 16.00' },
  { hari: 'Minggu',        jam: '08.00 – 15.00' },
]

const formatRp = (n) => `Rp ${n.toLocaleString('id-ID')}`

function isOpenNow() {
  const now  = new Date()
  const day  = now.getDay()   // 0=Sun,1=Mon,...,6=Sat
  const h    = now.getHours()
  const m    = now.getMinutes()
  const time = h * 60 + m
  if (day >= 1 && day <= 5) return time >= 7 * 60 && time < 20 * 60
  if (day === 6)             return time >= 7 * 60 && time < 18 * 60
  if (day === 0)             return time >= 8 * 60 && time < 15 * 60
  return false
}

export default function UserDashboard() {
  const { myOrders, loading } = useApp()
  const navigate = useNavigate()

  const open = isOpenNow()

  // Ambil 3 resi terakhir (semua status)
  const resiTerakhir = [...myOrders]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 3)

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>⏳ Memuat data...</div>

  return (
    <div style={{ width: '100%', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>🏠 Dashboard Saya</h1>
      </div>

      {/* Jam Operasional */}
      <div style={{
        background: 'white', borderRadius: 12, padding: 20,
        boxShadow: '0 1px 6px #0001', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>🕐 Jam Operasional</h3>
          <span style={{
            background: open ? '#dcfce7' : '#fee2e2',
            color:      open ? '#15803d' : '#dc2626',
            borderRadius: 20, padding: '4px 12px',
            fontSize: '0.75rem', fontWeight: 700,
          }}>
            {open ? '🟢 Buka Sekarang' : '🔴 Tutup'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {JAM_OPERASIONAL.map(j => (
            <div key={j.hari} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#f8fafc', borderRadius: 8, padding: '9px 14px',
            }}>
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>{j.hari}</span>
              <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 700 }}>{j.jam}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
          📞 Hubungi kami di luar jam operasional jika ada keperluan mendesak
        </div>
      </div>

      {/* Nomor Resi Terakhir */}
      {resiTerakhir.length > 0 && (
        <div style={{
          background: 'white', borderRadius: 12, padding: 20,
          boxShadow: '0 1px 6px #0001', marginBottom: 20,
        }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 700 }}>🧾 Nomor Resi Terakhir</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resiTerakhir.map(o => (
              <button
                key={o.id || o.docId}
                onClick={() => navigate('/user/status-antar-jemput')}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#f0f9ff', border: '1.5px solid #bae6fd',
                  borderRadius: 10, padding: '10px 14px',
                  cursor: 'pointer', transition: 'background 0.15s',
                  width: '100%', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e0f2fe'}
                onMouseLeave={e => e.currentTarget.style.background = '#f0f9ff'}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontWeight: 800, color: '#0369a1', fontSize: '0.9rem' }}>
                    #{o.id || o.docId}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    📅 {o.tanggalRequest || '-'} · {o.tipeLayanan || '-'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    background: o.status === 'Selesai' ? '#dcfce7' : o.status === 'Dibatalkan' ? '#fee2e2' : '#fef3c7',
                    color:      o.status === 'Selesai' ? '#15803d' : o.status === 'Dibatalkan' ? '#dc2626' : '#92400e',
                  }}>
                    {o.status}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>›</span>
                </div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
            💡 Klik resi untuk melihat detail & tracking status
          </div>
        </div>
      )}

      {/* Layanan Kami */}
      <div style={{
        background: 'white', borderRadius: 12, padding: 20,
        boxShadow: '0 1px 6px #0001', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>🛎️ Layanan Kami</h3>
          <button
            onClick={() => navigate('/user/pesan')}
            style={{
              padding: '7px 16px', background: '#2563eb', color: 'white',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              fontWeight: 600, fontSize: '0.82rem',
            }}
          >
            🚗 Pesan Jemput
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          {LAYANAN.map(l => (
            <div
              key={l.nama}
              style={{
                background: '#f8fafc', border: '1px solid #f1f5f9',
                borderRadius: 10, padding: '14px 12px', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{l.icon}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{l.nama}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb' }}>
                {formatRp(l.harga)}<span style={{ fontWeight: 400, color: '#94a3b8' }}>{l.satuan}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4, lineHeight: 1.3 }}>{l.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Informasi Toko */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
        borderRadius: 12, padding: 20,
        boxShadow: '0 2px 10px #2563eb33', marginBottom: 20,
        color: 'white',
      }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 700, color: 'white' }}>
          🏪 Informasi Toko
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* No. Telepon */}
          <a
            href="tel:+6289520321504"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,0.15)', borderRadius: 10,
              padding: '10px 14px', textDecoration: 'none', color: 'white',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <span style={{ fontSize: '1.2rem' }}>📞</span>
            <div>
              <div style={{ fontSize: '0.72rem', opacity: 0.75, marginBottom: 1 }}>Nomor Telepon / WhatsApp</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>0895-2032-1504</div>
            </div>
          </a>
          
          {/* Alamat */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            background: 'rgba(255,255,255,0.15)', borderRadius: 10,
            padding: '10px 14px',
          }}>
            <span style={{ fontSize: '1.2rem', marginTop: 1 }}>📍</span>
            <div>
              <div style={{ fontSize: '0.72rem', opacity: 0.75, marginBottom: 1 }}>Alamat Toko</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.4 }}>
                Jl. Tegal Mulya, Tegalmulya, Ledug, Kec. Kembaran, <br />
                Kabupaten Banyumas, Jawa Tengah 53182
              </div>
            </div>
          </div>
          
          {/* Embedded Google Maps */}
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)' }}>
            <iframe
              src="https://maps.google.com/maps?q=-6.9824,110.3982&z=16&output=embed"
              width="100%"
              height="180"
              style={{ display: 'block', border: 'none' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokasi Toko"
            />
            <a
              href="https://maps.app.goo.gl/RWZ7aS79ZecyWQz4A"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'white', padding: '8px 14px',
                textDecoration: 'none', color: '#2563eb',
                fontWeight: 700, fontSize: '0.82rem',
              }}
            >
              🗺️ Buka di Google Maps ↗
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}