import { useState } from 'react'
import { useApp } from '../context/AppContext'

const formatRp = (n) => `Rp ${n.toLocaleString('id-ID')}`

export default function FormPembayaran() {
  const { orders, updatePaymentStatus } = useApp()
  const [query, setQuery]           = useState('')
  const [selected, setSelected]     = useState(null)
  const [step, setStep]             = useState(1)
  const [metode, setMetode]         = useState('Cash')
  const [jumlahBayar, setJumlahBayar] = useState('')
  const [showSuccess, setShowSuccess] = useState(null)

  const results = query.trim().length > 1
    ? orders.filter(o =>
        o.nama.toLowerCase().includes(query.toLowerCase()) ||
        o.id.toLowerCase().includes(query.toLowerCase())
      )
    : []

  const handleSelect = (order) => {
    setSelected(order)
    setMetode(order.metodePembayaran || 'Cash')
    setJumlahBayar(String(order.totalHarga))
    setStep(2)
  }

  const handleConfirm = () => {
    updatePaymentStatus(selected.id, 'Lunas', metode)
    setShowSuccess({ ...selected, metodePembayaran: metode })
    setStep(3)
  }

  const kembalian = metode === 'Cash'
    ? Math.max(0, parseInt(jumlahBayar || 0) - (selected?.totalHarga || 0))
    : 0

  const resetAll = () => {
    setQuery(''); setSelected(null); setStep(1); setShowSuccess(null)
  }

  return (
    <div style={{ width: '100%', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>💳 Form Pembayaran</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Proses pembayaran order pelanggan</p>
      </div>

      {/* Steps indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
        {[{n:1,l:'Cari Order'},{n:2,l:'Detail Bayar'},{n:3,l:'Selesai'}].map((s, i) => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem',
              background: step >= s.n ? '#2563eb' : '#e2e8f0',
              color: step >= s.n ? 'white' : '#94a3b8', flexShrink: 0,
            }}>{step > s.n ? '✓' : s.n}</div>
            <div style={{ fontSize: '0.78rem', marginLeft: 8, color: step >= s.n ? '#2563eb' : '#94a3b8', fontWeight: step === s.n ? 700 : 400 }}>
              {s.l}
            </div>
            {i < 2 && <div style={{ flex: 1, height: 2, background: step > s.n ? '#2563eb' : '#e2e8f0', margin: '0 8px' }} />}
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="card">
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>🔍 Cari Order</h3>
          <div className="search-box" style={{ marginBottom: 16 }}>
            <span>🔍</span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Masukkan No. Order (CLK-xxx) atau Nama Pelanggan..." />
          </div>
          {query.trim().length > 1 && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Tidak ada order yang ditemukan</div>
          )}
          {results.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>No. Order</th><th>Nama</th><th>Total</th><th>Status Bayar</th><th>Aksi</th></tr></thead>
                <tbody>
                  {results.map(o => (
                    <tr key={o.id}>
                      <td><span style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.8rem' }}>{o.id}</span></td>
                      <td><div style={{ fontWeight: 600 }}>{o.nama}</div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{o.telepon}</div></td>
                      <td style={{ fontWeight: 600 }}>{formatRp(o.totalHarga)}</td>
                      <td><span className={`badge ${o.statusPembayaran === 'Lunas' ? 'badge-green' : 'badge-red'}`}>{o.statusPembayaran}</span></td>
                      <td>
                        {o.statusPembayaran === 'Belum Bayar'
                          ? <button className="btn btn-primary btn-sm" onClick={() => handleSelect(o)}>💳 Proses</button>
                          : <button className="btn btn-outline btn-sm" onClick={() => { setSelected(o); setStep(2) }}>👁 Lihat</button>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {query.trim().length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#cbd5e1' }}>
              <div style={{ fontSize: '3rem', marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: '0.9rem' }}>Ketik nama atau nomor order untuk mencari</div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && selected && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>💰 Detail Pembayaran</h3>
            <button className="btn btn-outline btn-sm" onClick={() => setStep(1)}>← Kembali</button>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px', marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.88rem' }}>
              <div><span style={{ color: '#64748b' }}>No. Order:</span> <strong>{selected.id}</strong></div>
              <div><span style={{ color: '#64748b' }}>Nama:</span> <strong>{selected.nama}</strong></div>
              <div><span style={{ color: '#64748b' }}>Layanan:</span> <span>{selected.layanan.join(', ')}</span></div>
              <div><span style={{ color: '#64748b' }}>Berat:</span> <span>{selected.berat} kg</span></div>
              <div><span style={{ color: '#64748b' }}>Status:</span> <span className={`badge ${selected.statusPembayaran === 'Lunas' ? 'badge-green' : 'badge-red'}`}>{selected.statusPembayaran}</span></div>
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
              <span>Total Tagihan</span>
              <span style={{ color: '#2563eb' }}>{formatRp(selected.totalHarga)}</span>
            </div>
          </div>

          {selected.statusPembayaran === 'Lunas' ? (
            <div style={{ background: '#dcfce7', borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 700, color: '#16a34a' }}>Sudah Lunas</div>
              <div style={{ fontSize: '0.85rem', color: '#15803d', marginTop: 4 }}>Metode: {selected.metodePembayaran}</div>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Metode Pembayaran</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {['Cash', 'Transfer', 'QRIS'].map(m => (
                    <label key={m} style={{
                      display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                      padding: '10px 16px', borderRadius: 10, flex: '1 1 80px', justifyContent: 'center',
                      border: `2px solid ${metode === m ? '#3b82f6' : '#e2e8f0'}`,
                      background: metode === m ? '#eff6ff' : 'white',
                      transition: 'all 0.15s', fontWeight: 500, fontSize: '0.88rem',
                    }}>
                      <input type="radio" name="metode2" value={m} checked={metode === m} onChange={() => setMetode(m)} style={{ accentColor: '#3b82f6' }} />
                      {m === 'Cash' ? '💵' : m === 'Transfer' ? '🏦' : '📱'} {m}
                    </label>
                  ))}
                </div>
              </div>
              {metode === 'Transfer' && (
                <div style={{ background: '#eff6ff', borderRadius: 10, padding: '14px 16px', marginBottom: 16, fontSize: '0.88rem' }}>
                  <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>🏦 Info Transfer Bank</div>
                  <div>BCA — <strong>1234567890</strong></div>
                  <div>a/n: <strong>AA NUY Laundry</strong></div>
                </div>
              )}
              {metode === 'QRIS' && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ width: 140, height: 140, background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', margin: '0 auto', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <div style={{ fontSize: '2.5rem' }}>📱</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>QRIS</div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 8 }}>Scan untuk membayar</div>
                </div>
              )}
              {metode === 'Cash' && (
                <div className="form-group">
                  <label className="form-label">Jumlah Uang Diterima (Rp)</label>
                  <input type="number" className="form-input" value={jumlahBayar} onChange={e => setJumlahBayar(e.target.value)} placeholder="Masukkan jumlah uang" />
                  {parseInt(jumlahBayar || 0) >= selected.totalHarga && (
                    <div style={{ marginTop: 8, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: '0.88rem' }}>
                      Kembalian: <strong style={{ color: '#16a34a' }}>{formatRp(kembalian)}</strong>
                    </div>
                  )}
                </div>
              )}
              <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={handleConfirm}>
                ✅ Konfirmasi Pembayaran
              </button>
            </>
          )}
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && showSuccess && (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
          <h2 style={{ margin: '0 0 8px', color: '#16a34a' }}>Pembayaran Berhasil!</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Order telah ditandai sebagai Lunas</p>
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, textAlign: 'left', marginBottom: 24 }}>
            {[['No. Order', showSuccess.id], ['Nama', showSuccess.nama], ['Layanan', showSuccess.layanan.join(', ')], ['Total', formatRp(showSuccess.totalHarga)], ['Metode', showSuccess.metodePembayaran]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                <span style={{ color: '#64748b' }}>{k}</span><strong>{v}</strong>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => window.print()}>🖨️ Cetak Struk</button>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={resetAll}>🔍 Cari Order Lain</button>
          </div>
        </div>
      )}
    </div>
  )
}