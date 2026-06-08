// src/context/AppContext.jsx

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  subscribeOrders,
  createOrder,
  updateOrderStatus as fbUpdateStatus,
  updatePaymentStatus as fbUpdatePayment,
  deleteOrder as fbDelete,
} from '../firebase/ordersService'

const AppContext = createContext(null)

export const STATUS_FLOW = ['Diterima', 'Dijemput', 'Dicuci', 'Disetrika', 'Siap Antar', 'Selesai']

export const LAYANAN_HARGA = {
  'Cuci & Setrika':  { harga: 10000, satuan: '/kg' },
  'Cuci Lipat':      { harga: 6000, satuan: '/kg' },
  'Setrika Saja':    { harga: 6000,  satuan: '/kg' },
  'Cuci Express':    { harga: 15000, satuan: '/kg' },
  'Laundry Sepatu':  { harga: 25000, satuan: '/pasang' },
}

export function AppProvider({ children, currentUser }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ─── Subscribe real-time ke Firestore ───────────────────────
  useEffect(() => {
    const unsubscribe = subscribeOrders((data) => {
      setOrders(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // ─── Tambah pesanan baru ─────────────────────────────────────
  // Menyimpan uid & telepon user agar bisa difilter di myOrders
  const addOrder = useCallback(async (order) => {
    try {
      const newOrder = await createOrder({
        ...order,
        userUid:   currentUser?.uid      || '',
        userPhone: currentUser?.telepon  || '',
      })
      return newOrder.id
    } catch (err) {
      setError('Gagal menambah pesanan: ' + err.message)
      throw err
    }
  }, [currentUser])

  // ─── Update status cucian ────────────────────────────────────
  const updateOrderStatus = useCallback(async (id, status) => {
    try {
      const order = orders.find(o => o.id === id)
      if (!order?.docId) throw new Error('Pesanan tidak ditemukan')
      await fbUpdateStatus(order.docId, status)
    } catch (err) {
      setError('Gagal update status: ' + err.message)
      throw err
    }
  }, [orders])

  // ─── Update pembayaran ───────────────────────────────────────
  const updatePaymentStatus = useCallback(async (id, statusPembayaran, metodePembayaran) => {
    try {
      const order = orders.find(o => o.id === id)
      if (!order?.docId) throw new Error('Pesanan tidak ditemukan')
      await fbUpdatePayment(order.docId, statusPembayaran, metodePembayaran)
    } catch (err) {
      setError('Gagal update pembayaran: ' + err.message)
      throw err
    }
  }, [orders])

  // ─── Hapus pesanan ───────────────────────────────────────────
  const deleteOrder = useCallback(async (id) => {
    try {
      const order = orders.find(o => o.id === id)
      if (!order?.docId) throw new Error('Pesanan tidak ditemukan')
      await fbDelete(order.docId)
    } catch (err) {
      setError('Gagal hapus pesanan: ' + err.message)
      throw err
    }
  }, [orders])

  // ─── Cari pesanan by ID ──────────────────────────────────────
  const getOrderById = useCallback((id) => {
    return orders.find(o => o.id === id) || null
  }, [orders])

  // ─── Filter orders milik user yang sedang login ──────────────
  // Admin  → myOrders = semua orders
  // User   → myOrders = hanya order yang punya uid atau telepon yang cocok
  const myOrders = currentUser?.role === 'admin'
    ? orders
    : orders.filter(o =>
        (currentUser?.uid      && o.userUid   === currentUser.uid)      ||
        (currentUser?.telepon  && o.userPhone === currentUser.telepon)   ||
        (currentUser?.telepon  && o.telepon   === currentUser.telepon)
      )

  return (
    <AppContext.Provider value={{
      orders,       // semua orders — dipakai halaman admin
      myOrders,     // orders milik user ini — dipakai halaman pelanggan
      loading,
      error,
      addOrder,
      updateOrderStatus,
      updatePaymentStatus,
      deleteOrder,
      getOrderById,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}