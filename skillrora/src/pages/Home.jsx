import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Search, ShieldCheck, Sparkles, Star, Zap } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../lib/api.js'

const FAQS = [
  ['How does Skillrora protect my payments?', 'Every order and project milestone creates a tracked payment record. Funds are only released when you approve the delivered work.'],
  ['Can I hire both fixed-price services and hourly/project freelancers?', 'Yes. Browse ready-to-buy service packages on Explore Services, or post a custom project to receive tailored proposals from freelancers.'],
  ['How do I become a freelancer on Skillrora?', 'Create an account with the Freelancer role, complete your profile with skills and portfolio samples, and publish your first service gig or apply to open projects.'],
  ['What happens if I need revisions on a deliverable?', 'You can request revisions directly from your Orders page or message your freelancer in real time until the work meets your requirements.'],
]

export default function Home() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState('services')
  const [openFaq, setOpenFaq] = useState(0)
  const [revOffset, setRevOffset] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    api('/api/home')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const onSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    const target = searchMode === 'projects' ? '/projects' : searchMode === 'talent' ? '/talent' : '/explore'
    navigate(q ? `${target}?q=${encodeURIComponent(q)}` : target)
  }

  const reviews = data?.reviews || []
  const shownReview = reviews.length ? reviews[revOffset % reviews.length] : null

  return (
    <div className="page">
      <Header active="home" />
      <main>
        {/* Hero */}
        <section style={{ background: '#ffffff', borderBottom: '1px solid var(--sk-border)' }}>
          <div className="sk-container" style={{ paddingTop: 56, paddingBottom: 56 }}>
            <div className="sk-grid-2" style={{ alignItems: 'center', gap: 48 }}>
              <div>
                <span className="sk-badge blue" style={{ marginBottom: 16 }}>
                  <Sparkles size={14} /> Vetted Freelance Marketplace
                </span>
                <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 50px)', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
                  Turn ambitious ideas into reality with trusted talent.
                </h1>
                <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--sk-muted)', margin: '0 0 28px', maxWidth: 540 }}>
                  Hire top-rated developers, designers, and AI specialists — or post a project and receive tailored proposals in minutes.
                </p>

                <form onSubmit={onSearch} style={{ display: 'flex', gap: 8, background: 'var(--sk-bg)', padding: 8, borderRadius: 14, border: '1px solid var(--sk-border)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 220px', paddingLeft: 8 }}>
                    <Search size={18} color="var(--sk-muted)" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Try “SaaS UI”, “React”, or “AI automation”"
                      aria-label="Search marketplace"
                      style={{ border: 'none', background: 'transparent', width: '100%', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                  <select
                    aria-label="Search type"
                    value={searchMode}
                    onChange={(e) => setSearchMode(e.target.value)}
                    className="sk-select"
                    style={{ width: 'auto', minWidth: 130, padding: '9px 12px' }}
                  >
                    <option value="services">Services</option>
                    <option value="talent">Freelancers</option>
                    <option value="projects">Projects</option>
                  </select>
                  <button type="submit" className="sk-btn sk-btn-primary">Search</button>
                </form>

                <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                  <Link to="/explore" className="sk-btn sk-btn-primary">Explore Services <ArrowRight size={16} /></Link>
                  <Link to="/signup?role=freelancer" className="sk-btn sk-btn-outline">Start Freelancing</Link>
                </div>

                {data?.stats && (
                  <div style={{ display: 'flex', gap: 28, marginTop: 28, flexWrap: 'wrap', fontSize: 14 }}>
                    <div><strong>{data.stats.freelancers}+</strong> <span style={{ color: 'var(--sk-muted)' }}>Verified Talent</span></div>
                    <div><strong>{data.stats.gigs}+</strong> <span style={{ color: 'var(--sk-muted)' }}>Active Services</span></div>
                    <div><strong>{data.stats.openProjects}+</strong> <span style={{ color: 'var(--sk-muted)' }}>Open Projects</span></div>
                  </div>
                )}
              </div>

              <div className="sk-card" style={{ padding: 14, borderRadius: 20 }}>
                <img
                  src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=85"
                  alt="Freelancer collaborating on a product"
                  style={{ width: '100%', height: 340, objectFit: 'cover', borderRadius: 14, display: 'block' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 8px 4px' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: 15 }}>Built for speed &amp; clarity</strong>
                    <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>Direct messaging, milestone tracking, and verified reviews</span>
                  </div>
                  <span className="sk-badge green"><Star size={13} /> 4.9/5 Avg</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Categories */}
        <section className="sk-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 28 }}>Popular service categories</h2>
              <p style={{ margin: 0, color: 'var(--sk-muted)' }}>Explore vetted experts across high-demand disciplines.</p>
            </div>
            <Link to="/explore" style={{ color: 'var(--sk-primary)', fontWeight: 700, fontSize: 14 }}>View all services →</Link>
          </div>

          {loading ? (
            <div className="sk-grid-3">{[1, 2, 3].map((i) => <div key={i} className="sk-skeleton" style={{ height: 96 }} />)}</div>
          ) : (
            <div className="sk-grid-3">
              {(data?.categories || []).map((c) => (
                <Link
                  key={c.category}
                  to={`/explore?cat=${encodeURIComponent(c.category)}`}
                  className="sk-card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20 }}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: 16, marginBottom: 4 }}>{c.category}</strong>
                    <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>{c.count} active {c.count === 1 ? 'service' : 'services'}</span>
                  </div>
                  <ArrowRight size={18} color="var(--sk-primary)" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Featured Services */}
        <section className="sk-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 28 }}>Featured services</h2>
              <p style={{ margin: 0, color: 'var(--sk-muted)' }}>Fixed-price packages ready to start today.</p>
            </div>
            <Link to="/explore" style={{ color: 'var(--sk-primary)', fontWeight: 700, fontSize: 14 }}>Explore all →</Link>
          </div>
          {loading ? (
            <div className="sk-grid-4">{[1, 2, 3, 4].map((i) => <div key={i} className="sk-skeleton sk-skeleton-card" />)}</div>
          ) : (
            <div className="sk-grid-4">
              {(data?.featuredGigs || []).map((g) => (
                <Link key={g.id} to={`/services/${g.slug}`} className="sk-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <img src={g.cover_image} alt={g.title} style={{ width: '100%', height: 165, objectFit: 'cover' }} />
                  <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span className="sk-avatar" style={{ width: 28, height: 28, background: g.seller_tint, fontSize: 11 }}>{g.seller_initials}</span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{g.seller_name}</span>
                      </div>
                      <h3 style={{ fontSize: 15, lineHeight: 1.4, margin: '0 0 12px' }}>{g.title}</h3>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--sk-border)', fontSize: 13 }}>
                      <span>★ <strong>{Number(g.rating).toFixed(1)}</strong> ({g.review_count})</span>
                      <strong>From ${g.price}</strong>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Top-Rated Professionals */}
        <section className="sk-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 28 }}>Top-rated professionals</h2>
              <p style={{ margin: 0, color: 'var(--sk-muted)' }}>Work directly with specialists across design, engineering, and AI.</p>
            </div>
            <Link to="/talent" style={{ color: 'var(--sk-primary)', fontWeight: 700, fontSize: 14 }}>Browse all talent →</Link>
          </div>
          <div className="sk-grid-4">
            {(data?.topFreelancers || []).map((f) => (
              <Link key={f.id} to={`/freelancers/${f.id}`} className="sk-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="sk-avatar" style={{ width: 48, height: 48, background: f.tint, fontSize: 16 }}>
                    {f.avatar_url ? <img src={f.avatar_url} alt={f.name} /> : f.initials}
                  </span>
                  <div>
                    <strong style={{ display: 'block', fontSize: 15 }}>{f.name}</strong>
                    <span style={{ fontSize: 12, color: 'var(--sk-muted)' }}>{f.title}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(f.skills || []).slice(0, 3).map((s) => (
                    <span key={s} className="sk-badge gray">{s}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--sk-border)', fontSize: 13 }}>
                  <span>★ <strong>{Number(f.rating).toFixed(1)}</strong> ({f.review_count})</span>
                  <strong>${f.hourly_rate}/hr</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recently Posted Projects */}
        <section className="sk-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 28 }}>Recently posted projects</h2>
              <p style={{ margin: 0, color: 'var(--sk-muted)' }}>Open briefs from clients ready to hire now.</p>
            </div>
            <Link to="/projects" style={{ color: 'var(--sk-primary)', fontWeight: 700, fontSize: 14 }}>Browse all projects →</Link>
          </div>
          <div className="sk-grid-2">
            {(data?.recentProjects || []).map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="sk-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <span className="sk-badge blue">{p.category}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sk-success)' }}>${p.budget_min} – ${p.budget_max}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: 17 }}>{p.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--sk-muted)', lineHeight: 1.5 }}>{p.description.slice(0, 120)}...</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--sk-muted)', paddingTop: 10, borderTop: '1px solid var(--sk-border)' }}>
                  <span>Posted by {p.client_name}</span>
                  <span>{p.application_count} proposals · Due {p.deadline}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* How It Works & Why Choose Skillrora */}
        <section style={{ background: '#ffffff', borderTop: '1px solid var(--sk-border)', borderBottom: '1px solid var(--sk-border)' }}>
          <div className="sk-container">
            <h2 style={{ textAlign: 'center', fontSize: 30, margin: '0 0 8px' }}>How Skillrora works</h2>
            <p style={{ textAlign: 'center', color: 'var(--sk-muted)', margin: '0 0 32px' }}>Three clear steps from brief to delivery.</p>
            <div className="sk-grid-3" style={{ marginBottom: 48 }}>
              {[
                ['01', 'Post a project or pick a service', 'Share your goals, budget, and deadline — or choose a fixed-price service package.'],
                ['02', 'Compare & hire with confidence', 'Review portfolios, ratings, and proposals, then message candidates directly.'],
                ['03', 'Track progress & approve delivery', 'Collaborate on milestones and release payment only when you are satisfied.'],
              ].map(([num, title, desc]) => (
                <div key={num} className="sk-card">
                  <span className="sk-badge blue" style={{ marginBottom: 12 }}>{num}</span>
                  <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{title}</h3>
                  <p style={{ margin: 0, color: 'var(--sk-muted)', fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>

            <div className="sk-grid-3">
              {[
                [ShieldCheck, 'Protected Workflows', 'Role-verified accounts, clear milestones, and transparent order tracking.'],
                [Zap, 'Fast Proposal Matching', 'Connect with available specialists across design, engineering, and AI.'],
                [CheckCircle2, 'Verified Reviews', 'Ratings and reviews are tied directly to completed marketplace orders.'],
              ].map(([Icon, title, desc]) => (
                <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--sk-primary-soft)', color: 'var(--sk-primary)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', marginBottom: 4 }}>{title}</strong>
                    <span style={{ fontSize: 14, color: 'var(--sk-muted)', lineHeight: 1.5 }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials & FAQ */}
        <section className="sk-container">
          <div className="sk-grid-2" style={{ gap: 36, alignItems: 'start' }}>
            <div className="sk-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 22 }}>Client stories</h2>
                {reviews.length > 1 && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="sk-icon-btn" aria-label="Previous review" onClick={() => setRevOffset((o) => (o - 1 + reviews.length) % reviews.length)}><ChevronLeft size={16} /></button>
                    <button type="button" className="sk-icon-btn" aria-label="Next review" onClick={() => setRevOffset((o) => (o + 1) % reviews.length)}><ChevronRight size={16} /></button>
                  </div>
                )}
              </div>
              {shownReview ? (
                <div>
                  <div style={{ color: '#f59e0b', marginBottom: 10 }}>{'★'.repeat(shownReview.rating)}</div>
                  <p style={{ fontSize: 16, lineHeight: 1.6, margin: '0 0 14px' }}>“{shownReview.comment}”</p>
                  <strong style={{ display: 'block', fontSize: 14 }}>{shownReview.reviewer_name}</strong>
                  <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>{shownReview.reviewer_location}</span>
                </div>
              ) : (
                <p style={{ color: 'var(--sk-muted)' }}>Verified client reviews appear here as orders are completed.</p>
              )}
            </div>

            <div>
              <h2 style={{ margin: '0 0 16px', fontSize: 24 }}>Frequently asked questions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {FAQS.map(([q, a], idx) => (
                  <div key={q} className="sk-card" style={{ padding: 16 }}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', padding: 0, fontWeight: 700, fontSize: 15, textAlign: 'left', cursor: 'pointer' }}
                    >
                      <span>{q}</span>
                      <ChevronDown size={18} style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>
                    {openFaq === idx && <p style={{ margin: '10px 0 0', fontSize: 14, color: 'var(--sk-muted)', lineHeight: 1.6 }}>{a}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="sk-container">
          <div className="sk-card" style={{ background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, padding: 36 }}>
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: 28 }}>Ready to build your next project?</h2>
              <p style={{ margin: 0, color: '#cbd5e1' }}>Join clients and freelancers shipping real work on Skillrora.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/signup?role=client" className="sk-btn sk-btn-primary">Post a Project</Link>
              <Link to="/signup?role=freelancer" className="sk-btn sk-btn-outline">Offer Your Skills</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
