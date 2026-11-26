import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MapPin, MessageSquare } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

export default function FreelancerProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api(`/api/freelancers/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [id])

  const contact = async () => {
    if (!user) { navigate('/login', { state: { from: `/freelancers/${id}` } }); return }
    await api('/api/conversations', { method: 'POST', body: { peer_id: Number(id) } })
    navigate('/messages')
  }

  if (loading) {
    return (
      <div className="page">
        <Header active="talent" />
        <main className="sk-container"><div className="sk-skeleton sk-skeleton-hero" /></main>
        <Footer />
      </div>
    )
  }

  if (!data?.freelancer) {
    return (
      <div className="page">
        <Header active="talent" />
        <main className="sk-container">
          <div className="sk-empty">
            <h3>Freelancer not found</h3>
            <Link className="sk-btn sk-btn-primary" to="/talent">Browse Talent</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const { freelancer: f, gigs, reviews } = data

  return (
    <div className="page">
      <Header active="talent" />
      <main className="sk-container">
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 28, alignItems: 'start' }} className="sk-profile-grid">
          <aside className="sk-card">
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <span className="sk-avatar" style={{ width: 88, height: 88, background: f.tint, fontSize: 28, margin: '0 auto 12px' }}>
                {f.avatar_url ? <img src={f.avatar_url} alt={f.name} /> : f.initials}
              </span>
              <h1 style={{ margin: '0 0 4px', fontSize: 22 }}>{f.name}</h1>
              <p style={{ margin: '0 0 10px', color: 'var(--sk-muted)', fontSize: 14 }}>{f.title}</p>
              <span className={`sk-badge ${f.availability === 'available' ? 'green' : 'amber'}`}>{f.availability}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--sk-border)', borderBottom: '1px solid var(--sk-border)', marginBottom: 16, fontSize: 14 }}>
              <span>★ <strong>{Number(f.rating).toFixed(1)}</strong> ({f.review_count})</span>
              <strong>${f.hourly_rate}/hr</strong>
            </div>

            <div style={{ fontSize: 13, color: 'var(--sk-muted)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} /> {f.location}</span>
              <span>Level: <strong style={{ color: 'var(--sk-ink)' }}>{f.experience_level}</strong></span>
              {f.education && <span>Education: <strong style={{ color: 'var(--sk-ink)' }}>{f.education}</strong></span>}
            </div>

            {user?.id !== f.id && (
              <button type="button" className="sk-btn sk-btn-primary" style={{ width: '100%' }} onClick={contact}>
                <MessageSquare size={16} /> Message {f.name.split(' ')[0]}
              </button>
            )}
          </aside>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <section className="sk-card">
              <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>About</h2>
              {f.tagline && <p style={{ fontWeight: 700, margin: '0 0 8px' }}>{f.tagline}</p>}
              <p style={{ margin: 0, color: 'var(--sk-ink-2)', lineHeight: 1.7 }}>{f.bio || 'No bio added yet.'}</p>
            </section>

            <section className="sk-card">
              <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>Skills</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(f.skills || []).map((s) => <span key={s} className="sk-badge blue">{s}</span>)}
              </div>
            </section>

            {f.portfolio?.length > 0 && (
              <section className="sk-card">
                <h2 style={{ margin: '0 0 14px', fontSize: 20 }}>Portfolio</h2>
                <div className="sk-grid-3">
                  {f.portfolio.map((item, i) => (
                    <div key={i} className="sk-card" style={{ padding: 0, overflow: 'hidden' }}>
                      <img src={item.image} alt={item.title} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                      <div style={{ padding: 12 }}>
                        <strong style={{ display: 'block', fontSize: 14 }}>{item.title}</strong>
                        <span style={{ fontSize: 12, color: 'var(--sk-muted)' }}>{item.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {gigs.length > 0 && (
              <section className="sk-card">
                <h2 style={{ margin: '0 0 14px', fontSize: 20 }}>Services offered</h2>
                <div className="sk-grid-2">
                  {gigs.map((g) => (
                    <Link key={g.id} to={`/services/${g.slug}`} className="sk-card" style={{ padding: 14 }}>
                      <strong style={{ display: 'block', marginBottom: 6 }}>{g.title}</strong>
                      <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>From ${g.price} · {g.delivery_days} days</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="sk-card">
              <h2 style={{ margin: '0 0 14px', fontSize: 20 }}>Client reviews ({reviews.length})</h2>
              {reviews.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--sk-muted)' }}>No reviews yet.</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} style={{ padding: '12px 0', borderTop: '1px solid var(--sk-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong>{r.reviewer_name}</strong>
                      <span style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--sk-ink-2)' }}>{r.comment}</p>
                  </div>
                ))
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
      <style>{`@media (max-width: 900px) { .sk-profile-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
