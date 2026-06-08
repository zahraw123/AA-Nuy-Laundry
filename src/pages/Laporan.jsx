import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const formatRp = (n) => `Rp ${n.toLocaleString('id-ID')}`
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1']

export default function Laporan() {
  const { orders } = useApp()
  const [period, setPeriod] = useState('Semua')
  const [filterLayanan, setFilterLayanan] = useState('Semua')

  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'

  const filtered = useMemo(() => {
    let list = orders
    if (period === 'Hari Ini') list = list.filter(o => o.tanggalMasuk === today)
    else if (period === 'Minggu Ini') list = list.filter(o => o.tanggalMasuk >= weekAgo)
    else if (period === 'Bulan Ini') list = list.filter(o => o.tanggalMasuk >= monthStart)
    if (filterLayanan !== 'Semua') list = list.filter(o => o.layanan.includes(filterLayanan))
    return list
  }, [orders, period, filterLayanan, today, weekAgo, monthStart])

  const selesai = filtered.filter(o => o.status === 'Selesai')
  const lunas = filtered.filter(o => o.statusPembayaran === 'Lunas')
  const totalPendapatan = lunas.reduce((s, o) => s + o.totalHarga, 0)
  const avgOrder = filtered.length ? Math.round(totalPendapatan / (lunas.length || 1)) : 0

  const allLayanan = [...new Set(orders.flatMap(o => o.layanan))]
  const rekapLayanan = allLayanan.map(l => {
    const list = filtered.filter(o => o.layanan.includes(l))
    const pendapatan = list.filter(o => o.statusPembayaran === 'Lunas').reduce((s, o) => s + o.totalHarga, 0)
    return { layanan: l, jumlah: list.length, pendapatan }
  }).filter(r => r.jumlah > 0).sort((a, b) => b.jumlah - a.jumlah)

  const pieData = rekapLayanan.map(r => ({ name: r.layanan, value: r.pendapatan }))
  const barData = rekapLayanan.map(r => ({ name: r.layanan, order: r.jumlah, pendapatan: r.pendapatan }))

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1300,
        margin: '0 auto',
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>📈 Laporan</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Rekap dan analisis detail pesanan laundry</p>
      </div>

      {/* Filters */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
          }}
        >
          {['Semua', 'Hari Ini', 'Minggu Ini', 'Bulan Ini'].map(p => (
            <button
              key={p}
              className="btn"
              style={{
                background: period === p ? '#2563eb' : 'white',
                color: period === p ? 'white' : '#374151',
                border: `1px solid ${period === p ? '#2563eb' : '#e2e8f0'
                  }`,
              }}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}

          <select
            className="form-select"
            value={filterLayanan}
            onChange={(e) => setFilterLayanan(e.target.value)}
          >
            <option value="Semua">Semua Layanan</option>
            {allLayanan.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-outline"
          onClick={() => window.print()}
        >
          🖨️ Cetak Laporan
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 28, alignItems: 'stretch' }}>
        {[
          { icon: '💵', label: 'Total Pendapatan', value: formatRp(totalPendapatan), bg: '#dcfce7', iconBg: '#16a34a' },
          { icon: '📦', label: 'Total Order', value: filtered.length, bg: '#dbeafe', iconBg: '#2563eb' },
          { icon: '✅', label: 'Order Selesai', value: selesai.length, bg: '#dcfce7', iconBg: '#16a34a' },
          { icon: '⏳', label: 'Order Pending', value: filtered.length - selesai.length, bg: '#fef9c3', iconBg: '#ca8a04' },
          { icon: '💰', label: 'Sudah Lunas', value: lunas.length, bg: '#dcfce7', iconBg: '#16a34a' },
          { icon: '📊', label: 'Rata-rata/Order', value: formatRp(avgOrder), bg: '#ede9fe', iconBg: '#7c3aed' },
        ].map(s => (
          <div
            className="stat-card"
            key={s.label}
            style={{
              background: s.bg,
              border: '1px solid rgba(255,255,255,0.6)',
              borderRadius: 20,
              padding: 20,
              minHeight: 110,
              boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
            }}
          >
            <div className="stat-icon" style={{ background: s.iconBg + '22', fontSize: '1.2rem' }}>{s.icon}</div>
            <div>
              <div className="stat-value" style={{ fontSize: '1.1rem' }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {rekapLayanan.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20, marginBottom: 24 }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>💰 Proporsi Pendapatan per Layanan</h3>
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatRp(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>📊 Jumlah Order per Layanan</h3>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" angle={-40} textAnchor="end" height={80} interval={0} tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="order" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>📈 Ringkasan Performa Layanan</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {rekapLayanan.map((r, idx) => (
                <div key={r.layanan} style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                      <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{r.layanan}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b' }}>📦 {r.jumlah} order</span>
                      <span style={{ fontWeight: 600, color: '#16a34a' }}>{formatRp(r.pendapatan)}</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', background: COLORS[idx % COLORS.length],
                      width: `${(r.pendapatan / Math.max(...rekapLayanan.map(x => x.pendapatan))) * 100}%`,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Order selesai */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>📋 Daftar Order Selesai</h3>
        {selesai.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>Belum ada order selesai dalam periode ini</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>No. Order</th><th>Nama</th><th>Layanan</th><th>Total</th><th>Metode Bayar</th><th>Tgl. Selesai</th><th>Status Bayar</th></tr>
              </thead>
              <tbody>
                {selesai.map(o => (
                  <tr key={o.id}>
                    <td><span style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.8rem' }}>{o.id}</span></td>
                    <td style={{ fontWeight: 600 }}>{o.nama}</td>
                    <td style={{ fontSize: '0.8rem' }}>{o.layanan.join(', ')}</td>
                    <td style={{ fontWeight: 600 }}>{formatRp(o.totalHarga)}</td>
                    <td>{o.metodePembayaran}</td>
                    <td>{o.tanggalSelesai}</td>
                    <td><span className={`badge ${o.statusPembayaran === 'Lunas' ? 'badge-green' : 'badge-red'}`}>{o.statusPembayaran}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rekap layanan */}
      <div className="card">
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>📊 Rekap per Jenis Layanan</h3>
        {rekapLayanan.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Tidak ada data</div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Jenis Layanan</th><th>Jumlah Order</th><th>Total Pendapatan</th><th>Proporsi</th></tr></thead>
            <tbody>
              {rekapLayanan.map(r => (
                <tr key={r.layanan}>
                  <td style={{ fontWeight: 600 }}>{r.layanan}</td>
                  <td>{r.jumlah} order</td>
                  <td style={{ fontWeight: 600 }}>{formatRp(r.pendapatan)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, background: '#3b82f6', width: `${(r.jumlah / filtered.length) * 100}%` }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>{Math.round((r.jumlah / filtered.length) * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

<style>{`
@media (max-width: 768px){

  .stat-card{
    padding:16px !important;
  }

  .data-table{
    min-width:700px;
  }

}

@media (max-width: 480px){

  h1{
    font-size:1.2rem !important;
  }

  .stat-card{
    min-height:auto !important;
  }

}
`}</style>