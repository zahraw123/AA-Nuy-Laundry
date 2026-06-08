import { useApp } from '../context/AppContext'

const formatRp = n => `Rp ${n.toLocaleString('id-ID')}`

export default function UserRiwayat() {
  const { myOrders, loading } = useApp()
  const selesai = myOrders.filter(o => o.status === 'Selesai')

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>⏳ Memuat...</div>

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>📜 Riwayat Order</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0' }}>Semua order yang sudah selesai</p>
      </div>

      {selesai.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>📭</div>
          <div>Belum ada riwayat order</div>
        </div>
      ) : selesai.map(o => (
        <div key={o.id} style={{ background: 'white', borderRadius: 12, padding: '16px 20px', marginBottom: 12, boxShadow: '0 1px 6px #0001' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.85rem' }}>{o.id}</span>
            <span style={{ fontSize: '0.75rem', padding: '2px 10px', background: '#dcfce7', color: '#15803d', borderRadius: 20, fontWeight: 600 }}>✅ Selesai</span>
          </div>
          <div style={{ fontSize: '0.88rem', color: '#374151', marginBottom: 4 }}>{o.layanan?.join(', ')}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
            <span>Tgl. masuk: {o.tanggalMasuk}</span>
            <span style={{ fontWeight: 700, color: '#1e293b' }}>{formatRp(o.totalHarga)}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: '0.78rem' }}>
            <span style={{
              padding: '2px 8px', borderRadius: 20, fontWeight: 600,
              background: o.statusPembayaran === 'Lunas' ? '#dcfce7' : '#fee2e2',
              color: o.statusPembayaran === 'Lunas' ? '#15803d' : '#dc2626'
            }}>
              {o.statusPembayaran}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}