import { useApp } from '../context/AppContext'
import { Link } from 'react-router-dom'

const formatRp = (n) => `Rp ${n.toLocaleString('id-ID')}`

const statusColor = {
  'Diterima': 'badge-blue',
  'Dijemput': 'badge-orange',
  'Dicuci': 'badge-purple',
  'Disetrika': 'badge-yellow',
  'Siap Antar': 'badge-blue',
  'Selesai': 'badge-green',
  'Diproses': 'badge-purple',
}

export default function Dashboard() {
  const { orders } = useApp()

  const stats = {
    total: orders.length,
    baru: orders.filter(o => o.status === 'Diterima').length,
    proses: orders.filter(o => !['Selesai', 'Diterima'].includes(o.status)).length,
    selesai: orders.filter(o => o.status === 'Selesai').length,
    belumBayar: orders.filter(o => o.status === 'Belum Bayar').length,
    pendapatan: orders.filter(o => o.statusPembayaran === 'Lunas').reduce((s, o) => s + o.totalHarga, 0),
  }

  const recent = [...orders].slice(0, 5)

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: '850px', 
      margin: '0 auto', 
      padding: '24px 20px',
      boxSizing: 'border-box'
    }}>
      
      {/* Header Section */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
          Selamat Datang, Admin! 👋
        </h1>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>
          Berikut adalah ringkasan aktivitas dan performa laundry hari ini.
        </p>
      </div>

      {/* Grid Kartu Statistik */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: 16, 
        marginBottom: 32 
      }}>
        {[
          { label: 'Total Order', value: stats.total, icon: '📦', bg: '#f8fafc' },
          { label: 'Order Baru', value: stats.baru, icon: '✨', bg: '#eff6ff' },
          { label: 'Sedang Diproses', value: stats.proses, icon: '🔄', bg: '#f5f3ff' },
          { label: 'Selesai', value: stats.selesai, icon: '✅', bg: '#f0fdf4' },
          { label: 'Belum Bayar', value: stats.belumBayar, icon: '⚠️', bg: '#fff7ed' },
          { label: 'Total Pendapatan', value: formatRp(stats.pendapatan), icon: '💰', bg: '#f0fdf4', isHarga: true },
        ].map((item, idx) => (
          <div 
            key={idx} 
            style={{ 
              background: item.bg,
              border: '1px solid #e2e8f0',
              borderRadius: '14px', 
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
          >
            <div>
              <div style={{ 
                fontSize: '0.85rem', 
                fontWeight: 600, 
                color: '#64748b', 
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 6
              }}>
                {item.label}
              </div>
              <div style={{ 
                fontSize: item.isHarga ? '1.35rem' : '1.75rem', 
                fontWeight: 800, 
                color: '#0f172a' 
              }}>
                {item.value}
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', opacity: 0.8 }}>{item.icon}</div>
          </div>
        ))}
      </div>

      {/* Section Tabel Order Terbaru */}
      <div style={{ 
        background: 'white', 
        borderRadius: '16px', 
        padding: '24px', 
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📋</span> Order Terbaru
          </h3>
          <Link to="/data-order" style={{ 
            color: '#2563eb', 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: '8px',
            background: '#eff6ff',
            transition: 'background 0.2s'
          }}>
            Lihat Semua →
          </Link>
        </div>

        {/* Responsive Table Wrapper */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '8px' }}>
          <table className="data-table" style={{ minWidth: '700px', width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: '12px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>No. Order</th>
                <th style={{ padding: '12px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Nama Pelanggan</th>
                <th style={{ padding: '12px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Total Harga</th>
                <th style={{ padding: '12px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Status Order</th>
                <th style={{ padding: '12px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Pembayaran</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(order => (
                <tr key={order.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.9rem' }}>{order.id}</span>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>{order.nama}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>{order.telepon}</div>
                  </td>
                  <td style={{ padding: '16px 12px', fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                    {formatRp(order.totalHarga)}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span className={`badge ${statusColor[order.status] || 'badge-gray'}`} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span className={`badge ${order.statusPembayaran === 'Lunas' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                      {order.statusPembayaran}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}