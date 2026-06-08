import { useState, useEffect } from 'react'
import { markPickupStatusAsSeen } from '../hooks/useNotifications'
import {
  collection, onSnapshot, query,
  where, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/config'

// ── Konstanta ─────────────────────────────────────────────────────────────────

const TIMELINE = {
  Jemput: [
    { status: 'Diproses',        icon: '📋', label: 'Permintaan Diproses',  desc: 'Permintaan sedang ditinjau admin' },
    { status: 'Dikonfirmasi',    icon: '✅', label: 'Dikonfirmasi',         desc: 'Permintaan telah disetujui admin' },
    { status: 'Sedang Dijemput', icon: '🛵', label: 'Sedang Dijemput',      desc: 'Driver sedang menuju lokasi kamu' },
    { status: 'Selesai',         icon: '🎉', label: 'Selesai',              desc: 'Cucian berhasil dijemput' },
  ],
  Antar: [
    { status: 'Diproses',     icon: '📋', label: 'Permintaan Diproses', desc: 'Permintaan sedang ditinjau admin' },
    { status: 'Dikonfirmasi', icon: '✅', label: 'Dikonfirmasi',        desc: 'Permintaan telah disetujui admin' },
    { status: 'Siap Diantar', icon: '📦', label: 'Siap Diantar',       desc: 'Cucian siap dikirim' },
    { status: 'Selesai',      icon: '🎉', label: 'Selesai',            desc: 'Cucian telah diterima pelanggan' },
  ],
  'Antar & Jemput': [
    { status: 'Diproses',        icon: '📋', label: 'Permintaan Diproses', desc: 'Permintaan sedang ditinjau admin' },
    { status: 'Dikonfirmasi',    icon: '✅', label: 'Dikonfirmasi',        desc: 'Permintaan telah disetujui admin' },
    { status: 'Sedang Dijemput', icon: '🛵', label: 'Sedang Dijemput',    desc: 'Driver sedang menuju lokasi kamu' },
    { status: 'Siap Diantar',    icon: '📦', label: 'Siap Diantar',       desc: 'Cucian sudah selesai dan siap diantar' },
    { status: 'Selesai',         icon: '🎉', label: 'Selesai',            desc: 'Cucian telah diterima pelanggan' },
  ],
}

const STATUS_COLOR = {
  Diproses:          { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  Dikonfirmasi:      { bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  'Sedang Dijemput': { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  'Siap Diantar':    { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  Selesai:           { bg: '#dcfce7', color: '#065f46', dot: '#10b981' },
  Dibatalkan:        { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
}

const TIPE_COLOR = {
  Jemput:           { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', icon: '🚗' },
  Antar:            { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0', icon: '🏠' },
  'Antar & Jemput': { bg: '#f5f3ff', color: '#5b21b6', border: '#ddd6fe', icon: '🔄' },
}

const FILTER_TABS = [
  { key: 'aktif',   label: 'Aktif',   icon: '🔄' },
  { key: 'selesai', label: 'Selesai', icon: '✅' },
  { key: 'semua',   label: 'Semua',   icon: '📋' },
]

const STAT_CONFIG = [
  { key: 'aktif',   label: 'Aktif',   bg: '#dbeafe', color: '#1d4ed8', icon: '🔄' },
  { key: 'selesai', label: 'Selesai', bg: '#dcfce7', color: '#15803d', icon: '✅' },
  { key: 'batal',   label: 'Batal',   bg: '#fee2e2', color: '#dc2626', icon: '❌' },
]

// ── Helper ────────────────────────────────────────────────────────────────────

function isAktif(status) {
  return !['Selesai', 'Dibatalkan'].includes(status)
}

// ── Subkomponen Timeline ──────────────────────────────────────────────────────

function StatusTimeline({ tipe, status }) {
  if (status === 'Dibatalkan') {
    return (
      <div style={{
        background: '#fee2e2', borderRadius: 10, padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 10, marginTop: 12,
      }}>
        <span style={{ fontSize: '1.4rem' }}>❌</span>
        <div>
          <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.88rem' }}>Permintaan Dibatalkan</div>
          <div style={{ color: '#b91c1c', fontSize: '0.78rem', marginTop: 2 }}>
            Hubungi admin jika ada pertanyaan
          </div>
        </div>
      </div>
    )
  }

  const steps      = TIMELINE[tipe] || TIMELINE.Jemput
  const currentIdx = steps.findIndex(s => s.status === status)

  return (
    <div style={{ marginTop: 14 }}>
      {steps.map((step, i) => {
        const done    = i < currentIdx
        const current = i === currentIdx
        const last    = i === steps.length - 1

        return (
          <div key={step.status} style={{ display: 'flex', gap: 12, position: 'relative' }}>
            {!last && (
              <div style={{
                position: 'absolute', left: 14, top: 30,
                width: 2, height: 'calc(100% - 8px)',
                background: done ? '#10b981' : '#e2e8f0',
                transition: 'background 0.3s',
              }} />
            )}

            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: current ? '0.95rem' : '0.72rem',
              background: done ? '#10b981' : current ? '#3b82f6' : '#f1f5f9',
              color: (done || current) ? 'white' : '#cbd5e1',
              border: current ? '2px solid #93c5fd' : 'none',
              boxShadow: current ? '0 0 0 4px #dbeafe' : 'none',
              position: 'relative', zIndex: 1,
              transition: 'all 0.3s',
            }}>
              {done ? '✓' : current ? step.icon : '○'}
            </div>

            <div style={{
              paddingBottom: last ? 0 : 18,
              flex: 1,
              opacity: i > currentIdx ? 0.4 : 1,
              transition: 'opacity 0.3s',
            }}>
              <div style={{
                fontWeight: current ? 700 : 600,
                color: current ? '#1e40af' : done ? '#065f46' : '#94a3b8',
                fontSize: '0.84rem', marginTop: 4,
              }}>
                {step.label}
              </div>
              {current && (
                <div style={{
                  fontSize: '0.76rem', color: '#64748b', marginTop: 3,
                  background: '#f0f9ff', borderRadius: 6,
                  padding: '4px 8px', display: 'inline-block',
                }}>
                  {step.desc}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Subkomponen Card ──────────────────────────────────────────────────────────

function PickupCard({ r, expanded, onToggle }) {
  const stColor = STATUS_COLOR[r.status] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' }
  const tColor  = TIPE_COLOR[r.tipeLayanan] || TIPE_COLOR.Jemput
  const aktif   = isAktif(r.status)

  return (
    <div style={{
      background: 'white',
      border: `1.5px solid ${expanded ? '#93c5fd' : '#e2e8f0'}`,
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: expanded ? '0 4px 20px rgba(59,130,246,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
      transition: 'all 0.2s',
    }}>

      {/* Header card */}
      <div
        onClick={onToggle}
        style={{
          padding: '14px 16px', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
          background: expanded ? '#f8faff' : 'white',
          transition: 'background 0.15s',
        }}
      >
        {/* Kiri */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.92rem' }}>{r.id}</span>
            <span style={{
              background: tColor.bg, color: tColor.color,
              border: `1px solid ${tColor.border}`,
              borderRadius: 6, padding: '2px 8px',
              fontSize: '0.7rem', fontWeight: 700,
            }}>
              {tColor.icon} {r.tipeLayanan}
            </span>
            {aktif && (
              <span style={{
                background: '#fef3c7', color: '#92400e',
                borderRadius: 6, padding: '2px 7px',
                fontSize: '0.68rem', fontWeight: 600,
              }}>
                🔔 Aktif
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>📅 {r.tanggalRequest}</span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>🕐 {r.slotWaktu}</span>
          </div>
        </div>

        {/* Kanan */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: stColor.bg, color: stColor.color,
            borderRadius: 8, padding: '5px 10px',
            fontSize: '0.76rem', fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: stColor.dot, display: 'inline-block',
              ...(aktif && r.status !== 'Diproses' ? { animation: 'pulse 1.8s infinite' } : {}),
            }} />
            {r.status}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {expanded ? '▲ Tutup' : '▼ Detail'}
          </span>
        </div>
      </div>

      {/* Konten ekspansi */}
      {expanded && (
        <div style={{
          padding: '14px 16px 16px',
          borderTop: '1px solid #e2e8f0',
          animation: 'fadeIn 0.2s ease',
        }}>

          {/* Detail lokasi & catatan */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{
              fontSize: '0.7rem', color: '#94a3b8',
              textTransform: 'uppercase', fontWeight: 700,
              letterSpacing: '0.05em', marginBottom: 8,
            }}>
              Detail Permintaan
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  📍 {r.tipeLayanan === 'Antar' ? 'Alamat Pengantaran' : 'Alamat Penjemputan'}
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e293b', marginTop: 2 }}>
                  {r.alamat}
                </div>
              </div>
              {r.catatan && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>📝 Catatan</div>
                  <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: 2 }}>{r.catatan}</div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ marginBottom: 4 }}>
            <div style={{
              fontSize: '0.7rem', color: '#94a3b8',
              textTransform: 'uppercase', fontWeight: 700,
              letterSpacing: '0.05em', marginBottom: 4,
            }}>
              Perjalanan Pesanan
            </div>
            <StatusTimeline tipe={r.tipeLayanan} status={r.status} />
          </div>

          {/* Pesan selesai */}
          {r.status === 'Selesai' && (
            <div style={{
              background: '#d1fae5', border: '1px solid #6ee7b7',
              borderRadius: 10, padding: '12px 14px',
              marginTop: 12, textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.4rem' }}>🎉</div>
              <div style={{ fontWeight: 700, color: '#065f46', fontSize: '0.88rem', marginTop: 4 }}>
                Terima kasih sudah menggunakan layanan kami!
              </div>
            </div>
          )}

          {/* Hubungi admin */}
          {aktif && (
            <div style={{
              marginTop: 12,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 10, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: '1.2rem' }}>💬</span>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#15803d' }}>
                  Ada pertanyaan? Hubungi kami
                </div>
                <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: 1 }}>
                  Sebutkan nomor <strong>{r.id}</strong> saat menghubungi admin
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

// ── Komponen utama ─────────────────────────────────────────────────────────────

export default function UserStatusAntarJemput({ user }) {
  const [requests,   setRequests]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState('aktif')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (!user?.uid) return
    const q = query(
      collection(db, 'pickup_requests'),
      where('userUid', '==', user.uid),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ docId: d.id, ...d.data() }))
      setRequests(data)
      setLoading(false)
      setExpandedId(prev => {
        if (prev) return prev
        return data.find(r => isAktif(r.status))?.docId || null
      })
    })
    return () => unsub()
  }, [user?.uid])

  const filtered = requests.filter(r => {
    if (activeTab === 'aktif')   return isAktif(r.status)
    if (activeTab === 'selesai') return !isAktif(r.status)
    return true
  })

  const stats = {
    aktif:   requests.filter(r => isAktif(r.status)).length,
    selesai: requests.filter(r => r.status === 'Selesai').length,
    batal:   requests.filter(r => r.status === 'Dibatalkan').length,
  }

  const handleToggle = (docId) => setExpandedId(prev => prev === docId ? null : docId)

  const userName = user?.nama || user?.displayName || user?.email || 'Pelanggan'

  return (
    /* Wrapper: sama persis dengan pola dashboard — lebar penuh, max 700, center */
    <div style={{ width: '100%', maxWidth: 700, margin: '0 auto' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
          🚚 Status Antar Jemput
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
          Pantau status permintaan antar jemput kamu
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
          <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.92rem' }}>{userName}</div>
          <div style={{ color: '#60a5fa', fontSize: '0.8rem', marginTop: 2 }}>
            {stats.aktif > 0
              ? `${stats.aktif} permintaan aktif sedang berjalan`
              : 'Tidak ada permintaan aktif saat ini'}
          </div>
        </div>
        {stats.aktif > 0 && (
          <div style={{
            background: '#3b82f6', color: 'white',
            borderRadius: 20, padding: '4px 12px',
            fontWeight: 800, fontSize: '0.85rem',
          }}>
            {stats.aktif} Aktif
          </div>
        )}
      </div>

      {/* Statistik */}
      {requests.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
          {STAT_CONFIG.map(s => (
            <div key={s.key} style={{
              background: s.bg, borderRadius: 12,
              padding: '12px 10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.2rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color, lineHeight: 1.2, marginTop: 2 }}>
                {stats[s.key]}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab filter */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 16,
        background: '#f1f5f9', borderRadius: 12, padding: 4,
      }}>
        {FILTER_TABS.map(tab => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 9, cursor: 'pointer',
                border: 'none',
                background: active ? 'white' : 'transparent',
                color: active ? '#1e40af' : '#64748b',
                fontWeight: active ? 700 : 500,
                fontSize: '0.82rem',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {tab.icon} {tab.label}
              {tab.key === 'aktif' && stats.aktif > 0 && (
                <span style={{
                  marginLeft: 5,
                  background: '#3b82f6', color: 'white',
                  borderRadius: 10, padding: '1px 6px',
                  fontSize: '0.68rem', fontWeight: 700,
                }}>
                  {stats.aktif}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Daftar */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>⏳</div>
          <div>Memuat data...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '50px 20px',
          background: '#f8fafc', borderRadius: 16,
          border: '1.5px dashed #e2e8f0',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>
            {activeTab === 'aktif' ? '🚗' : '📭'}
          </div>
          <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.92rem' }}>
            {activeTab === 'aktif'    ? 'Tidak ada permintaan aktif'
             : activeTab === 'selesai' ? 'Belum ada permintaan yang selesai'
             : 'Belum ada permintaan'}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: 6 }}>
            {activeTab === 'aktif'
              ? 'Buat permintaan baru di menu Antar Jemput'
              : 'Riwayat permintaan akan muncul di sini'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(r => (
            <PickupCard
              key={r.docId}
              r={r}
              expanded={expandedId === r.docId}
              onToggle={() => handleToggle(r.docId)}
            />
          ))}
        </div>
      )}

      {/* Tips */}
      {!loading && requests.length > 0 && (
        <div style={{
          marginTop: 20, background: '#f8fafc', borderRadius: 10,
          padding: '10px 14px', fontSize: '0.78rem',
          color: '#64748b', textAlign: 'center',
        }}>
          💡 Klik pada kartu untuk melihat detail & timeline status
        </div>
      )}

    </div>
  )
}