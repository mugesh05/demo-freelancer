import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, Clock, MessageSquare, RotateCcw, ShieldCheck, ExternalLink } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { api } from '../lib/api.js'

export default function ServiceDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const { t } = useLanguage()
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
  const currency = gig.currency || 'USDT'
  const network = gig.crypto_network || 'Polygon'
  const gallery = gig.gallery?.length ? gig.gallery : [{ url: gig.cover_image, alt: gig.title }]
  const packages = gig.packages?.length ? gig.packages : [
    { key: 'Basic', price: Math.round(Number(gig.price) * 0.7), blurb: 'Starter deliverable with core features', delivery: Math.max(1, gig.delivery_days - 1), revisions: 1, features: ['Core deliverable', 'Source files included'] },
    { key: 'Standard', price: gig.price, blurb: 'Full service production-ready deliverable', delivery: gig.delivery_days, revisions: gig.revisions, features: ['Complete deliverable', 'Source files included', 'Commercial use license', 'Priority support'] },
    { key: 'Premium', price: Math.round(Number(gig.price) * 1.5), blurb: 'Enterprise package with full revisions and fast delivery', delivery: Math.max(1, gig.delivery_days - 2), revisions: gig.revisions + 2, features: ['Complete deliverable', 'Source files included', 'Commercial use license', '24/7 dedicated support', 'Turnkey documentation'] },
  ]
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }} className="sk-detail-grid">
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              <span className={`sk-crypto-badge ${currency.toLowerCase()}`}>{currency}</span>
              <span className="sk-badge blue" style={{ textTransform: 'uppercase' }}>{network} Network</span>
              <span className="sk-escrow-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={13} /> Smart Escrow Protected
              </span>
            </div>

            <h1 style={{ margin: '0 0 14px', fontSize: 30, lineHeight: 1.25 }}>{gig.title}</h1>
            
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

            {/* Smart Escrow Protection Notice */}
            <div className="sk-card" style={{ marginBottom: 24, background: 'var(--sk-surface-2)', border: '1px solid var(--sk-border)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <ShieldCheck size={26} color="var(--sk-success)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Skillrora Smart Escrow Guarantee</h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--sk-muted)', lineHeight: 1.6 }}>
                    Your deposit in <strong>{currency}</strong> is held safely in decentralized smart contract escrow on <strong>{network}</strong>. 
                    The freelancer is only paid once you inspect and approve the completed deliverables. You can request revisions or open arbitration anytime.
                  </p>
                </div>
              </div>
            </div>

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

          {/* Sticky Package Order Sidebar */}
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
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 800 }}>{pkg.price}</span>
                <span className={`sk-crypto-badge ${currency.toLowerCase()}`}>{currency}</span>
              </div>
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

            <div style={{ padding: '10px 12px', background: 'var(--sk-surface-2)', borderRadius: 8, fontSize: 12, color: 'var(--sk-muted)', marginBottom: 16 }}>
              <span>Settlement Network: <strong>{network}</strong></span><br />
              <span>Escrow Mechanism: <strong>Verified Multi-Sig / Smart Contract</strong></span>
            </div>

            {msg.text && <div className={`sk-alert ${msg.type}`}>{msg.text}</div>}

            <button type="button" className="sk-btn sk-btn-primary" style={{ width: '100%', marginBottom: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }} onClick={handleOrder} disabled={ordering}>
              <ShieldCheck size={16} />
              {ordering ? 'Initiating Escrow...' : `Order with Escrow (${pkg.price} ${currency})`}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span className={`sk-crypto-badge ${(g.currency || 'USDT').toLowerCase()}`}>{g.currency || 'USDT'}</span>
                      <span style={{ fontSize: 12, color: 'var(--sk-muted)' }}>★ {Number(g.rating || 5).toFixed(1)}</span>
                    </div>
                    <strong style={{ display: 'block', fontSize: 14, marginBottom: 8, lineHeight: 1.3 }}>{g.title}</strong>
                    <span style={{ fontSize: 13, color: 'var(--sk-ink)', fontWeight: 700 }}>From {g.price} {g.currency || 'USDT'}</span>
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
