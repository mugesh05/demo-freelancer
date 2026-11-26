import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await login(email, password)
      const dest = location.state?.from || (user.role === 'client' ? '/client-dashboard' : '/dashboard')
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to log in. Please check your credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail)
    setPassword('Skillrora123!')
    setError('')
  }

  return (
    <div className="page">
      <Header />
      <main className="sk-container" style={{ maxWidth: 960, paddingTop: 40 }}>
        <div className="sk-grid-2" style={{ alignItems: 'center', gap: 40 }}>
          <div>
            <span className="sk-badge blue" style={{ marginBottom: 14 }}>SKILLRORA MARKETPLACE</span>
            <h1 style={{ fontSize: 36, lineHeight: 1.15, margin: '0 0 14px' }}>Welcome back to your workspace.</h1>
            <p style={{ color: 'var(--sk-muted)', fontSize: 16, lineHeight: 1.6, margin: '0 0 24px' }}>
              Manage your active projects, proposals, messages, and milestones in one place.
            </p>
            <div className="sk-card" style={{ padding: 16, background: 'var(--sk-surface-soft)' }}>
              <strong style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>Quick Demo Accounts (Password: Skillrora123!)</strong>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="sk-btn sk-btn-outline sk-btn-sm" onClick={() => fillDemo('alex@skillrora.com')}>
                  Freelancer (Alex Morgan)
                </button>
                <button type="button" className="sk-btn sk-btn-outline sk-btn-sm" onClick={() => fillDemo('daniel@skillrora.com')}>
                  Client (Daniel Wilson)
                </button>
              </div>
            </div>
          </div>

          <form className="sk-card" onSubmit={handleSubmit}>
            <h2 style={{ margin: '0 0 6px' }}>Log in</h2>
            <p style={{ color: 'var(--sk-muted)', fontSize: 14, margin: '0 0 20px' }}>Enter your Skillrora account credentials.</p>

            {error && <div className="sk-alert error" role="alert">{error}</div>}

            <div className="sk-field">
              <label htmlFor="login-email">Email address</label>
              <input id="login-email" className="sk-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>

            <div className="sk-field">
              <label htmlFor="login-password">Password</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input id="login-password" className="sk-input" type={visible ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
                <button type="button" className="sk-btn sk-btn-outline sk-btn-sm" onClick={() => setVisible((v) => !v)}>{visible ? 'Hide' : 'Show'}</button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, fontSize: 13 }}>
              <Link to="/forgot-password" style={{ color: 'var(--sk-primary)', fontWeight: 600 }}>Forgot password?</Link>
              <Link to="/signup" style={{ color: 'var(--sk-muted)' }}>Need an account? <strong style={{ color: 'var(--sk-primary)' }}>Sign up</strong></Link>
            </div>

            <button className="sk-btn sk-btn-primary" style={{ width: '100%' }} type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Log in'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
