import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

export default function FreelancerDashboard() {
  const { user, setUser } = useAuth()
  const [dash, setDash] = useState(null)
  const [apps, setApps] = useState([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    title: user?.title || '',
    tagline: user?.tagline || '',
    bio: user?.bio || '',
    location: user?.location || 'United States',
    hourly_rate: user?.hourly_rate || 45,
    experience_level: user?.experience_level || 'intermediate',
    availability: user?.availability || 'available',
    education: user?.education || '',
    skillsText: (user?.skills || []).join(', '),
  })
  const [msg, setMsg] = useState({ type: '', text: '' })

  const load = useCallback(() => {
    api('/api/dashboard').then(setDash).catch(() => {})
    api('/api/my/applications').then((d) => setApps(d.items || [])).catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

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
            <span className="sk-badge blue" style={{ marginBottom: 6 }}>FREELANCER DASHBOARD</span>
            <h1 style={{ margin: 0, fontSize: 28 }}>Welcome back, {user?.name}</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/my-gigs" className="sk-btn sk-btn-outline">My Gigs</Link>
            <Link to="/create-gig" className="sk-btn sk-btn-primary">+ Create Gig</Link>
          </div>
        </div>

        {msg.text && <div className={`sk-alert ${msg.type}`}>{msg.text}</div>}

        <div className="sk-grid-4" style={{ marginBottom: 28 }}>
          <div className="sk-card"><span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>Total Applications</span><strong style={{ display: 'block', fontSize: 28, marginTop: 6 }}>{s.totalApplications ?? 0}</strong></div>
          <div className="sk-card"><span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>Active Orders</span><strong style={{ display: 'block', fontSize: 28, marginTop: 6 }}>{s.activeOrders ?? 0}</strong></div>
          <div className="sk-card"><span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>Completed Projects</span><strong style={{ display: 'block', fontSize: 28, marginTop: 6 }}>{s.completedOrders ?? 0}</strong></div>
          <div className="sk-card"><span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>Verified Earnings</span><strong style={{ display: 'block', fontSize: 28, marginTop: 6 }}>${s.verifiedEarnings ?? 0}</strong></div>
        </div>

        <div className="sk-grid-2" style={{ alignItems: 'start', marginBottom: 28 }}>
          {/* Profile Card */}
          <section className="sk-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20 }}>Freelancer Profile</h2>
                <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>Profile completion: <strong>{s.profileCompletion ?? 60}%</strong></span>
              </div>
              <button type="button" className="sk-btn sk-btn-outline sk-btn-sm" onClick={() => setEditing((v) => !v)}>
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {!editing ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <span className="sk-avatar" style={{ width: 64, height: 64, background: user?.tint, fontSize: 20 }}>
                    {user?.avatar_url ? <img src={user.avatar_url} alt={user.name} /> : user?.initials}
                  </span>
                  <div>
                    <strong style={{ display: 'block', fontSize: 17 }}>{user?.name}</strong>
                    <span style={{ display: 'block', fontSize: 14, color: 'var(--sk-muted)' }}>{user?.title} · ${user?.hourly_rate}/hr</span>
                    <span className={`sk-badge ${user?.availability === 'available' ? 'green' : 'amber'}`} style={{ marginTop: 6 }}>{user?.availability}</span>
                  </div>
                </div>
                <label className="sk-btn sk-btn-outline sk-btn-sm" style={{ marginBottom: 14, cursor: 'pointer' }}>
                  <Upload size={14} /> Upload Photo
                  <input type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
                </label>
                <p style={{ fontSize: 14, color: 'var(--sk-ink-2)', lineHeight: 1.6 }}>{user?.bio || 'Add a professional bio to stand out to clients.'}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                  {(user?.skills || []).map((sk) => <span key={sk} className="sk-badge blue">{sk}</span>)}
                </div>
              </div>
            ) : (
              <form onSubmit={saveProfile}>
                <div className="sk-grid-2">
                  <div className="sk-field"><label>Full Name</label><input className="sk-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                  <div className="sk-field"><label>Headline</label><input className="sk-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div className="sk-field"><label>Hourly Rate ($)</label><input className="sk-input" type="number" min="5" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} /></div>
                  <div className="sk-field">
                    <label>Availability</label>
                    <select className="sk-select" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })}>
                      <option value="available">Available</option>
                      <option value="busy">Busy</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>
                <div className="sk-field"><label>Skills (comma separated)</label><input className="sk-input" value={form.skillsText} onChange={(e) => setForm({ ...form, skillsText: e.target.value })} /></div>
                <div className="sk-field"><label>Education</label><input className="sk-input" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} /></div>
                <div className="sk-field"><label>Bio</label><textarea className="sk-textarea" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
                <button type="submit" className="sk-btn sk-btn-primary">Save Profile</button>
              </form>
            )}
          </section>

          {/* Recent Messages & Notifications */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <section className="sk-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 18 }}>Recent Messages</h2>
                <Link to="/messages" style={{ fontSize: 13, fontWeight: 700, color: 'var(--sk-primary)' }}>Open inbox →</Link>
              </div>
              {(dash?.recentConversations || []).length === 0 ? (
                <p style={{ margin: 0, fontSize: 14, color: 'var(--sk-muted)' }}>No conversations yet.</p>
              ) : (
                dash.recentConversations.map((c) => (
                  <Link key={c.id} to="/messages" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--sk-border)' }}>
                    <div><strong style={{ display: 'block', fontSize: 14 }}>{c.peer_name}</strong><span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>{c.last_message || 'No messages yet'}</span></div>
                    {c.unread_count > 0 && <span className="sk-badge blue">{c.unread_count} new</span>}
                  </Link>
                ))
              )}
            </section>

            <section className="sk-card">
              <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Recent Notifications</h2>
              {(dash?.recentNotifications || []).length === 0 ? (
                <p style={{ margin: 0, fontSize: 14, color: 'var(--sk-muted)' }}>All caught up.</p>
              ) : (
                dash.recentNotifications.map((n) => (
                  <Link key={n.id} to={n.link || '/'} style={{ display: 'block', padding: '8px 0', borderTop: '1px solid var(--sk-border)' }}>
                    <strong style={{ display: 'block', fontSize: 13 }}>{n.title}</strong>
                    <span style={{ fontSize: 12, color: 'var(--sk-muted)' }}>{n.body}</span>
                  </Link>
                ))
              )}
            </section>
          </div>
        </div>

        {/* My Applications */}
        <section className="sk-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>My Project Applications</h2>
            <Link to="/projects" className="sk-btn sk-btn-outline sk-btn-sm">Browse Open Projects</Link>
          </div>
          {apps.length === 0 ? (
            <p style={{ color: 'var(--sk-muted)', margin: 0 }}>You haven&rsquo;t applied to any projects yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--sk-border)', color: 'var(--sk-muted)' }}>
                    <th style={{ padding: '10px 8px' }}>Project</th>
                    <th style={{ padding: '10px 8px' }}>Client</th>
                    <th style={{ padding: '10px 8px' }}>Proposed</th>
                    <th style={{ padding: '10px 8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--sk-border)' }}>
                      <td style={{ padding: '12px 8px' }}><Link to={`/projects/${a.project_id}`} style={{ fontWeight: 700, color: 'var(--sk-primary)' }}>{a.project_title}</Link></td>
                      <td style={{ padding: '12px 8px' }}>{a.client_name}</td>
                      <td style={{ padding: '12px 8px' }}>${a.proposed_budget} · {a.delivery_days}d</td>
                      <td style={{ padding: '12px 8px' }}><span className={`sk-badge ${a.status === 'accepted' ? 'green' : a.status === 'shortlisted' ? 'blue' : a.status === 'rejected' ? 'red' : 'gray'}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
