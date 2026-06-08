import { useState } from 'react'
import { useApp, STATUS_FLOW } from '../context/AppContext'

const STATUS_COLOR = {
  'Diterima': 'badge-blue', 'Dijemput': 'badge-orange',
  'Dicuci': 'badge-purple', 'Disetrika': 'badge-yellow',
  'Siap Antar': 'badge-blue', 'Selesai': 'badge-green',
}

const NEXT_BTN = {
  'Diterima':   { label: '🚗 Proses Jemput', next: 'Dijemput' },
  'Dijemput':   { label: '🫧 Mulai Cuci',    next: 'Dicuci' },
  'Dicuci':     { label: '👔 Mulai Setrika',  next: 'Disetrika' },
  'Disetrika':  { label: '📦 Siap Diantar',  next: 'Siap Antar' },
  'Siap Antar': { label: '✅ Selesai',        next: 'Selesai' },
}

function ProgressBar({ status }) {
  const idx = STATUS_FLOW.indexOf(status)
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', padding: '8px 0' }}>
      {STATUS_FLOW.map((s, i) => (
        <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          {i > 0 && (
            <div style={{
              position: 'absolute', top: 17, right: '50%', width: '100%', height: 3,
              background: i <= idx ? '#2563eb' : '#e2e8f0', transition: 'background 0.3s',
            }} />
          )}
          <div className={`step-circle ${i < idx ? 'done' : i === idx ? 'current' : 'pending'}`}>
            {i < idx ? '✓' : i + 1}
          </div>
          <div className="step-label" style={{ color: i <= idx ? '#2563eb' : '#94a3b8', fontWeight: i === idx ? 700 : 400 }}>
            {s}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function StatusCucian() {
  const { orders, updateOrderStatus } = useApp()
  const [selected, setSelected]       = useState(null)
  const [toast, setToast]             = useState(null)
  const [filterStatus, setFilterStatus] = useState('Semua')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const handleNext = (order, e) => {
    e.stopPropagation()
    const { next } = NEXT_BTN[order.status]
    updateOrderStatus(order.id, next)
    showToast(`✅ Status ${order.id} diupdate ke "${next}"`)
    if (selected?.id === order.id) setSelected({ ...order, status: next })
  }

  const active   = orders.filter(o => o.status !== 'Selesai')
  const filtered = filterStatus === 'Semua' ? active : active.filter(o => o.status === filterStatus)

  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>🔄 Status Cucian</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Update dan pantau status order pelanggan</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
        {/* Order list */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Order Aktif ({filtered.length})</h3>
            <select className="form-select" style={{ fontSize: '0.82rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option>Semua</option>
              {STATUS_FLOW.filter(s => s !== 'Selesai').map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎉</div>
              <div>Tidak ada order aktif</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(order => (
                <div key={order.id}
                  onClick={() => setSelected(selected?.id === order.id ? null : order)}
                  style={{
                    padding: '14px 16px', borderRadius: 12,
                    border: `2px solid ${selected?.id === order.id ? '#3b82f6' : '#f1f5f9'}`,
                    background: selected?.id === order.id ? '#eff6ff' : '#fafafa',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.82rem' }}>{order.id}</span>
                      <span style={{ fontWeight: 600, marginLeft: 8 }}>{order.nama}</span>
                    </div>
                    <span className={`badge ${STATUS_COLOR[order.status] || 'badge-gray'}`}>{order.status}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 8 }}>{order.layanan.join(' • ')}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Masuk: {order.tanggalMasuk}</div>
                    {NEXT_BTN[order.status] && (
                      <button className="btn btn-primary btn-sm" onClick={e => handleNext(order, e)}>
                        {NEXT_BTN[order.status].label}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress detail */}
        {selected && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>📍 Progress Order</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>{selected.nama}</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{selected.id} · {selected.telepon}</div>
            </div>
            <ProgressBar status={selected.status} />
            <div style={{ marginTop: 20, background: '#f8fafc', borderRadius: 10, padding: '14px' }}>
              {[['Layanan', selected.layanan.join(', ')], ['Berat', `${selected.berat} kg`], ['Masuk', selected.tanggalMasuk], ['Est. Selesai', selected.tanggalSelesai], ['Pembayaran', selected.statusPembayaran]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>{k}</span><strong>{v}</strong>
                </div>
              ))}
            </div>
            {NEXT_BTN[selected.status] && (
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={e => handleNext(selected, e)}>
                {NEXT_BTN[selected.status].label}
              </button>
            )}
            {selected.status === 'Selesai' && (
              <div style={{ textAlign: 'center', padding: '16px', background: '#dcfce7', borderRadius: 10, marginTop: 16 }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🎉</div>
                <div style={{ fontWeight: 700, color: '#16a34a' }}>Order Selesai!</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}