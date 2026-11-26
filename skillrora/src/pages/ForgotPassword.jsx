import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../lib/api.js'

export default function ForgotPassword() {
  const [params] = useSearchParams()
  const urlToken = params.get('token') || ''
  const [email, setEmail] = useState('')
  const [token, setToken] = useState(urlToken)
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState({ type: '', text: '' })
  const [devToken, setDevToken] = useState('')
  const [loading, setLoading] = useState(false)

  const requestReset = async (e) => {
    e.preventDefault()
    setStatus({ type: '', text: '' })
    setLoading(true)
    try {
      const data = await api('/api/auth/forgot-password', { method: 'POST', body: { email } })
      setStatus({ type: 'success', text: data.message })
      if (data.devResetToken) {
        setDevToken(data.devResetToken)
        setToken(data.devResetToken)
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const submitReset = async (e) => {
    e.preventDefault()
    setStatus({ type: '', text: '' })
    setLoading(true)
    try {
      const data = await api('/api/auth/reset-password', { method: 'POST', body: { token, password } })
      setStatus({ type: 'success', text: data.message })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <Header />
      <main className="sk-container" style={{ maxWidth: 520, paddingTop: 40 }}>
        <div className="sk-card">
          <h1 style={{ margin: '0 0 6px', fontSize: 26 }}>{token ? 'Set a new password' : 'Reset your password'}</h1>
          <p style={{ color: 'var(--sk-muted)', fontSize: 14, margin: '0 0 20px' }}>
            {token ? 'Enter your reset token and choose a new password.' : 'Enter your account email and we will generate a password reset token.'}
          </p>

          {status.text && <div className={`sk-alert ${status.type}`}>{status.text}</div>}
          {devToken && (
            <div className="sk-alert info" style={{ wordBreak: 'break-all' }}>
              Development reset token: <code>{devToken}</code>
            </div>
          )}

          {!token ? (
            <form onSubmit={requestReset}>
              <div className="sk-field">
                <label htmlFor="fp-email">Email address</label>
                <input id="fp-email" className="sk-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <button className="sk-btn sk-btn-primary" style={{ width: '100%' }} type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitReset}>
              <div className="sk-field">
                <label htmlFor="rp-token">Reset token</label>
                <input id="rp-token" className="sk-input" value={token} onChange={(e) => setToken(e.target.value)} required />
              </div>
              <div className="sk-field">
                <label htmlFor="rp-pass">New password (min 8 chars)</label>
                <input id="rp-pass" className="sk-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>
              <button className="sk-btn sk-btn-primary" style={{ width: '100%' }} type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Reset password'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', margin: '18px 0 0', fontSize: 14 }}>
            <Link to="/login" style={{ color: 'var(--sk-primary)', fontWeight: 700 }}>Back to Log in</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
