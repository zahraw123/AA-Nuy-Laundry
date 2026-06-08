import { useState, useMemo } from 'react'
import { useApp, STATUS_FLOW } from '../context/AppContext'

const formatRp = (n) => `Rp ${n.toLocaleString('id-ID')}`

const STATUS_COLOR = {
  'Diterima': 'badge-blue', 'Dijemput': 'badge-orange',
  'Dicuci': 'badge-purple', 'Disetrika': 'badge-yellow',
  'Siap Antar': 'badge-blue', 'Selesai': 'badge-green', 'Diproses': 'badge-purple',
}

export default function DetailPesanan() {
  const { orders, deleteOrder, updateOrderStatus, updatePaymentStatus } = useApp()
  const [search,        setSearch]        = useState('')
  const [filterStatus,  setFilterStatus]  = useState('Semua')
  const [filterBayar,   setFilterBayar]   = useState('Semua')
  const [sort,          setSort]          = useState('Terbaru')
  const [detail,        setDetail]        = useState(null)
  const [toast,         setToast]         = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmBayar,  setConfirmBayar]  = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const filtered = useMemo(() => {
    let list = orders.filter(o => o.status !== 'Selesai')
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(o => o.nama.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.telepon.includes(q))
    }
    if (filterStatus !== 'Semua') list = list.filter(o => o.status === filterStatus)
    if (filterBayar  !== 'Semua') list = list.filter(o => o.statusPembayaran === filterBayar)
    if (sort === 'Terbaru')       list.sort((a, b) => b.id.localeCompare(a.id))
    else if (sort === 'Terlama')  list.sort((a, b) => a.id.localeCompare(b.id))
    else if (sort === 'Nama A-Z') list.sort((a, b) => a.nama.localeCompare(b.nama))
    return list
  }, [orders, search, filterStatus, filterBayar, sort])

  const handleDelete = (id) => {
    deleteOrder(id); setConfirmDelete(null); setDetail(null)
    showToast('🗑️ Order berhasil dihapus', 'error')
  }

  const handleToggleBayar = (order) => {
    const isLunas = order.statusPembayaran === 'Lunas'
    setConfirmBayar({ id: order.id, nama: order.nama, action: isLunas ? 'Belum Bayar' : 'Lunas' })
  }

  const doToggleBayar = () => {
    updatePaymentStatus(confirmBayar.id, confirmBayar.action, null)
    if (detail?.id === confirmBayar.id) setDetail(d => ({ ...d, statusPembayaran: confirmBayar.action }))
    showToast(confirmBayar.action === 'Lunas' ? '💰 Pembayaran dikonfirmasi!' : '↩️ Status dikembalikan ke Belum Bayar')
    setConfirmBayar(null)
  }

  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>👥 Detail Pesanan</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Kelola semua detail pesanan pelanggan</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div className="search-box" style={{ flex: '1 1 220px' }}>
            <span>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, no. order, telepon..." />
          </div>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option>Semua</option>
            {STATUS_FLOW.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="form-select" value={filterBayar} onChange={e => setFilterBayar(e.target.value)}>
            <option>Semua</option><option>Belum Bayar</option><option>Lunas</option>
          </select>
          <select className="form-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option>Terbaru</option><option>Terlama</option><option>Nama A-Z</option>
          </select>
          <button className="btn btn-outline btn-sm" onClick={() => showToast('📥 Fitur export segera hadir!', 'info')}>
            📥 Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Menampilkan <strong>{filtered.length}</strong> dari <strong>{orders.length}</strong> order
          </span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>📭</div>
            <div>Tidak ada data yang sesuai filter</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. Order</th><th>Nama</th><th>Telepon</th><th>Layanan</th>
                  <th>Total</th><th>Status</th><th>Status Bayar</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id}>
                    <td><span style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.8rem' }}>{order.id}</span></td>
                    <td style={{ fontWeight: 600 }}>{order.nama}</td>
                    <td style={{ fontSize: '0.82rem' }}>{order.telepon}</td>
                    <td style={{ fontSize: '0.8rem', maxWidth: 140 }}>{order.layanan?.join(', ')}</td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatRp(order.totalHarga)}</td>
                    <td><span className={`badge ${STATUS_COLOR[order.status] || 'badge-gray'}`}>{order.status}</span></td>
                    <td>
                      <button
                        onClick={() => handleToggleBayar(order)}
                        title={order.statusPembayaran === 'Lunas' ? 'Klik untuk batalkan' : 'Klik untuk tandai lunas'}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                          fontSize: '0.78rem', cursor: 'pointer', border: '2px solid', transition: 'all 0.15s',
                          ...(order.statusPembayaran === 'Lunas'
                            ? { background: '#dcfce7', color: '#15803d', borderColor: '#86efac' }
                            : { background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }),
                        }}
                      >
                        {order.statusPembayaran === 'Lunas' ? '✅' : '⏳'} {order.statusPembayaran}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setDetail(order)}>👁</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(order.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal toggle bayar */}
      {confirmBayar && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{confirmBayar.action === 'Lunas' ? '💰' : '↩️'}</div>
            <h3 style={{ margin: '0 0 8px' }}>{confirmBayar.action === 'Lunas' ? 'Konfirmasi Pembayaran?' : 'Batalkan Pembayaran?'}</h3>
            <p style={{ color: '#64748b', margin: '0 0 6px', fontSize: '0.9rem' }}>Order <strong>{confirmBayar.id}</strong></p>
            <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: '0.9rem' }}>{confirmBayar.nama}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 10, padding: '8px 16px', marginBottom: 24, fontSize: '0.88rem' }}>
              <span style={{ color: confirmBayar.action === 'Lunas' ? '#dc2626' : '#15803d', fontWeight: 600 }}>{confirmBayar.action === 'Lunas' ? 'Belum Bayar' : 'Lunas'}</span>
              <span style={{ color: '#94a3b8' }}>→</span>
              <span style={{ color: confirmBayar.action === 'Lunas' ? '#15803d' : '#dc2626', fontWeight: 600 }}>{confirmBayar.action}</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setConfirmBayar(null)}>Batal</button>
              <button className={`btn ${confirmBayar.action === 'Lunas' ? 'btn-success' : 'btn-danger'}`} style={{ flex: 1 }} onClick={doToggleBayar}>
                {confirmBayar.action === 'Lunas' ? '✅ Tandai Lunas' : '↩️ Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hapus */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 360, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px' }}>Hapus Order?</h3>
            <p style={{ color: '#64748b', margin: '0 0 24px', fontSize: '0.9rem' }}>Order <strong>{confirmDelete}</strong> akan dihapus permanen.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Batal</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(confirmDelete)}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detail */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>📋 Detail Order</h2>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#64748b' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {[['No. Order', detail.id], ['Nama', detail.nama], ['Telepon', detail.telepon], ['Alamat', detail.alamat], ['Layanan', detail.layanan?.join(', ')], ['Berat', `${detail.berat} kg`], ['Total Harga', formatRp(detail.totalHarga)], ['Tgl. Masuk', detail.tanggalMasuk], ['Est. Selesai', detail.tanggalSelesai], ['Metode Bayar', detail.metodePembayaran], ['Catatan', detail.catatan || '-']].map(([k, v]) => (
                <div key={k} style={{ gridColumn: ['Alamat','Layanan','Catatan'].includes(k) ? '1 / -1' : '' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{k}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
            {detail.bukti && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Bukti Pembayaran</div>
                <img src={detail.bukti} alt="bukti" className="bukti-img" onClick={() => window.open(detail.bukti, '_blank')} onError={e => e.target.style.display = 'none'} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span className={`badge ${STATUS_COLOR[detail.status] || 'badge-gray'}`}>{detail.status}</span>
              <span className={`badge ${detail.statusPembayaran === 'Lunas' ? 'badge-green' : 'badge-red'}`}>{detail.statusPembayaran}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {detail.statusPembayaran === 'Belum Bayar'
                ? <button className="btn btn-success btn-sm" onClick={() => handleToggleBayar(detail)}>💰 Tandai Lunas</button>
                : <button className="btn btn-outline btn-sm" onClick={() => handleToggleBayar(detail)}>↩️ Batalkan Lunas</button>
              }
              <button className="btn btn-outline btn-sm" onClick={() => setDetail(null)}>Tutup</button>
              <button className="btn btn-danger btn-sm" onClick={() => { setDetail(null); setConfirmDelete(detail.id) }}>🗑️ Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}