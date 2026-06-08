import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, doc, updateDoc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/config'

// ── Konstanta ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = {
  Jemput:          ['Diproses', 'Dikonfirmasi', 'Sedang Dijemput', 'Selesai', 'Dibatalkan'],
  Antar:           ['Diproses', 'Dikonfirmasi', 'Siap Diantar', 'Selesai', 'Dibatalkan'],
  'Antar & Jemput': ['Diproses', 'Dikonfirmasi', 'Sedang Dijemput', 'Siap Diantar', 'Selesai', 'Dibatalkan'],
}

const STATUS_COLOR = {
  Diproses:         { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  Dikonfirmasi:     { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  'Sedang Dijemput': { bg: '#e0f2fe', color: '#0369a1', dot: '#0ea5e9' },
  'Siap Diantar':   { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6' },
  Selesai:          { bg: '#dcfce7', color: '#065f46', dot: '#10b981' },
  Dibatalkan:       { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
}

const TIPE_COLOR = {
  Jemput:          { bg: '#eff6ff', color: '#1d4ed8', icon: '🚗' },
  Antar:           { bg: '#ecfdf5', color: '#065f46', icon: '🏠' },
  'Antar & Jemput': { bg: '#f5f3ff', color: '#5b21b6', icon: '🔄' },
}

const FILTER_TIPE   = ['Semua', 'Jemput', 'Antar', 'Antar & Jemput']
const FILTER_STATUS = ['Semua', 'Aktif', 'Selesai', 'Dibatalkan']

const SLOT_OPTIONS = ['Secepatnya', 'Pagi (08–12)', 'Siang (12–15)', 'Sore (15–18)']

const STAT_CONFIG = [
  { key: 'total',   label: 'Total',   bg: '#f1f5f9', color: '#475569', icon: '📋' },
  { key: 'aktif',   label: 'Aktif',   bg: '#dbeafe', color: '#1d4ed8', icon: '🔄' },
  { key: 'selesai', label: 'Selesai', bg: '#dcfce7', color: '#15803d', icon: '✅' },
  { key: 'batal',   label: 'Batal',   bg: '#fee2e2', color: '#dc2626', icon: '❌' },
]

// ── Helper ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const c = STATUS_COLOR[status] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: c.bg, color: c.color,
      borderRadius: 8, padding: '5px 10px',
      fontSize: '0.78rem', fontWeight: 700,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {status}
    </span>
  )
}

function TipeBadge({ tipe }) {
  const c = TIPE_COLOR[tipe] || TIPE_COLOR.Jemput
  return (
    <span style={{
      background: c.bg, color: c.color,
      borderRadius: 6, padding: '2px 8px',
      fontSize: '0.72rem', fontWeight: 700,
    }}>
      {c.icon} {tipe}
    </span>
  )
}

// ── Komponen utama ─────────────────────────────────────────────────────────────

export default function SistemAntarJemput() {
  const [requests,     setRequests]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filterTipe,   setFilterTipe]   = useState('Semua')
  const [filterStatus, setFilterStatus] = useState('Semua')
  const [search,       setSearch]       = useState('')
  const [selected,     setSelected]     = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [editData,     setEditData]     = useState(null)

  // Realtime listener
  useEffect(() => {
    const q = query(collection(db, 'pickup_requests'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ docId: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Filter & search
  const filtered = requests.filter(r => {
    if (filterTipe !== 'Semua' && r.tipeLayanan !== filterTipe) return false
    if (filterStatus === 'Aktif'     && ['Selesai', 'Dibatalkan'].includes(r.status)) return false
    if (filterStatus === 'Selesai'   && r.status !== 'Selesai')   return false
    if (filterStatus === 'Dibatalkan' && r.status !== 'Dibatalkan') return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        r.nama?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q) ||
        r.telepon?.includes(q)
      )
    }
    return true
  })

  // Statistik
  const stats = {
    total:   requests.length,
    aktif:   requests.filter(r => !['Selesai', 'Dibatalkan'].includes(r.status)).length,
    selesai: requests.filter(r => r.status === 'Selesai').length,
    batal:   requests.filter(r => r.status === 'Dibatalkan').length,
  }

  const openDetail = (r) => {
    setSelected(r)
    setEditData({
      status:    r.status    || '',
      catatan:   r.catatan   || '',
      slotWaktu: r.slotWaktu || '',
    })
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'pickup_requests', selected.docId), {
        status:    editData.status,
        catatan:   editData.catatan,
        slotWaktu: editData.slotWaktu,
        updatedAt: serverTimestamp(),
      })
      setSelected(null)
    } catch (err) {
      console.error(err)
      alert('Gagal menyimpan. Coba lagi.')
    }
    setSaving(false)
  }

  const handleWhatsApp = () => {
    const phone = selected.telepon.replace(/^0/, '62').replace(/\D/g, '')
    const msg = `Halo ${selected.nama}, pesanan antar jemput kamu (${selected.id}) sedang dalam status: *${editData.status}*. Terima kasih! 🙏`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const statusOpts = selected
    ? (STATUS_OPTIONS[selected.tipeLayanan] || STATUS_OPTIONS.Jemput)
    : []

  return (
    <div style={{ maxWidth: 900 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
          🚗 Sistem Antar Jemput
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
          Kelola semua permintaan antar jemput dari pelanggan
        </p>
      </div>

      {/* Statistik */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {STAT_CONFIG.map(s => (
          <div key={s.key} style={{
            background: s.bg, borderRadius: 12,
            padding: '14px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, lineHeight: 1.2 }}>
              {stats[s.key]}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter & search */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>

          <input
            className="form-input"
            style={{ flex: 1, minWidth: 200, margin: 0 }}
            placeholder="🔍 Cari nama, nomor PKP, atau telepon..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTER_TIPE.map(t => {
              const active = filterTipe === t
              return (
                <button
                  key={t}
                  onClick={() => setFilterTipe(t)}
                  style={{
                    padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                    border: `1.5px solid ${active ? '#3b82f6' : '#e2e8f0'}`,
                    background: active ? '#eff6ff' : 'white',
                    color: active ? '#1d4ed8' : '#64748b',
                    fontWeight: active ? 700 : 400,
                    fontSize: '0.8rem', whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                >
                  {TIPE_COLOR[t]?.icon} {t}
                </button>
              )
            })}
          </div>

          <select
            className="form-input"
            style={{ width: 'auto', margin: 0 }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            {FILTER_STATUS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Daftar permintaan */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>⏳ Memuat data...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem' }}>📭</div>
          <div style={{ marginTop: 8 }}>Tidak ada data yang cocok</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(r => (
            <div
              key={r.docId}
              className="card"
              style={{ padding: '14px 16px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onClick={() => openDetail(r)}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.15)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>

                {/* Kiri */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.9rem' }}>{r.id}</span>
                    <TipeBadge tipe={r.tipeLayanan} />
                  </div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.92rem', marginBottom: 2 }}>
                    {r.nama}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 2 }}>
                    📱 {r.telepon || '-'}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 6 }}>
                    📍 {r.alamat}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[`🕐 ${r.slotWaktu}`, `📅 ${r.tanggalRequest}`].map(label => (
                      <span key={label} style={{
                        background: '#f1f5f9', color: '#475569',
                        borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem',
                      }}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Kanan */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <StatusBadge status={r.status} />
                  <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#94a3b8' }}>
                    Klik untuk kelola →
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal detail / edit */}
      {selected && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div style={{
            background: 'white', borderRadius: 16,
            width: '100%', maxWidth: 520,
            maxHeight: '90vh', overflowY: 'auto',
            padding: 24,
          }}>

            {/* Header modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e3a8a' }}>{selected.id}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                  {TIPE_COLOR[selected.tipeLayanan]?.icon} {selected.tipeLayanan} · {selected.tanggalRequest}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: '#f1f5f9', border: 'none', borderRadius: 8,
                  padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem',
                }}
              >
                ✕ Tutup
              </button>
            </div>

            {/* Info pelanggan */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Data Pelanggan
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Nama',    selected.nama],
                  ['Telepon', selected.telepon || '-'],
                  ['Email',   selected.email   || '-'],
                  ['Slot',    selected.slotWaktu],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{k}</div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.87rem' }}>{v}</div>
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Alamat</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.87rem' }}>{selected.alamat}</div>
                </div>
              </div>
            </div>

            {/* Form edit */}
            <div className="form-group">
              <label className="form-label">🔄 Update Status</label>
              <select
                className="form-input"
                value={editData.status}
                onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}
              >
                {statusOpts.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">🕐 Slot Waktu</label>
              <select
                className="form-input"
                value={editData.slotWaktu}
                onChange={e => setEditData(d => ({ ...d, slotWaktu: e.target.value }))}
              >
                {SLOT_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">📝 Catatan Admin</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Catatan internal untuk driver atau admin lain..."
                value={editData.catatan}
                onChange={e => setEditData(d => ({ ...d, catatan: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Tombol aksi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {selected.telepon && (
                <button
                  onClick={handleWhatsApp}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 8, cursor: 'pointer',
                    border: '1.5px solid #22c55e', background: '#f0fdf4',
                    color: '#15803d', fontWeight: 600, fontSize: '0.88rem',
                  }}
                >
                  💬 Hubungi via WhatsApp
                </button>
              )}
              <button
                onClick={handleSave}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={saving}
              >
                {saving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}