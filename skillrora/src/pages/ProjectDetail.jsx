import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [coverLetter, setCoverLetter] = useState('')
  const [budget, setBudget] = useState('')
  const [days, setDays] = useState('7')
  const [feedback, setFeedback] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api(`/api/projects/${id}`)
      .then((d) => {
        setData(d)
        if (d.project && !budget) setBudget(String(d.project.budget_min))
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  const apply = async (e) => {
    e.preventDefault()
    setFeedback({ type: '', text: '' })
    setSubmitting(true)
    try {
      await api(`/api/projects/${id}/apply`, {
        method: 'POST',
        body: { cover_letter: coverLetter, proposed_budget: Number(budget), delivery_days: Number(days) },
      })
      setFeedback({ type: 'success', text: 'Your proposal has been submitted!' })
      load()
    } catch (err) {
      setFeedback({ type: 'error', text: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const updateAppStatus = async (appId, status) => {
    try {
      await api(`/api/applications/${appId}/status`, { method: 'PUT', body: { status } })
      setFeedback({ type: 'success', text: status === 'accepted' ? 'Freelancer hired! An order has been created.' : `Application marked ${status}.` })
      load()
    } catch (err) {
      setFeedback({ type: 'error', text: err.message })
    }
  }

  const updateProgress = async (progress) => {
    try {
      await api(`/api/projects/${id}`, { method: 'PUT', body: { progress: Number(progress) } })
      load()
    } catch (err) {
      setFeedback({ type: 'error', text: err.message })
    }
  }

  if (loading) return <div className="page"><Header active="projects" /><main className="sk-container"><div className="sk-skeleton sk-skeleton-hero" /></main><Footer /></div>
  if (!data?.project) return <div className="page"><Header active="projects" /><main className="sk-container"><div className="sk-empty"><h3>Project not found</h3><Link className="sk-btn sk-btn-primary" to="/projects">Back to projects</Link></div></main><Footer /></div>

  const { project: p, applications, myApplication } = data
  const isOwner = user && user.id === p.client_id

  return (
    <div className="page">
      <Header active="projects" />
      <main className="sk-container" style={{ maxWidth: 960 }}>
        <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--sk-muted)' }}>
          <Link to="/projects">Projects</Link> › <span>{p.category}</span>
        </div>

        <div className="sk-card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <span className="sk-badge blue">{p.category}</span>
            <span className={`sk-badge ${p.status === 'open' ? 'green' : p.status === 'in_progress' ? 'amber' : 'gray'}`}>{p.status.replace('_', ' ')}</span>
          </div>
          <h1 style={{ margin: '0 0 10px', fontSize: 28 }}>{p.title}</h1>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 14, color: 'var(--sk-muted)', marginBottom: 18 }}>
            <span>Budget: <strong style={{ color: 'var(--sk-ink)' }}>${p.budget_min} – ${p.budget_max}</strong></span>
            <span>Deadline: <strong style={{ color: 'var(--sk-ink)' }}>{p.deadline}</strong></span>
            <span>Experience: <strong style={{ color: 'var(--sk-ink)' }}>{p.experience_level}</strong></span>
            <span>Client: <strong style={{ color: 'var(--sk-ink)' }}>{p.client_name}</strong></span>
          </div>
          <p style={{ margin: '0 0 18px', lineHeight: 1.7, color: 'var(--sk-ink-2)' }}>{p.description}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(p.skills || []).map((s) => <span key={s} className="sk-badge gray">{s}</span>)}
          </div>

          {isOwner && p.status === 'in_progress' && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--sk-border)' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Project Progress: {p.progress}%</label>
              <input type="range" min="0" max="100" step="5" value={p.progress} onChange={(e) => updateProgress(e.target.value)} style={{ width: '100%', maxWidth: 340 }} />
            </div>
          )}
        </div>

        {feedback.text && <div className={`sk-alert ${feedback.type}`}>{feedback.text}</div>}

        {/* Owner Client View: Applications */}
        {isOwner && (
          <section className="sk-card">
            <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>Freelancer Proposals ({applications.length})</h2>
            {applications.length === 0 ? (
              <p style={{ color: 'var(--sk-muted)', margin: 0 }}>No proposals received yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {applications.map((a) => (
                  <div key={a.id} className="sk-card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                      <div>
                        <Link to={`/freelancers/${a.freelancer_id}`} style={{ fontWeight: 800, fontSize: 16 }}>{a.freelancer_name}</Link>
                        <span style={{ display: 'block', fontSize: 13, color: 'var(--sk-muted)' }}>{a.freelancer_title} · ★ {Number(a.freelancer_rating).toFixed(1)}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ display: 'block', fontSize: 16 }}>${a.proposed_budget}</strong>
                        <span style={{ fontSize: 12, color: 'var(--sk-muted)' }}>{a.delivery_days} days</span>
                      </div>
                    </div>
                    <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--sk-ink-2)', lineHeight: 1.6 }}>{a.cover_letter}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <span className={`sk-badge ${a.status === 'accepted' ? 'green' : a.status === 'shortlisted' ? 'blue' : a.status === 'rejected' ? 'red' : 'gray'}`}>
                        {a.status}
                      </span>
                      {p.status === 'open' && a.status !== 'accepted' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          {a.status !== 'shortlisted' && (
                            <button type="button" className="sk-btn sk-btn-outline sk-btn-sm" onClick={() => updateAppStatus(a.id, 'shortlisted')}>Shortlist</button>
                          )}
                          <button type="button" className="sk-btn sk-btn-primary sk-btn-sm" onClick={() => updateAppStatus(a.id, 'accepted')}>Hire Freelancer</button>
                          {a.status !== 'rejected' && (
                            <button type="button" className="sk-btn sk-btn-danger sk-btn-sm" onClick={() => updateAppStatus(a.id, 'rejected')}>Reject</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Freelancer View: Apply */}
        {!isOwner && p.status === 'open' && (
          <section className="sk-card">
            <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>Submit a Proposal</h2>
            {!user ? (
              <div>
                <p style={{ color: 'var(--sk-muted)', marginBottom: 14 }}>Log in with a freelancer account to apply for this project.</p>
                <button type="button" className="sk-btn sk-btn-primary" onClick={() => navigate('/login', { state: { from: `/projects/${id}` } })}>Log in to Apply</button>
              </div>
            ) : user.role !== 'freelancer' ? (
              <p style={{ color: 'var(--sk-muted)', margin: 0 }}>Only freelancer accounts can submit project proposals.</p>
            ) : myApplication ? (
              <div className="sk-alert info" style={{ marginBottom: 0 }}>
                You applied for <strong>${myApplication.proposed_budget}</strong> ({myApplication.delivery_days} days). Current status: <strong>{myApplication.status}</strong>.
              </div>
            ) : (
              <form onSubmit={apply}>
                <div className="sk-grid-2">
                  <div className="sk-field">
                    <label htmlFor="prop-budget">Proposed budget ($)</label>
                    <input id="prop-budget" className="sk-input" type="number" min="10" value={budget} onChange={(e) => setBudget(e.target.value)} required />
                  </div>
                  <div className="sk-field">
                    <label htmlFor="prop-days">Delivery timeline (days)</label>
                    <input id="prop-days" className="sk-input" type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} required />
                  </div>
                </div>
                <div className="sk-field">
                  <label htmlFor="prop-cover">Cover letter</label>
                  <textarea id="prop-cover" className="sk-textarea" rows={4} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Explain your relevant experience and approach..." required minLength={20} />
                </div>
                <button type="submit" className="sk-btn sk-btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Proposal'}
                </button>
              </form>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
