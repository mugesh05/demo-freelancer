import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Edit2, ExternalLink, MapPin, Star, Upload } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

function ProfileCompletion({ pct }) {
  const color = pct >= 80 ? 'var(--sk-success)' : pct >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
        <span style={{ color: 'var(--sk-muted)' }}>Profile completion</span>
        <strong style={{ color }}>{pct}%</strong>
      </div>
      <div style={{ height: 6, background: 'var(--sk-border)', borderRadius: 999 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

export default function MyProfile() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [dash, setDash] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: '', title: '', tagline: '', bio: '', location: '',
    hourly_rate: 45, experience_level: 'intermediate', availability: 'available',
    education: '', skillsText: '',
  })
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [portfolioForm, setPortfolioForm] = useState({ title: '', category: '', image: '' })
  const [addingPortfolio, setAddingPortfolio] = useState(false)

  const load = useCallback(() => {
    api('/api/dashboard').then(setDash).catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return }
    load()
    setForm({
      name: user.name || '',
      title: user.title || '',
      tagline: user.tagline || '',
      bio: user.bio || '',
      location: user.location || '',
      hourly_rate: user.hourly_rate || 45,
      experience_level: user.experience_level || 'intermediate',
      availability: user.availability || 'available',
      education: user.education || '',
      skillsText: (user.skills || []).join(', '),
    })
  }, [user, navigate, load])

  const saveProfile = async (e) => {
    e.preventDefault()
    setMsg({ type: '', text: '' })
    try {
      const skills = form.skillsText.split(',').map((s) => s.trim()).filter(Boolean)
      const res = await api('/api/profile', {
        method: 'PUT',
        body: { ...form, hourly_rate: Number(form.hourly_rate), skills },
      })
      setUser(res.user)
      setEditing(false)
      setMsg({ type: 'success', text: 'Profile updated successfully.' })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      const res = await api('/api/profile/avatar', { method: 'POST', body: fd })
      setUser(res.user)
      setMsg({ type: 'success', text: 'Profile picture updated.' })
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  const addPortfolioItem = async (e) => {
    e.preventDefault()
    const portfolio = [...(user.portfolio || []), { ...portfolioForm }]
    try {
      const res = await api('/api/profile', { method: 'PUT', body: { portfolio } })
      setUser(res.user)
      setPortfolioForm({ title: '', category: '', image: '' })
      setAddingPortfolio(false)
      setMsg({ type: 'success', text: 'Portfolio item added.' })
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  const removePortfolioItem = async (idx) => {
    const portfolio = (user.portfolio || []).filter((_, i) => i !== idx)
    try {
      const res = await api('/api/profile', { method: 'PUT', body: { portfolio } })
      setUser(res.user)
      setMsg({ type: 'success', text: 'Portfolio item removed.' })
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  if (!user) return null

  const s = dash?.stats || {}
  const profileCompletion = s.profileCompletion ?? 60

  return (
    <div className="page">
      <Header />
      <main className="sk-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
          <div>
            <span className="sk-badge blue" style={{ marginBottom: 6 }}>MY PROFILE</span>
            <h1 style={{ margin: 0, fontSize: 28 }}>Public Profile</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {user.role === 'freelancer' && (
              <Link to={`/freelancers/${user.id}`} className="sk-btn sk-btn-outline" target="_blank">
                <ExternalLink size={15} /> View Public Profile
              </Link>
            )}
            <Link to={user.role === 'client' ? '/client-dashboard' : '/dashboard'} className="sk-btn sk-btn-outline">
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {msg.text && <div className={`sk-alert ${msg.type}`}>{msg.text}</div>}

        <div className="sk-grid-2" style={{ alignItems: 'start', gap: 24 }}>
          {/* Left column: avatar + summary stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <section className="sk-card">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <span className="sk-avatar" style={{ width: 88, height: 88, background: user.tint, fontSize: 28 }}>
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : user.initials}
                  </span>
                </div>
                <label className="sk-btn sk-btn-outline sk-btn-sm" style={{ cursor: 'pointer' }}>
                  <Upload size={14} /> Change Photo
                  <input type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
                </label>
                <div>
                  <strong style={{ display: 'block', fontSize: 18 }}>{user.name}</strong>
                  <span style={{ display: 'block', fontSize: 14, color: 'var(--sk-muted)' }}>{user.title || 'Add a headline'}</span>
                  {user.location && (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 13, color: 'var(--sk-muted)', marginTop: 4 }}>
                      <MapPin size={13} /> {user.location}
                    </span>
                  )}
                </div>
                <span className={`sk-badge ${user.availability === 'available' ? 'green' : user.availability === 'busy' ? 'amber' : 'gray'}`} style={{ textTransform: 'capitalize' }}>
                  {user.availability || 'available'}
                </span>
              </div>

              {user.role === 'freelancer' && (
                <div style={{ marginTop: 20, borderTop: '1px solid var(--sk-border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--sk-muted)' }}>Hourly Rate</span>
                    <strong>${user.hourly_rate}/hr</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--sk-muted)' }}>Experience</span>
                    <strong style={{ textTransform: 'capitalize' }}>{user.experience_level}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--sk-muted)' }}>Rating</span>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={13} style={{ fill: '#f59e0b', stroke: '#f59e0b' }} /> {Number(user.rating || 5).toFixed(1)} ({user.review_count || 0})
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--sk-muted)' }}>Active Gigs</span>
                    <strong>{s.activeGigs ?? 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--sk-muted)' }}>Completed Orders</span>
                    <strong>{s.completedOrders ?? 0}</strong>
                  </div>
                </div>
              )}

              {user.role === 'freelancer' && (
                <div style={{ marginTop: 16 }}>
                  <ProfileCompletion pct={profileCompletion} />
                </div>
              )}
            </section>

            {/* Languages */}
            {(user.languages || []).length > 0 && (
              <section className="sk-card">
                <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Languages</h3>
                {(user.languages || []).map((l, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderBottom: '1px solid var(--sk-border)' }}>
                    <span>{l.language}</span>
                    <span style={{ color: 'var(--sk-muted)' }}>{l.level}</span>
                  </div>
                ))}
              </section>
            )}
          </div>

          {/* Right column: edit form + details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Profile Info */}
            <section className="sk-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>Profile Information</h2>
                <button type="button" className="sk-btn sk-btn-outline sk-btn-sm" onClick={() => setEditing((v) => !v)}>
                  <Edit2 size={14} /> {editing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {!editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sk-muted)', marginBottom: 4 }}>Headline</span>
                    <span style={{ fontSize: 15 }}>{user.tagline || <em style={{ color: 'var(--sk-muted)' }}>No tagline set</em>}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sk-muted)', marginBottom: 4 }}>Bio</span>
                    <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--sk-ink-2)' }}>
                      {user.bio || <em style={{ color: 'var(--sk-muted)' }}>Add a professional bio to stand out.</em>}
                    </p>
                  </div>
                  {user.education && (
                    <div>
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sk-muted)', marginBottom: 4 }}>Education</span>
                      <span style={{ fontSize: 14 }}>{user.education}</span>
                    </div>
                  )}
                  {(user.skills || []).length > 0 && (
                    <div>
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sk-muted)', marginBottom: 8 }}>Skills</span>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {user.skills.map((sk) => <span key={sk} className="sk-badge blue">{sk}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={saveProfile}>
                  <div className="sk-grid-2">
                    <div className="sk-field">
                      <label>Full Name</label>
                      <input className="sk-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="sk-field">
                      <label>Title / Headline</label>
                      <input className="sk-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior React Developer" />
                    </div>
                    <div className="sk-field">
                      <label>Location</label>
                      <input className="sk-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. United States" />
                    </div>
                    {user.role === 'freelancer' && (
                      <>
                        <div className="sk-field">
                          <label>Hourly Rate ($)</label>
                          <input className="sk-input" type="number" min="5" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} />
                        </div>
                        <div className="sk-field">
                          <label>Availability</label>
                          <select className="sk-select" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })}>
                            <option value="available">Available</option>
                            <option value="busy">Busy</option>
                            <option value="unavailable">Unavailable</option>
                          </select>
                        </div>
                        <div className="sk-field">
                          <label>Experience Level</label>
                          <select className="sk-select" value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value })}>
                            <option value="entry">Entry</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="expert">Expert</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="sk-field">
                    <label>Tagline / One-liner</label>
                    <input className="sk-input" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="e.g. Building fast, beautiful interfaces for ambitious teams." />
                  </div>
                  {user.role === 'freelancer' && (
                    <>
                      <div className="sk-field">
                        <label>Skills (comma separated)</label>
                        <input className="sk-input" value={form.skillsText} onChange={(e) => setForm({ ...form, skillsText: e.target.value })} placeholder="React, Node.js, Figma" />
                      </div>
                      <div className="sk-field">
                        <label>Education</label>
                        <input className="sk-input" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} placeholder="B.Sc. Computer Science, MIT" />
                      </div>
                    </>
                  )}
                  <div className="sk-field">
                    <label>Professional Bio</label>
                    <textarea className="sk-textarea" rows={5} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell clients about your background, expertise, and what makes you a great collaborator..." />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="sk-btn sk-btn-primary">Save Changes</button>
                    <button type="button" className="sk-btn sk-btn-outline" onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </section>

            {/* Portfolio (freelancers only) */}
            {user.role === 'freelancer' && (
              <section className="sk-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ margin: 0, fontSize: 20 }}>Portfolio</h2>
                  <button type="button" className="sk-btn sk-btn-outline sk-btn-sm" onClick={() => setAddingPortfolio((v) => !v)}>
                    {addingPortfolio ? 'Cancel' : '+ Add Item'}
                  </button>
                </div>

                {addingPortfolio && (
                  <form onSubmit={addPortfolioItem} style={{ padding: 16, background: 'var(--sk-bg)', borderRadius: 10, marginBottom: 16 }}>
                    <div className="sk-grid-2">
                      <div className="sk-field">
                        <label>Project Title</label>
                        <input className="sk-input" value={portfolioForm.title} onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })} placeholder="e.g. SaaS Dashboard UI" required />
                      </div>
                      <div className="sk-field">
                        <label>Category</label>
                        <input className="sk-input" value={portfolioForm.category} onChange={(e) => setPortfolioForm({ ...portfolioForm, category: e.target.value })} placeholder="e.g. UI/UX Design" required />
                      </div>
                    </div>
                    <div className="sk-field">
                      <label>Image URL</label>
                      <input className="sk-input" type="url" value={portfolioForm.image} onChange={(e) => setPortfolioForm({ ...portfolioForm, image: e.target.value })} placeholder="https://..." />
                    </div>
                    <button type="submit" className="sk-btn sk-btn-primary sk-btn-sm">Add Portfolio Item</button>
                  </form>
                )}

                {(user.portfolio || []).length === 0 ? (
                  <p style={{ color: 'var(--sk-muted)', margin: 0 }}>No portfolio items yet. Add your best work to impress clients.</p>
                ) : (
                  <div className="sk-grid-2">
                    {(user.portfolio || []).map((item, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--sk-border)' }}>
                        {item.image && <img src={item.image} alt={item.title} style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />}
                        <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ display: 'block', fontSize: 14 }}>{item.title}</strong>
                            <span style={{ fontSize: 12, color: 'var(--sk-muted)' }}>{item.category}</span>
                          </div>
                          <button type="button" className="sk-btn sk-btn-danger sk-btn-sm" onClick={() => removePortfolioItem(idx)} aria-label="Remove portfolio item">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Experience (freelancers) */}
            {user.role === 'freelancer' && (user.experience || []).length > 0 && (
              <section className="sk-card">
                <h2 style={{ margin: '0 0 14px', fontSize: 20 }}>Work Experience</h2>
                {(user.experience || []).map((exp, i) => (
                  <div key={i} style={{ padding: '10px 0', borderTop: i > 0 ? '1px solid var(--sk-border)' : 'none' }}>
                    <strong style={{ display: 'block', fontSize: 15 }}>{exp.role}</strong>
                    <span style={{ fontSize: 14, color: 'var(--sk-muted)' }}>{exp.company} · {exp.period}</span>
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
