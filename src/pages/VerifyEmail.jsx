import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  sendEmailVerification,
  signOut,
} from 'firebase/auth'

import { auth } from '../firebase/config'

export default function VerifyEmail() {
  const navigate = useNavigate()

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const resendEmail = async () => {
    try {
      setLoading(true)

      if (!auth.currentUser) {
        setMessage(
          'Sesi telah berakhir. Silakan login kembali.'
        )
        return
      }

      await sendEmailVerification(
        auth.currentUser
      )

      setMessage(
        'Email verifikasi berhasil dikirim ulang.'
      )
    } catch (error) {
      console.error(error)

      setMessage(
        'Gagal mengirim ulang email verifikasi.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error(error)
    }

    navigate('/login')
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          Verifikasi Email
        </h2>

        <p style={styles.text}>
          Akun berhasil dibuat.
          <br />
          Silakan buka email Anda dan klik
          link verifikasi yang telah dikirim
          oleh Firebase.
        </p>

        <button
          onClick={resendEmail}
          style={styles.button}
          disabled={loading}
        >
          {loading
            ? 'Mengirim...'
            : 'Kirim Ulang Email'}
        </button>

        <button
          onClick={handleBackToLogin}
          style={styles.secondaryButton}
        >
          Kembali ke Login
        </button>

        {message && (
          <p style={styles.message}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background:
      'linear-gradient(135deg,#0f4c75,#3282b8)',
  },

  card: {
    width: 420,
    background: '#fff',
    padding: 30,
    borderRadius: 20,
    boxShadow:
      '0 10px 30px rgba(0,0,0,0.2)',
    textAlign: 'center',
  },

  title: {
    color: '#0f4c75',
    marginBottom: 15,
  },

  text: {
    color: '#555',
    lineHeight: 1.6,
  },

  button: {
    width: '100%',
    padding: 12,
    marginTop: 20,
    border: 'none',
    borderRadius: 10,
    background: '#0f4c75',
    color: '#fff',
    cursor: 'pointer',
  },

  secondaryButton: {
    width: '100%',
    padding: 12,
    marginTop: 10,
    border: 'none',
    borderRadius: 10,
    background: '#64748b',
    color: '#fff',
    cursor: 'pointer',
  },

  message: {
    marginTop: 15,
    color: '#16a34a',
  },
}