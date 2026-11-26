import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, Clock, MessageSquare, RotateCcw } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

export default function ServiceDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [shot, setShot] = useState(0)
  const [pkgIndex, setPkgIndex] = useState(1)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [ordering, setOrdering] = useState(false)

  useEffect(() => {
    setLoading(true)
    api(`/api/gigs/${slug || 'modern-saas-website'}`)
      .then((d) => { setData(d); setShot(0) })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="page">
        <Header active="explore" />
        <main className="sk-container"><div className="sk-skeleton sk-skeleton-hero" /></main>
        <Footer />
      </div>
    )
  }

  if (!data?.gig) {
    return (
      <div className="page">
        <Header active="explore" />
        <main className="sk-container">
          <div className="sk-empty">
            <h3>Service not found</h3>
            <p>This service may have been paused or removed.</p>
            <Link className="sk-btn sk-btn-primary" to="/explore">Back to Explore</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const { gig, reviews, related } = data
  const gallery = gig.gallery?.length ? gig.gallery : [{ url: gig.cover_image, alt: gig.title }]
  const packages = gig.packages?.length ? gig.packages : [{ key: 'Standard', price: gig.price, blurb: 'Full service package', delivery: gig.delivery_days, revisions: gig.revisions, features: ['Complete deliverable'] }]
  const pkg = packages[pkgIndex] || packages[0]

  const handleOrder = async () => {
    if (!user) { navigate('/login', { state: { from: `/services/${gig.slug}` } }); return }
    if (user.role !== 'client') {
      setMsg({ type: 'warning', text: 'Switch to a Client account to place an order.' })
      return
    }
    setOrdering(true)
    setMsg({ type: '', text: '' })
    try {
      await api('/api/orders', { method: 'POST', body: { gig_id: gig.id, package_name: pkg.key } })
      navigate('/orders')
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setOrdering(false)
    }
  }

  const handleContact = async () => {
    if (!user) { navigate('/login', { state: { from: `/services/${gig.slug}` } }); return }
    try {
      await api('/api/conversations', { method: 'POST', body: { peer_id: gig.seller_id } })
      navigate('/messages')
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  return (
    <div className="page">
      <Header active="explore" />
      <main className="sk-container">
        <div style={{ fontSize: 13, color: 'var(--sk-muted)', marginBottom: 16 }}>
          <Link to="/">Home</Link> › <Link to={`/explore?cat=${encodeURIComponent(gig.category)}`}>{gig.category}</Link> › <span>{gig.title}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }} className="sk-detail-grid">
          <div>
            <h1 style={{ margin: '0 0 14px', fontSize: 30, lineHeight: 1.2 }}>{gig.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              <span className="sk-avatar" style={{ width: 34, height: 34, background: gig.seller_tint, fontSize: 12 }}>{gig.seller_initials}</span>
              <Link to={`/freelancers/${gig.seller_id}`} style={{ fontWeight: 700 }}>{gig.seller_name}</Link>
              <span className="sk-badge blue">{gig.seller_title}</span>
              <span style={{ fontSize: 14 }}>★ <strong>{Number(gig.rating).toFixed(1)}</strong> ({gig.review_count} reviews)</span>
            </div>

            <div className="sk-card" style={{ padding: 10, marginBottom: 14 }}>
              <img src={gallery[shot]?.url || gig.cover_image} alt={gallery[shot]?.alt || gig.title} style={{ width: '100%', height: 380, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
            </div>

            {gallery.length > 1 && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 24, overflowX: 'auto' }}>
                {gallery.map((g, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setShot(idx)}
                    style={{ padding: 0, border: idx === shot ? '2px solid var(--sk-primary)' : '1px solid var(--sk-border)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'none' }}
                  >
                    <img src={g.url} alt={g.alt} style={{ width: 88, height: 60, objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            )}

            <section className="sk-card" style={{ marginBottom: 24 }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>About this service</h2>
              <p style={{ margin: 0, color: 'var(--sk-ink-2)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{gig.description}</p>
            </section>

            <section className="sk-card">
              <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>Client reviews ({reviews.length})</h2>
              {reviews.length === 0 ? (
                <p style={{ color: 'var(--sk-muted)', margin: 0 }}>No reviews yet for this service.</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} style={{ padding: '14px 0', borderTop: '1px solid var(--sk-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <strong>{r.reviewer_name}</strong>
                      <span style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--sk-ink-2)', lineHeight: 1.6 }}>{r.comment}</p>
                  </div>
                ))
              )}
            </section>
          </div>

          <aside className="sk-card" style={{ position: 'sticky', top: 88 }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${packages.length}, 1fr)`, gap: 6, marginBottom: 18 }}>
              {packages.map((p, i) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPkgIndex(i)}
                  className={`sk-btn sk-btn-sm ${i === pkgIndex ? 'sk-btn-primary' : 'sk-btn-outline'}`}
                >
                  {p.key}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <strong style={{ fontSize: 17 }}>{pkg.key} package</strong>
              <span style={{ fontSize: 24, fontWeight: 800 }}>${pkg.price}</span>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--sk-muted)' }}>{pkg.blurb}</p>

            <div style={{ display: 'flex', gap: 16, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Clock size={15} /> {pkg.delivery} days delivery</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><RotateCcw size={15} /> {pkg.revisions} revisions</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(pkg.features || []).map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <Check size={16} color="var(--sk-success)" /> {f}
                </li>
              ))}
            </ul>

            {msg.text && <div className={`sk-alert ${msg.type}`}>{msg.text}</div>}

            <button type="button" className="sk-btn sk-btn-primary" style={{ width: '100%', marginBottom: 10 }} onClick={handleOrder} disabled={ordering}>
              {ordering ? 'Creating order...' : `Order ${pkg.key} ($${pkg.price})`}
            </button>
            <button type="button" className="sk-btn sk-btn-outline" style={{ width: '100%' }} onClick={handleContact}>
              <MessageSquare size={16} /> Contact Seller
            </button>
          </aside>
        </div>

        {related?.length > 0 && (
          <section style={{ marginTop: 48 }}>
            <h2 style={{ margin: '0 0 18px', fontSize: 22 }}>More services you may like</h2>
            <div className="sk-grid-4">
              {related.map((g) => (
                <Link key={g.id} to={`/services/${g.slug}`} className="sk-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <img src={g.cover_image} alt={g.title} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                  <div style={{ padding: 14 }}>
                    <strong style={{ display: 'block', fontSize: 14, marginBottom: 6 }}>{g.title}</strong>
                    <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>From ${g.price}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <style>{`@media (max-width: 960px) { .sk-detail-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
