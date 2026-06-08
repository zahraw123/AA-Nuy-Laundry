import { useState } from 'react'
import { useApp, LAYANAN_HARGA } from '../context/AppContext'
import qrisImage from '../assets/qrisdana.jpg'

const LAYANAN_LIST = Object.keys(LAYANAN_HARGA)

const today    = () => new Date().toISOString().split('T')[0]
const addDays  = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0] }
const formatRp = (n) => `Rp ${n.toLocaleString('id-ID')}`

const EMPTY_FORM = {
  nama: '', telepon: '', alamat: '',
  layanan: [], berat: 1,
  tanggalMasuk: today(),
  tanggalSelesai: addDays(today(), 2),
  metodePembayaran: 'Cash',
  catatan: '',
}

const INFO_BANK = {
  Transfer: { bank: 'BCA', noRek: '1234567890', atasNama: 'AA NUY Laundry' },
}

const sHead = {
  fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8',
  marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
}

export default function FormPemesanan() {
  const { addOrder } = useApp()
  const [form, setForm]       = useState(EMPTY_FORM)
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [copied, setCopied]   = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleLayanan = (l) =>
    set('layanan', form.layanan.includes(l)
      ? form.layanan.filter(x => x !== l)
      : [...form.layanan, l]
    )

  const hitungTotal = () =>
    form.layanan.reduce((sum, l) => {
      if (l === 'Laundry Sepatu') return sum + LAYANAN_HARGA[l].harga
      return sum + LAYANAN_HARGA[l].harga * form.berat
    }, 0)

  const validate = () => {
    const e = {}
    if (!form.nama.trim())    e.nama    = 'Nama wajib diisi'
    if (!form.telepon.trim()) e.telepon = 'No. telepon wajib diisi'
    if (!form.alamat.trim())  e.alamat  = 'Alamat wajib diisi'
    if (form.layanan.length === 0)     e.layanan = 'Pilih minimal 1 layanan'
    if (!form.berat || form.berat < 1) e.berat   = 'Berat minimal 1 kg'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const total = hitungTotal()
      const id = await addOrder({
        ...form,
        totalHarga:       total,
        status:           'Diterima',
        statusPembayaran: form.metodePembayaran === 'Cash' ? 'Belum Bayar' : 'Lunas',
      })
      setReceipt({ ...form, id, totalHarga: total })
      setForm(EMPTY_FORM)
    } catch {
      setErrors({ submit: 'Gagal menyimpan order. Coba lagi.' })
    }
    setLoading(false)
  }

  const handlePrint = () => {
    const style = document.createElement('style')
    style.id = '__ps'
    style.innerHTML = `
      @media print {
        body > * { visibility: hidden !important; }
        #print-area { visibility: visible !important; position: fixed !important; inset: 0; padding: 28px; background: white; }
        #print-area * { visibility: visible !important; }
        #print-area .no-print { display: none !important; }
      }
    `
    document.head.appendChild(style)
    window.print()
    setTimeout(() => document.getElementById('__ps')?.remove(), 1500)
  }

  const handleWhatsApp = () => {
    const r = receipt
    const lines = [
      `🧺 *Rincian Pesanan - AA NUY Laundry*`, ``,
      `📋 No. Order: *${r.id}*`,
      `👤 Nama: ${r.nama}`, `📞 Telepon: ${r.telepon}`, `📍 Alamat: ${r.alamat}`, ``,
      `🛎️ *Layanan:*`,
      ...r.layanan.map(l => {
        const sub = l === 'Laundry Sepatu' ? LAYANAN_HARGA[l].harga : LAYANAN_HARGA[l].harga * r.berat
        return `  • ${l}${l !== 'Laundry Sepatu' ? ` (${r.berat}kg)` : ''}: ${formatRp(sub)}`
      }),
      ``, `💰 *Total: ${formatRp(r.totalHarga)}*`,
      `📅 Masuk: ${r.tanggalMasuk}  |  Selesai: ${r.tanggalSelesai}`, ``,
    ]
    if (r.metodePembayaran === 'Transfer') {
      lines.push(`🏦 *Pembayaran via Transfer Bank*`, `Bank : ${INFO_BANK.Transfer.bank}`, `No.Rek : *${INFO_BANK.Transfer.noRek}*`, `a/n : ${INFO_BANK.Transfer.atasNama}`, `Nominal tepat : *${formatRp(r.totalHarga)}*`, ``, `_Mohon konfirmasi setelah transfer ya 🙏_`)
    } else if (r.metodePembayaran === 'QRIS') {
      lines.push(`📱 *Pembayaran via QRIS*`, `Scan QR code yang dikirim admin, nominal: *${formatRp(r.totalHarga)}*`)
    } else {
      lines.push(`💵 *Pembayaran Cash*`, `Bayar ${formatRp(r.totalHarga)} saat laundry selesai/diantar`)
    }
    if (r.catatan) lines.push(``, `📝 Catatan: ${r.catatan}`)
    lines.push(``, `Terima kasih telah mempercayakan cucian ke kami! 🙏`)
    const phone = r.telepon.replace(/^0/, '62').replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank')
  }

  const handleCopyRek = () => {
    navigator.clipboard.writeText(INFO_BANK.Transfer.noRek)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const total = hitungTotal()

  // ── Halaman Rincian ────────────────────────────────────────────────────────
  if (receipt) {
    const isTransfer = receipt.metodePembayaran === 'Transfer'
    const isQRIS     = receipt.metodePembayaran === 'QRIS'
    const isCash     = receipt.metodePembayaran === 'Cash'

    return (
      <div style={{ width: '100%', maxWidth: 700, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>📋 Rincian Pesanan</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Tunjukkan atau kirim ke pelanggan</p>
        </div>

        <div id="print-area" className="card" style={{ marginBottom: 16 }}>
          <div style={{
            background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
            borderRadius: 12, padding: '18px 20px', marginBottom: 20,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>No. Pesanan</div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '1.3rem', letterSpacing: 1 }}>{receipt.id}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Status</div>
              <div style={{ background: '#22c55e', color: 'white', borderRadius: 20, padding: '3px 12px', fontSize: '0.82rem', fontWeight: 700, marginTop: 2 }}>
                ✅ Diterima
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={sHead}>Data Pelanggan</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['Nama', receipt.nama], ['Telepon', receipt.telepon], ['Tgl. Masuk', receipt.tanggalMasuk], ['Est. Selesai', receipt.tanggalSelesai], ['Alamat', receipt.alamat]].map(([k, v]) => (
                <div key={k} style={{ gridColumn: k === 'Alamat' ? '1/-1' : '' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{k}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, marginBottom: 16 }}>
            <div style={sHead}>Rincian Layanan</div>
            {receipt.layanan.map(l => {
              const sub = l === 'Laundry Sepatu' ? LAYANAN_HARGA[l].harga : LAYANAN_HARGA[l].harga * receipt.berat
              return (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#374151', marginBottom: 6 }}>
                  <span>{l}{l !== 'Laundry Sepatu' && <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}> ({receipt.berat} kg × {formatRp(LAYANAN_HARGA[l].harga)})</span>}</span>
                  <span style={{ fontWeight: 600 }}>{formatRp(sub)}</span>
                </div>
              )
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', color: '#1e3a8a', borderTop: '1px solid #e2e8f0', paddingTop: 10, marginTop: 6 }}>
              <span>Total</span><span>{formatRp(receipt.totalHarga)}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
            <div style={sHead}>Pembayaran</div>
            {isCash && (
              <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 4 }}>💵 Pembayaran Cash</div>
                <div style={{ fontSize: '0.88rem', color: '#78350f' }}>Bayar <strong>{formatRp(receipt.totalHarga)}</strong> saat laundry selesai atau saat diantar.</div>
              </div>
            )}
            {isTransfer && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '16px' }}>
                <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 12 }}>🏦 Transfer Bank</div>
                <div style={{ background: 'white', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div><div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Bank</div><div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{INFO_BANK.Transfer.bank}</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No. Rekening</div><div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1e3a8a', letterSpacing: 2 }}>{INFO_BANK.Transfer.noRek}</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Atas Nama</div><div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>{INFO_BANK.Transfer.atasNama}</div></div>
                  </div>
                </div>
                <button className="no-print" onClick={handleCopyRek} style={{ width: '100%', padding: '9px', borderRadius: 8, cursor: 'pointer', marginBottom: 10, border: '1.5px solid #bfdbfe', background: copied ? '#dcfce7' : 'white', color: copied ? '#15803d' : '#2563eb', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}>
                  {copied ? '✅ Nomor Disalin!' : '📋 Salin Nomor Rekening'}
                </button>
                <div style={{ padding: '10px 12px', background: '#dbeafe', borderRadius: 8, fontSize: '0.82rem', color: '#1e40af' }}>
                  ⚠️ Transfer tepat <strong>{formatRp(receipt.totalHarga)}</strong> lalu konfirmasi ke admin
                </div>
              </div>
            )}
            {isQRIS && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '20px' }}>
                <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 14, fontSize: '0.95rem' }}>📱 Pembayaran via QRIS</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ background: 'white', borderRadius: 16, padding: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', border: '2px solid #bbf7d0', display: 'inline-block' }}>
                    <img src={qrisImage} alt="QR Code QRIS" style={{ width: 200, height: 200, display: 'block', borderRadius: 8, objectFit: 'contain' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.82rem', color: '#166534', marginBottom: 4 }}>Scan QR di atas menggunakan aplikasi e-wallet / m-banking</div>
                    <div style={{ background: '#dcfce7', borderRadius: 8, padding: '8px 20px', display: 'inline-block' }}>
                      <span style={{ fontSize: '0.78rem', color: '#15803d' }}>Total Pembayaran</span>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#166534' }}>{formatRp(receipt.totalHarga)}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#4ade80', background: '#166534', borderRadius: 6, padding: '5px 12px', fontWeight: 600 }}>✅ Berlaku untuk semua bank & e-wallet</div>
                </div>
              </div>
            )}
          </div>

          {receipt.catatan && (
            <div style={{ marginTop: 14, background: '#f8fafc', borderRadius: 8, padding: '10px 12px', fontSize: '0.85rem', color: '#64748b' }}>
              📝 <strong>Catatan:</strong> {receipt.catatan}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <button onClick={handlePrint} className="btn btn-outline" style={{ justifyContent: 'center' }}>🖨️ Cetak / Simpan PDF</button>
          <button onClick={handleWhatsApp} className="btn btn-outline" style={{ justifyContent: 'center', borderColor: '#22c55e', color: '#16a34a' }}>💬 Kirim via WhatsApp</button>
        </div>
        <button onClick={() => setReceipt(null)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>➕ Buat Order Baru</button>
      </div>
    )
  }

  // ── Halaman Form ───────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>📝 Form Pemesanan</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Tambah order laundry baru</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Nama Lengkap *</label>
              <input className="form-input" placeholder="Masukkan nama lengkap" value={form.nama} onChange={e => set('nama', e.target.value)} />
              {errors.nama && <p className="form-error">{errors.nama}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">No. Telepon / WhatsApp *</label>
              <input className="form-input" placeholder="08xxxxxxxxxx" value={form.telepon} onChange={e => set('telepon', e.target.value)} />
              {errors.telepon && <p className="form-error">{errors.telepon}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Tanggal Masuk *</label>
              <input type="date" className="form-input" value={form.tanggalMasuk} onChange={e => set('tanggalMasuk', e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Alamat Lengkap *</label>
              <textarea className="form-input" rows={2} placeholder="Masukkan alamat lengkap" value={form.alamat} onChange={e => set('alamat', e.target.value)} style={{ resize: 'vertical' }} />
              {errors.alamat && <p className="form-error">{errors.alamat}</p>}
            </div>

            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Jenis Layanan * (pilih satu atau lebih)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {LAYANAN_LIST.map(l => (
                  <label key={l} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    border: `2px solid ${form.layanan.includes(l) ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                    background: form.layanan.includes(l) ? '#eff6ff' : 'white',
                  }}>
                    <input type="checkbox" checked={form.layanan.includes(l)} onChange={() => toggleLayanan(l)} style={{ accentColor: '#3b82f6' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.87rem' }}>{l}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Rp {LAYANAN_HARGA[l].harga.toLocaleString('id-ID')}{LAYANAN_HARGA[l].satuan}</div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.layanan && <p className="form-error">{errors.layanan}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Estimasi Berat (kg) *</label>
              <input type="number" className="form-input" min="1" step="0.5" value={form.berat} onChange={e => set('berat', parseFloat(e.target.value))} />
              {errors.berat && <p className="form-error">{errors.berat}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Estimasi Tanggal Selesai</label>
              <input type="date" className="form-input" min={form.tanggalMasuk} value={form.tanggalSelesai} onChange={e => set('tanggalSelesai', e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Metode Pembayaran</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['Cash', 'Transfer', 'QRIS'].map(m => (
                  <label key={m} style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    padding: '10px 18px', borderRadius: 10,
                    border: `2px solid ${form.metodePembayaran === m ? '#3b82f6' : '#e2e8f0'}`,
                    background: form.metodePembayaran === m ? '#eff6ff' : 'white',
                    transition: 'all 0.15s', fontWeight: 500,
                  }}>
                    <input type="radio" name="metode" value={m} checked={form.metodePembayaran === m} onChange={() => set('metodePembayaran', m)} />
                    {m === 'Cash' ? '💵' : m === 'Transfer' ? '🏦' : '📱'} {m}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Catatan Tambahan</label>
              <textarea className="form-input" rows={2} placeholder="Misal: pisahkan baju putih, jangan pakai pewangi..." value={form.catatan} onChange={e => set('catatan', e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          </div>

          {form.layanan.length > 0 && (
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>💰 Estimasi Biaya</div>
              {form.layanan.map(l => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#374151', marginBottom: 4 }}>
                  <span>{l}{l !== 'Laundry Sepatu' ? ` (${form.berat} kg × Rp ${LAYANAN_HARGA[l].harga.toLocaleString('id-ID')})` : ''}</span>
                  <span>Rp {(l === 'Laundry Sepatu' ? LAYANAN_HARGA[l].harga : LAYANAN_HARGA[l].harga * form.berat).toLocaleString('id-ID')}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #bae6fd', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', color: '#0369a1' }}>
                <span>Total</span><span>Rp {total.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          {errors.submit && <p className="form-error" style={{ marginBottom: 12 }}>{errors.submit}</p>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
              {loading ? '⏳ Menyimpan...' : '✅ Simpan Order'}
            </button>
            <button type="button" className="btn btn-outline" disabled={loading} onClick={() => { setForm(EMPTY_FORM); setErrors({}) }}>
              🔄 Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}