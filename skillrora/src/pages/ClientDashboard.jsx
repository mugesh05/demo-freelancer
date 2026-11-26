import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bell, Plus, Trash2 } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

const CATS = ['Web Development', 'UI/UX Design', 'Graphic Design', 'Video Editing', 'Digital Marketing', 'AI & Automation']

export default function ClientDashboard() {
  const [params] = useSearchParams()
  const { user } = useAuth()
  const [dash, setDash] = useState(null)
  const [projects, setProjects] = useState([])
  const [showForm, setShowForm] = useState(params.get('post') === '1')
  const [form, setForm] = useState({
    title: '', category: CATS[0], budget_min: '500', budget_max: '1500', deadline: '2026-12-30', experience_level: 'intermediate', skillsText: '', description: '',
  })
  const [msg, setMsg] = useState({ type: '', text: '' })

  const load = useCallback(() => {
    api('/api/dashboard').then(setDash).catch(() => {})
    api('/api/my/projects').then((d) => setProjects(d.items || [])).catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  const createProject = async (e) => {
    e.preventDefault()
    setMsg({ type: '', text: '' })
    try {
      const skills = form.skillsText.split(',').map((s) => s.trim()).filter(Boolean)
      await api('/api/projects', {
        method: 'POST',
        body: { ...form, budget_min: Number(form.budget_min), budget_max: Number(form.budget_max), skills },
      })
      setShowForm(false)
      setForm({ title: '', category: CATS[0], budget_min: '500', budget_max: '1500', deadline: '2026-12-30', experience_level: 'intermediate', skillsText: '', description: '' })
      setMsg({ type: 'success', text: 'Project posted! Freelancers can now submit proposals.' })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  const deleteProject = async (id) => {
    try {
      await api(`/api/projects/${id}`, { method: 'DELETE' })
      setMsg({ type: 'success', text: 'Project deleted.' })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  const s = dash?.stats || {}

  return (
    <div className="page">
      <Header active="dashboard" />
      <main className="sk-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
          <div>
            <span className="sk-badge blue" style={{ marginBottom: 6 }}>CLIENT DASHBOARD</span>
            <h1 style={{ margin: 0, fontSize: 28 }}>Welcome back, {user?.name}</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/talent" className="sk-btn sk-btn-outline">Find Talent</Link>
            <button type="button" className="sk-btn sk-btn-primary" onClick={() => setShowForm((v) => !v)}>
              <Plus size={16} /> {showForm ? 'Close Form' : 'Post a Project'}
            </button>
          </div>
        </div>

        {msg.text && <div className={`sk-alert ${msg.type}`}>{msg.text}</div>}

        <div className="sk-grid-4" style={{ marginBottom: 28 }}>
          <div className="sk-card"><span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>Posted Projects</span><strong style={{ display: 'block', fontSize: 28, marginTop: 6 }}>{s.postedProjects ?? 0}</strong></div>
          <div className="sk-card"><span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>Total Proposals</span><strong style={{ display: 'block', fontSize: 28, marginTop: 6 }}>{s.totalApplications ?? 0}</strong></div>
          <div className="sk-card"><span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>Active Hires</span><strong style={{ display: 'block', fontSize: 28, marginTop: 6 }}>{s.activeHires ?? 0}</strong></div>
          <div className="sk-card">
            <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>Total Spent</span>
            <strong style={{ display: 'block', fontSize: 28, marginTop: 6 }}>${s.totalSpentVerified ?? 0}</strong>
            <span style={{ fontSize: 11, color: 'var(--sk-muted)' }}>Verified payments</span>
          </div>
        </div>

        {showForm && (
          <form className="sk-card" style={{ marginBottom: 28 }} onSubmit={createProject}>
            <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>Post a New Project</h2>
            <div className="sk-grid-2">
              <div className="sk-field"><label>Project Title</label><input className="sk-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Build SaaS Marketing Website in React" required minLength={6} /></div>
              <div className="sk-field">
                <label>Category</label>
                <select className="sk-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="sk-field"><label>Min Budget ($)</label><input className="sk-input" type="number" min="50" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} required /></div>
              <div className="sk-field"><label>Max Budget ($)</label><input className="sk-input" type="number" min="50" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} required /></div>
              <div className="sk-field"><label>Target Deadline</label><input className="sk-input" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required /></div>
              <div className="sk-field">
                <label>Experience Level</label>
                <select className="sk-select" value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value })}>
                  <option value="entry">Entry</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
            <div className="sk-field"><label>Required Skills (comma separated)</label><input className="sk-input" value={form.skillsText} onChange={(e) => setForm({ ...form, skillsText: e.target.value })} placeholder="React, Figma, Node.js" /></div>
            <div className="sk-field"><label>Project Description</label><textarea className="sk-textarea" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required minLength={20} placeholder="Describe deliverables, goals, and timeline..." /></div>
            <button type="submit" className="sk-btn sk-btn-primary">Publish Project</button>
          </form>
        )}

        <div className="sk-grid-2" style={{ alignItems: 'start', marginBottom: 28 }}>
          <section className="sk-card">
            <h2 style={{ margin: '0 0 14px', fontSize: 20 }}>My Posted Projects ({projects.length})</h2>
            {projects.length === 0 ? (
              <p style={{ color: 'var(--sk-muted)', margin: 0 }}>You haven&rsquo;t posted any projects yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {projects.map((p) => (
                  <div key={p.id} style={{ padding: 14, border: '1px solid var(--sk-border)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Link to={`/projects/${p.id}`} style={{ fontWeight: 700, color: 'var(--sk-primary)' }}>{p.title}</Link>
                      <span className={`sk-badge ${p.status === 'open' ? 'green' : p.status === 'in_progress' ? 'amber' : 'gray'}`}>{p.status.replace('_', ' ')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--sk-muted)' }}>
                      <span>${p.budget_min}–${p.budget_max} · {p.application_count} proposals</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link to={`/projects/${p.id}`} className="sk-btn sk-btn-outline sk-btn-sm">Manage</Link>
                        {p.status === 'open' && (
                          <button type="button" className="sk-btn sk-btn-danger sk-btn-sm" aria-label="Delete project" onClick={() => deleteProject(p.id)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="sk-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Recent Messages</h2>
              <Link to="/messages" style={{ fontSize: 13, fontWeight: 700, color: 'var(--sk-primary)' }}>Open inbox →</Link>
            </div>
            {(dash?.recentConversations || []).length === 0 ? (
              <p style={{ color: 'var(--sk-muted)', margin: 0 }}>No conversations yet.</p>
            ) : (
              dash.recentConversations.map((c) => (
                <Link key={c.id} to="/messages" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--sk-border)' }}>
                  <div><strong style={{ display: 'block', fontSize: 14 }}>{c.peer_name}</strong><span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>{c.last_message || 'Start chatting'}</span></div>
                  {c.unread_count > 0 && <span className="sk-badge blue">{c.unread_count} new</span>}
                </Link>
              ))
            )}
          </section>

          <section className="sk-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Recent Notifications</h2>
              <Link to="/notifications" style={{ fontSize: 13, fontWeight: 700, color: 'var(--sk-primary)' }}>See all →</Link>
            </div>
            {(dash?.recentNotifications || []).length === 0 ? (
              <p style={{ color: 'var(--sk-muted)', margin: 0 }}>All caught up!</p>
            ) : (
              dash.recentNotifications.map((n) => (
                <Link key={n.id} to={n.link || '/'} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderTop: '1px solid var(--sk-border)' }}>
                  <Bell size={14} style={{ color: 'var(--sk-primary)', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: 13 }}>{n.title}</strong>
                    <span style={{ fontSize: 12, color: 'var(--sk-muted)' }}>{n.body}</span>
                  </div>
                  {!n.is_read && <span className="sk-badge blue" style={{ marginLeft: 'auto', flexShrink: 0 }}>New</span>}
                </Link>
              ))
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
