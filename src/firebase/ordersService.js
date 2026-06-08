import { db } from './config'
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, query, orderBy, serverTimestamp, getDocs
} from 'firebase/firestore'

const COL = 'orders'

// Generate ID unik CLK-xxx
async function generateOrderId() {
  const snap = await getDocs(collection(db, COL))
  const num = String(snap.size + 1).padStart(3, '0')
  return `CLK-${num}`
}

// Real-time listener — dipakai AppContext
export function subscribeOrders(callback) {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({
      docId: d.id,      // ID dokumen Firestore (untuk update/delete)
      ...d.data()       // semua field: nama, telepon, status, dll
    }))
    callback(data)
  })
}

// Tambah order baru
export async function createOrder(order) {
  const id = await generateOrderId()
  const docRef = await addDoc(collection(db, COL), {
    ...order,
    id,                              // CLK-001, CLK-002, dst
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { id, docId: docRef.id }
}

// Update status cucian
export async function updateOrderStatus(docId, status) {
  await updateDoc(doc(db, COL, docId), {
    status,
    updatedAt: serverTimestamp()
  })
}

// Update status pembayaran
export async function updatePaymentStatus(docId, statusPembayaran, metodePembayaran) {
  await updateDoc(doc(db, COL, docId), {
    statusPembayaran,
    metodePembayaran,
    updatedAt: serverTimestamp()
  })
}

// Hapus order
export async function deleteOrder(docId) {
  await deleteDoc(doc(db, COL, docId))
}