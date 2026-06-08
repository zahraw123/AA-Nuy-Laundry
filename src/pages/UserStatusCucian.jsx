import { useState } from 'react'
import { useApp, STATUS_FLOW } from '../context/AppContext'

const formatRp = n => `Rp ${n.toLocaleString('id-ID')}`

export default function UserStatusCucian() {
  const { orders, myOrders, loading } = useApp()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(undefined) // undefined=belum cari, null=tidak ketemu

  const normalizePhone = value => (value || '').toString().replace(/\D/g, '')

  const handleCari = () => {
    const q = query.trim().toLowerCase()
    if (!q) {
      setResult(undefined)
      return
    }

    const phoneQuery = normalizePhone(q)
    const foundByOrderCode = orders.find(o => o.id?.toLowerCase() === q)
    const foundByMyOrder = myOrders.find(o => {
      const phone = normalizePhone(o.telepon || o.userPhone || '')
      return (
        o.id?.toLowerCase() === q ||
        o.id?.toLowerCase().includes(q) ||
        phone === phoneQuery ||
        (o.telepon || '').toLowerCase() === q ||
        (o.nama || '').toLowerCase().includes(q) ||
        (o.status || '').toLowerCase() === q
      )
    })

    setResult(foundByOrderCode || foundByMyOrder || null)
  }

  const idx = result ? STATUS_FLOW.indexOf(result.status) : -1

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>⏳ Memuat...</div>

  return (
    <div className="center-page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>🔄 Status Cucian</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0' }}>Pantau status laundry kamu</p>
      </div>

      {/* Cari by no order */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px #0001', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
            placeholder="Masukkan No. Order (CLK-xxx)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCari()}
          />
          <button onClick={handleCari}
            style={{ padding: '10px 20px', background: '#2563eb', color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Cek
          </button>
        </div>

        {result === null && (
          <p style={{ color: '#ef4444', margin: '12px 0 0', fontSize: '0.88rem' }}>❌ Order tidak ditemukan</p>
        )}
      </div>

      {/* Hasil pencarian */}
      {result && (
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 6px #0001', marginBottom: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{result.nama}</div>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{result.id}</div>
          </div>

          {/* Progress */}
          <div style={{ display: 'flex', marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
            {STATUS_FLOW.map((s, i) => (
              <div key={s} style={{ flex: 1, textAlign: 'center', position: 'relative', minWidth: 60 }}>
                {i > 0 && (
                  <div style={{
                    position: 'absolute', top: 13, right: '50%', width: '100%', height: 3,
                    background: i <= idx ? '#2563eb' : '#e2e8f0'
                  }} />
                )}
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', margin: '0 auto 4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i <= idx ? '#2563eb' : '#e2e8f0',
                  color: i <= idx ? 'white' : '#94a3b8',
                  fontWeight: 700, fontSize: '0.7rem', position: 'relative', zIndex: 1
                }}>
                  {i < idx ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: '0.6rem', color: i <= idx ? '#2563eb' : '#94a3b8', fontWeight: i === idx ? 700 : 400 }}>
                  {s}
                </div>
              </div>
            ))}
          </div>

          {[
            ['Layanan', result.layanan?.join(', ')],
            ['Berat', `${result.berat} kg`],
            ['Total', formatRp(result.totalHarga)],
            ['Est. Selesai', result.tanggalSelesai],
            ['Pembayaran', result.statusPembayaran],
            ['Catatan', result.catatan || '-'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
              <span style={{ color: '#64748b' }}>{k}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}