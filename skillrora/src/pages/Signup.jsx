import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Signup() {
  const [params] = useSearchParams()
  const initialRole = params.get('role') === 'freelancer' ? 'freelancer' : 'client'
  const [role, setRole] = useState(initialRole)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSubmitting(true)
    try {
      const user = await register({ name, email, password, role, title })
      navigate(user.role === 'client' ? '/client-dashboard' : '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not create account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <Header />
      <main className="sk-container" style={{ maxWidth: 620, paddingTop: 36 }}>
        <form className="sk-card" onSubmit={handleSubmit}>
          <span className="sk-badge blue" style={{ marginBottom: 10 }}>JOIN SKILLRORA</span>
          <h1 style={{ margin: '0 0 6px', fontSize: 28 }}>Create your account</h1>
          <p style={{ color: 'var(--sk-muted)', fontSize: 14, margin: '0 0 22px' }}>Choose how you want to use Skillrora.</p>

          <div className="sk-grid-2" style={{ marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => setRole('client')}
              className="sk-card"
              style={{
                textAlign: 'left',
                padding: 16,
                cursor: 'pointer',
                borderColor: role === 'client' ? 'var(--sk-primary)' : 'var(--sk-border)',
                background: role === 'client' ? 'var(--sk-primary-soft)' : 'var(--sk-surface)',
              }}
            >
              <strong style={{ display: 'block', marginBottom: 4 }}>I&rsquo;m a Client</strong>
              <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>Post projects, hire freelancers, and manage orders.</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('freelancer')}
              className="sk-card"
              style={{
                textAlign: 'left',
                padding: 16,
                cursor: 'pointer',
                borderColor: role === 'freelancer' ? 'var(--sk-primary)' : 'var(--sk-border)',
                background: role === 'freelancer' ? 'var(--sk-primary-soft)' : 'var(--sk-surface)',
              }}
            >
              <strong style={{ display: 'block', marginBottom: 4 }}>I&rsquo;m a Freelancer</strong>
              <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>Offer services, apply to projects, and get paid.</span>
            </button>
          </div>

          {error && <div className="sk-alert error" role="alert">{error}</div>}

          <div className="sk-field">
            <label htmlFor="su-name">Full name</label>
            <input id="su-name" className="sk-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan" required />
          </div>
          <div className="sk-field">
            <label htmlFor="su-email">Email address</label>
            <input id="su-email" className="sk-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="sk-field">
            <label htmlFor="su-title">{role === 'freelancer' ? 'Professional headline' : 'Company or role (optional)'}</label>
            <input id="su-title" className="sk-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={role === 'freelancer' ? 'Full-Stack React Developer' : 'Founder, Acme Studio'} />
          </div>
          <div className="sk-field">
            <label htmlFor="su-pass">Password (min 8 characters)</label>
            <input id="su-pass" className="sk-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" required />
          </div>

          <button className="sk-btn sk-btn-primary" style={{ width: '100%', marginTop: 6 }} type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : `Create ${role === 'client' ? 'Client' : 'Freelancer'} Account`}
          </button>

          <p style={{ textAlign: 'center', margin: '18px 0 0', fontSize: 14, color: 'var(--sk-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--sk-primary)', fontWeight: 700 }}>Log in</Link>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  )
}
