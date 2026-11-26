import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Coins, Lock, Search, ShieldCheck, Sparkles, Star, Zap } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../lib/api.js'
import { useLanguage } from '../context/LanguageContext.jsx'
import { CATEGORIES } from '../data/categories.js'

const FAQS = [
  ['How does cryptocurrency escrow work on Skillrora?', 'When a client hires a freelancer or orders a gig, crypto (USDT, USDC, ETH, or BTC) is deposited into our testnet smart escrow contract. The funds remain locked until the client reviews and approves the delivered milestones.'],
  ['Which cryptocurrencies and networks are supported?', 'Skillrora supports USDT, USDC, Ethereum (ETH), and Bitcoin (BTC) across Polygon (Amoy testnet), Ethereum (Sepolia testnet), Arbitrum (Sepolia), and Bitcoin testnet.'],
  ['Are there any USD or traditional bank fees?', 'No. Skillrora operates entirely without USD. There are no wire transfer delays, foreign exchange fees, or chargeback fraud risks.'],
  ['What happens if there is a disagreement on delivered work?', 'Either party can open a dispute from their Orders page. A platform administrator reviews submitted deliverables, evidence, and messages to fairly release or refund the escrow.'],
]

export default function Home() {
  const { t } = useLanguage()
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
                  <Sparkles size={14} /> {t('heroBadge')}
                </span>
                <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 50px)', lineHeight: 1.15, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
                  {t('heroTitle')}
                </h1>
                <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--sk-muted)', margin: '0 0 28px', maxWidth: 540 }}>
                  {t('heroSubtitle')}
                </p>

                {/* Crypto Pill Badges */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  <span className="sk-crypto-badge usdt">USDT</span>
                  <span className="sk-crypto-badge usdc">USDC</span>
                  <span className="sk-crypto-badge eth">ETH</span>
                  <span className="sk-crypto-badge btc">BTC</span>
                  <span className="sk-escrow-badge in_escrow"><Lock size={12} /> SMART ESCROW</span>
                </div>

                <form onSubmit={onSearch} style={{ display: 'flex', gap: 8, background: 'var(--sk-bg)', padding: 8, borderRadius: 14, border: '1px solid var(--sk-border)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 220px', paddingLeft: 8 }}>
                    <Search size={18} color="var(--sk-muted)" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t('searchPlaceholder')}
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
                    <option value="services">{t('services')}</option>
                    <option value="talent">{t('freelancers')}</option>
                    <option value="projects">{t('jobs')}</option>
                  </select>
                  <button type="submit" className="sk-btn sk-btn-primary">{t('searchBtn')}</button>
                </form>

                <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                  <Link to="/explore" className="sk-btn sk-btn-primary">{t('exploreServicesBtn')} <ArrowRight size={16} /></Link>
                  <Link to="/signup?role=freelancer" className="sk-btn sk-btn-outline">{t('startFreelancingBtn')}</Link>
                </div>

                {data?.stats && (
                  <div style={{ display: 'flex', gap: 28, marginTop: 28, flexWrap: 'wrap', fontSize: 14 }}>
                    <div><strong>{data.stats.freelancers}+</strong> <span style={{ color: 'var(--sk-muted)' }}>{t('verifiedTalent')}</span></div>
                    <div><strong>{data.stats.gigs}+</strong> <span style={{ color: 'var(--sk-muted)' }}>{t('activeServices')}</span></div>
                    <div><strong>{data.stats.openProjects}+</strong> <span style={{ color: 'var(--sk-muted)' }}>{t('openJobs')}</span></div>
                  </div>
                )}
              </div>

              <div className="sk-card" style={{ padding: 14, borderRadius: 20 }}>
                <img
                  src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=85"
                  alt="Web3 Freelancers collaborating"
                  style={{ width: '100%', height: 340, objectFit: 'cover', borderRadius: 14, display: 'block' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 8px 4px' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: 15 }}>100% Crypto Escrow Settled</strong>
                    <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>USDT · USDC · ETH · BTC with verified blockchain receipts</span>
                  </div>
                  <span className="sk-badge green"><Star size={13} /> 4.9/5 Rating</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 15 Popular Categories */}
        <section className="sk-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 28 }}>{t('popularCategoriesTitle')}</h2>
              <p style={{ margin: 0, color: 'var(--sk-muted)' }}>{t('popularCategoriesSubtitle')}</p>
            </div>
            <Link to="/explore" style={{ color: 'var(--sk-primary)', fontWeight: 700, fontSize: 14 }}>{t('viewAllCategories')}</Link>
          </div>

          <div className="sk-grid-3">
            {CATEGORIES.map((c) => {
              const Icon = c.icon
              return (
                <Link
                  key={c.id}
                  to={`/explore?cat=${encodeURIComponent(c.name)}`}
                  className="sk-card"
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 18, transition: 'transform 0.15s, border-color 0.15s' }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: 'var(--sk-primary-soft)',
                    color: 'var(--sk-primary)', display: 'grid', placeItems: 'center', flexShrink: 0
                  }}>
                    <Icon size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: 15, marginBottom: 4 }}>{t(c.transKey)}</strong>
                    <span style={{ fontSize: 12, color: 'var(--sk-muted)', display: 'block', lineHeight: 1.4, marginBottom: 8 }}>
                      {c.tagline}
                    </span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {c.subcategories.slice(0, 2).map((sub) => (
                        <span key={sub} style={{ fontSize: 11, background: 'var(--sk-bg)', padding: '2px 6px', borderRadius: 6, color: 'var(--sk-ink-2)' }}>
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Featured Crypto Services */}
        <section className="sk-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 28 }}>{t('featuredServicesTitle')}</h2>
              <p style={{ margin: 0, color: 'var(--sk-muted)' }}>{t('featuredServicesSubtitle')}</p>
            </div>
            <Link to="/explore" style={{ color: 'var(--sk-primary)', fontWeight: 700, fontSize: 14 }}>{t('viewAllServices')}</Link>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="sk-avatar" style={{ width: 28, height: 28, background: g.seller_tint, fontSize: 11 }}>{g.seller_initials}</span>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{g.seller_name}</span>
                        </div>
                        <span className={`sk-crypto-badge ${(g.currency || 'usdt').toLowerCase()}`}>
                          {g.currency || 'USDT'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 15, lineHeight: 1.4, margin: '0 0 12px' }}>{g.title}</h3>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--sk-border)', fontSize: 13 }}>
                      <span>★ <strong>{Number(g.rating).toFixed(1)}</strong> ({g.review_count})</span>
                      <strong>{t('from')} {g.price} {g.currency || 'USDT'}</strong>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Top-Rated Crypto Professionals */}
        <section className="sk-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 28 }}>{t('topRatedTitle')}</h2>
              <p style={{ margin: 0, color: 'var(--sk-muted)' }}>{t('topRatedSubtitle')}</p>
            </div>
            <Link to="/talent" style={{ color: 'var(--sk-primary)', fontWeight: 700, fontSize: 14 }}>{t('browseAllTalent')}</Link>
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
                  <strong>{f.hourly_rate} {f.hourly_currency || 'USDT'}/hr</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Latest Crypto Jobs */}
        <section className="sk-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 28 }}>{t('recentlyPostedJobsTitle')}</h2>
              <p style={{ margin: 0, color: 'var(--sk-muted)' }}>{t('recentlyPostedJobsSubtitle')}</p>
            </div>
            <Link to="/projects" style={{ color: 'var(--sk-primary)', fontWeight: 700, fontSize: 14 }}>{t('browseAllJobs')}</Link>
          </div>
          <div className="sk-grid-2">
            {(data?.recentProjects || []).map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="sk-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <span className="sk-badge blue">{p.category}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`sk-crypto-badge ${(p.currency || 'usdt').toLowerCase()}`}>
                      {p.currency || 'USDT'}
                    </span>
                    <strong style={{ color: 'var(--sk-success)', fontSize: 14 }}>
                      {p.budget_min} – {p.budget_max} {p.currency || 'USDT'}
                    </strong>
                  </div>
                </div>
                <h3 style={{ margin: 0, fontSize: 17 }}>{p.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--sk-muted)', lineHeight: 1.5 }}>{p.description.slice(0, 130)}...</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--sk-muted)', paddingTop: 10, borderTop: '1px solid var(--sk-border)' }}>
                  <span>{t('postedBy')} {p.client_name}</span>
                  <span>{p.application_count} {t('proposals')} · {t('due')} {p.deadline}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* How It Works with Crypto Escrow */}
        <section style={{ background: '#ffffff', borderTop: '1px solid var(--sk-border)', borderBottom: '1px solid var(--sk-border)', padding: '56px 0' }}>
          <div className="sk-container">
            <h2 style={{ textAlign: 'center', fontSize: 30, margin: '0 0 8px' }}>{t('howItWorksTitle')}</h2>
            <p style={{ textAlign: 'center', color: 'var(--sk-muted)', margin: '0 0 36px' }}>{t('howItWorksSubtitle')}</p>
            <div className="sk-grid-4" style={{ marginBottom: 48 }}>
              {[
                ['01', t('step1Title'), t('step1Desc')],
                ['02', t('step2Title'), t('step2Desc')],
                ['03', t('step3Title'), t('step3Desc')],
                ['04', t('step4Title'), t('step4Desc')],
              ].map(([num, title, desc]) => (
                <div key={num} className="sk-card" style={{ background: 'var(--sk-bg)' }}>
                  <span className="sk-badge blue" style={{ marginBottom: 12 }}>{num}</span>
                  <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>{title}</h3>
                  <p style={{ margin: 0, color: 'var(--sk-muted)', fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>

            <div className="sk-grid-3">
              {[
                [ShieldCheck, t('benefit1Title'), t('benefit1Desc')],
                [Zap, t('benefit2Title'), t('benefit2Desc')],
                [Coins, t('benefit3Title'), t('benefit3Desc')],
              ].map(([Icon, title, desc]) => (
                <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--sk-primary-soft)', color: 'var(--sk-primary)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', marginBottom: 4, fontSize: 16 }}>{title}</strong>
                    <span style={{ fontSize: 14, color: 'var(--sk-muted)', lineHeight: 1.5 }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Client Stories & FAQ */}
        <section className="sk-container" style={{ padding: '56px 20px' }}>
          <div className="sk-grid-2" style={{ gap: 36, alignItems: 'start' }}>
            <div className="sk-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 22 }}>Verified Blockchain Testimonials</h2>
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
                  <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>{shownReview.reviewer_location} · Paid via Crypto Escrow</span>
                </div>
              ) : (
                <p style={{ color: 'var(--sk-muted)' }}>Verified client reviews appear here as crypto orders are released.</p>
              )}
            </div>

            <div>
              <h2 style={{ margin: '0 0 16px', fontSize: 24 }}>Frequently Asked Questions</h2>
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
        <section className="sk-container" style={{ paddingBottom: 64 }}>
          <div className="sk-card" style={{ background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, padding: 40, borderRadius: 20 }}>
            <div>
              <span className="sk-badge green" style={{ marginBottom: 12 }}>SMART ESCROW READY</span>
              <h2 style={{ margin: '0 0 8px', fontSize: 28, color: '#fff' }}>Start Hiring &amp; Earning in Cryptocurrency Today</h2>
              <p style={{ margin: 0, color: '#94a3b8' }}>Connect your Web3 wallet and trade globally without currency conversion fees or bank friction.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/signup?role=client" className="sk-btn sk-btn-primary">{t('postAJob')}</Link>
              <Link to="/signup?role=freelancer" className="sk-btn sk-btn-outline" style={{ color: '#fff', borderColor: '#475569' }}>{t('createService')}</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
