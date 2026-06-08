// src/firebase/authService.js

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth'

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'

import { auth, db } from './config'

const provider = new GoogleAuthProvider()

// ─── Admin Login ────────────────────────────────────────────────────────────
export async function loginAdmin(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const user = credential.user

  // Cek role di Firestore
  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) throw new Error('Data user tidak ditemukan')

  const role = userSnap.data().role
  if (role !== 'admin') {
    await signOut(auth)
    throw Object.assign(new Error('Bukan akun admin'), { code: 'auth/not-admin' })
  }

  return { uid: user.uid, ...userSnap.data() }
}

// ─── User Login (email/password) ─────────────────────────────────────────────
export async function loginUser(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const user = credential.user

  // Wajib verifikasi email
  if (!user.emailVerified) {
    await signOut(auth)
    throw Object.assign(
      new Error('Email belum diverifikasi. Silakan cek inbox Anda.'),
      { code: 'auth/email-not-verified' }
    )
  }

  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) throw new Error('Data user tidak ditemukan')

  return { uid: user.uid, ...userSnap.data() }
}

// ─── Register User ────────────────────────────────────────────────────────────
export async function registerUser(email, password, nama, telepon = '', alamat = '') {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const user = credential.user

  // Simpan data user ke Firestore
  await setDoc(doc(db, 'users', user.uid), {
    email,
    nama,
    telepon,
    alamat,
    role: 'user',
    createdAt: serverTimestamp(),
  })

  // Kirim email verifikasi
  await sendEmailVerification(user)

  // Sign out dulu — user harus verifikasi email sebelum bisa login
  await signOut(auth)

  return user
}

// ─── Google Login ─────────────────────────────────────────────────────────────
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, provider)
  const user = result.user

  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  // Buat dokumen baru jika belum ada (first-time Google login)
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      nama: user.displayName || '',
      telepon: '',
      alamat: '',
      role: 'user',
      createdAt: serverTimestamp(),
    })
  }

  const data = userSnap.exists() ? userSnap.data() : { role: 'user' }

  // Google login tidak boleh masuk sebagai admin lewat sini
  if (data.role === 'admin') {
    await signOut(auth)
    throw Object.assign(
      new Error('Admin harus login dengan email & password.'),
      { code: 'auth/admin-use-email' }
    )
  }

  return {
    uid: user.uid,
    email: user.email,
    nama: user.displayName || '',
    role: data.role || 'user',
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logout() {
  await signOut(auth)
}

// ─── Auth State Listener ──────────────────────────────────────────────────────
// Mengembalikan { firebaseUser, role, userData } atau null
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null)
      return
    }

    try {
      await firebaseUser.reload()

      const providerId = firebaseUser.providerData[0]?.providerId

      // Email/password wajib terverifikasi
      if (providerId === 'password' && !firebaseUser.emailVerified) {
        callback(null)
        return
      }

      const userRef = doc(db, 'users', firebaseUser.uid)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        callback(null)
        return
      }

      callback({
        uid: firebaseUser.uid,
        ...userSnap.data(),
      })
    } catch (err) {
      console.error('onAuthChange error:', err)
      callback(null)
    }
  })
}