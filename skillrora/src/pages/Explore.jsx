import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Heart, Search } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

const TABS = ['All Services', 'Web Development', 'UI/UX Design', 'Graphic Design', 'Video Editing', 'Digital Marketing', 'AI & Automation']

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const [draft, setDraft] = useState(params.get('q') || '')
  const [query, setQuery] = useState(params.get('q') || '')
  const [cat, setCat] = useState(params.get('cat') || 'All Services')
  const [maxBudget, setMaxBudget] = useState(1000)
  const [maxDays, setMaxDays] = useState(0)
  const [minRating, setMinRating] = useState(0)
  const [sort, setSort] = useState('recommended')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 })
  const [favs, setFavs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const qs = new URLSearchParams({
      q: query,
      cat: cat === 'All Services' ? '' : cat,
      maxBudget: String(maxBudget),
      maxDays: String(maxDays),
      minRating: String(minRating),
      sort,
      page: String(page),
      limit: '6',
    })
    api(`/api/gigs?${qs.toString()}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [query, cat, maxBudget, maxDays, minRating, sort, page])

  useEffect(() => {
    if (!user) { setFavs([]); return }
    api('/api/favorites').then((d) => setFavs(d.ids || [])).catch(() => {})
  }, [user])

  const toggleFav = async (e, id) => {
    e.preventDefault()
    if (!user) return
    try {
      const res = await api(`/api/favorites/${id}`, { method: 'POST' })
      setFavs((prev) => (res.saved ? [...prev, id] : prev.filter((x) => x !== id)))
    } catch { /* ignore */ }
  }

  const reset = () => {
    setDraft('')
    setQuery('')
    setCat('All Services')
    setMaxBudget(1000)
    setMaxDays(0)
    setMinRating(0)
    setSort('recommended')
    setPage(1)
    setParams({})
  }

  return (
    <div className="page">
      <Header active="explore" />
      <main className="sk-container">
        <div style={{ marginBottom: 24 }}>
          <span className="sk-badge blue" style={{ marginBottom: 8 }}>EXPLORE SERVICES</span>
          <h1 style={{ margin: '0 0 8px', fontSize: 32 }}>Find the right service for your project</h1>
          <p style={{ margin: '0 0 18px', color: 'var(--sk-muted)' }}>Browse fixed-price gigs backed by verified freelancers.</p>

          <form
            onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(draft.trim()) }}
            style={{ display: 'flex', gap: 10, maxWidth: 640, marginBottom: 16 }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--sk-muted)' }} />
              <input
                className="sk-input"
                style={{ paddingLeft: 36 }}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Search services, skills, or freelancers..."
              />
            </div>
            <button type="submit" className="sk-btn sk-btn-primary">Search</button>
          </form>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setCat(t); setPage(1) }}
                className={`sk-btn sk-btn-sm ${cat === t ? 'sk-btn-primary' : 'sk-btn-outline'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }} className="sk-explore-grid">
          <aside className="sk-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong style={{ fontSize: 16 }}>Filters</strong>
              <button type="button" onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--sk-primary)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Reset all</button>
            </div>

            <div className="sk-field">
              <label>Max budget: ${maxBudget}</label>
              <input type="range" min="50" max="2000" step="25" value={maxBudget} onChange={(e) => { setMaxBudget(Number(e.target.value)); setPage(1) }} style={{ width: '100%' }} />
            </div>

            <div className="sk-field">
              <label>Delivery time</label>
              <select className="sk-select" value={maxDays} onChange={(e) => { setMaxDays(Number(e.target.value)); setPage(1) }}>
                <option value={0}>Any delivery time</option>
                <option value={1}>Up to 24 hours</option>
                <option value={3}>Up to 3 days</option>
                <option value={7}>Up to 7 days</option>
              </select>
            </div>

            <div className="sk-field" style={{ marginBottom: 0 }}>
              <label>Minimum rating</label>
              <select className="sk-select" value={minRating} onChange={(e) => { setMinRating(Number(e.target.value)); setPage(1) }}>
                <option value={0}>All ratings</option>
                <option value={4.5}>4.5 ★ &amp; up</option>
                <option value={4.8}>4.8 ★ &amp; up</option>
              </select>
            </div>
          </aside>

          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--sk-muted)' }}>
                <strong style={{ color: 'var(--sk-ink)' }}>{data.total}</strong> services available
              </span>
              <select className="sk-select" style={{ width: 'auto' }} value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }} aria-label="Sort services">
                <option value="recommended">Sort: Recommended</option>
                <option value="newest">Sort: Newest</option>
                <option value="rating">Sort: Highest Rated</option>
                <option value="price_asc">Sort: Price Low to High</option>
                <option value="price_desc">Sort: Price High to Low</option>
              </select>
            </div>

            {loading ? (
              <div className="sk-grid-3">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="sk-skeleton sk-skeleton-card" />)}</div>
            ) : data.items.length === 0 ? (
              <div className="sk-empty">
                <h3>No matching services found</h3>
                <p>Try broadening your budget, delivery time, or search keywords.</p>
                <button type="button" className="sk-btn sk-btn-primary" onClick={reset}>Reset all filters</button>
              </div>
            ) : (
              <div className="sk-grid-3">
                {data.items.map((g) => {
                  const saved = favs.includes(g.id)
                  return (
                    <Link key={g.id} to={`/services/${g.slug}`} className="sk-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={g.cover_image} alt={g.title} style={{ width: '100%', height: 170, objectFit: 'cover', display: 'block' }} />
                        {user && (
                          <button
                            type="button"
                            onClick={(e) => toggleFav(e, g.id)}
                            aria-label="Save service"
                            style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%', border: 'none', background: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: 'var(--sk-shadow-sm)' }}
                          >
                            <Heart size={16} fill={saved ? '#ef4444' : 'none'} color={saved ? '#ef4444' : '#334155'} />
                          </button>
                        )}
                      </div>
                      <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span className="sk-avatar" style={{ width: 26, height: 26, background: g.seller_tint, fontSize: 10 }}>{g.seller_initials}</span>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{g.seller_name}</span>
                          </div>
                          <h3 style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.4 }}>{g.title}</h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--sk-border)', fontSize: 13 }}>
                          <span>★ <strong>{Number(g.rating).toFixed(1)}</strong> ({g.review_count})</span>
                          <strong>From ${g.price}</strong>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {data.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
                <button type="button" className="sk-btn sk-btn-outline sk-btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} type="button" className={`sk-btn sk-btn-sm ${p === page ? 'sk-btn-primary' : 'sk-btn-outline'}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button type="button" className="sk-btn sk-btn-outline sk-btn-sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
      <style>{`@media (max-width: 900px) { .sk-explore-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
