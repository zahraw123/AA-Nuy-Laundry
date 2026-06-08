// src/hooks/useNotifications.js
// Hitung badge notifikasi langsung dari Firestore — tanpa collection tambahan.
//
// Admin  : jumlah pickup_requests + orders dengan status 'Diproses'
// User   : jumlah pickup_requests milik user yang statusnya berubah
//          sejak terakhir kali mereka membuka halaman Status Penjemputan.
//          "Sudah dilihat" disimpan di localStorage agar ringan.

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export function useAdminNotifications() {
  const [counts, setCounts] = useState({
    antarJemput: 0,   // pickup_requests status Diproses
    orders: 0,        // orders status Diproses  (sesuaikan nama collection-mu)
    total: 0,
  })

  useEffect(() => {
    // pickup_requests belum diproses
    const qPickup = query(
      collection(db, 'pickup_requests'),
      where('status', '==', 'Diproses'),
    )
    const unsubPickup = onSnapshot(qPickup, snap => {
      setCounts(prev => {
        const antarJemput = snap.size
        return { ...prev, antarJemput, total: antarJemput + prev.orders }
      })
    })

    // orders biasa belum diproses — ganti 'orders' jika nama collection berbeda
    const qOrders = query(
      collection(db, 'orders'),
      where('status', '==', 'Diproses'),
    )
    const unsubOrders = onSnapshot(qOrders, snap => {
      setCounts(prev => {
        const orders = snap.size
        return { ...prev, orders, total: prev.antarJemput + orders }
      })
    })

    return () => { unsubPickup(); unsubOrders() }
  }, [])

  return counts
}

// ─── USER ─────────────────────────────────────────────────────────────────────

const SEEN_KEY = (uid) => `seen_pickup_statuses_${uid}`

/**
 * Simpan snapshot status terakhir yang sudah dilihat user ke localStorage.
 * Panggil ini saat user membuka halaman Status Penjemputan.
 */
export function markPickupStatusAsSeen(uid, requests) {
  if (!uid || !requests) return
  const snapshot = {}
  requests.forEach(r => { snapshot[r.docId] = r.status })
  localStorage.setItem(SEEN_KEY(uid), JSON.stringify(snapshot))
}

export function useUserNotifications(uid) {
  const [counts, setCounts] = useState({
    statusPenjemputan: 0,
    total: 0,
  })

  useEffect(() => {
    if (!uid) return

    const q = query(
      collection(db, 'pickup_requests'),
      where('userUid', '==', uid),
    )

    const unsub = onSnapshot(q, snap => {
      const requests = snap.docs.map(d => ({ docId: d.id, ...d.data() }))

      // Baca snapshot terakhir yang sudah dilihat
      let seen = {}
      try {
        seen = JSON.parse(localStorage.getItem(SEEN_KEY(uid)) || '{}')
      } catch (_) {}

      // Hitung request yang statusnya berubah sejak terakhir dilihat
      // atau yang sama sekali belum pernah dilihat (baru)
      const unseen = requests.filter(r => {
        if (r.status === 'Dibatalkan' || r.status === 'Selesai') return false // skip terminal
        return seen[r.docId] === undefined || seen[r.docId] !== r.status
      })

      setCounts({ statusPenjemputan: unseen.length, total: unseen.length })
    })

    return () => unsub()
  }, [uid])

  return counts
}