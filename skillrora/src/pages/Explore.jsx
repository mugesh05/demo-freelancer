import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Coins, Heart, Search } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { api } from '../lib/api.js'
import { CATEGORIES } from '../data/categories.js'

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [draft, setDraft] = useState(params.get('q') || '')
  const [query, setQuery] = useState(params.get('q') || '')
  const [cat, setCat] = useState(params.get('cat') || 'All Services')
  const [cryptoFilter, setCryptoFilter] = useState('ALL')
  const [maxBudget, setMaxBudget] = useState(2500)
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
      limit: '8',
    })
    api(`/api/gigs?${qs.toString()}`)
      .then((res) => {
        let items = res.items || []
        if (cryptoFilter !== 'ALL') {
          items = items.filter((g) => (g.currency || 'USDT').toUpperCase() === cryptoFilter)
        }
        setData({ ...res, items })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [query, cat, cryptoFilter, maxBudget, maxDays, minRating, sort, page])

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
    setCryptoFilter('ALL')
    setMaxBudget(2500)
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
          <span className="sk-badge blue" style={{ marginBottom: 8 }}>CRYPTO SERVICE CATALOG</span>
          <h1 style={{ margin: '0 0 8px', fontSize: 32 }}>Explore 15 Categories of Crypto Services</h1>
          <p style={{ margin: '0 0 18px', color: 'var(--sk-muted)' }}>
            Order fixed-price deliverables with milestone escrow protection in USDT, USDC, ETH, or BTC.
          </p>

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
                placeholder="Search services, skills, or Web3 specialists..."
              />
            </div>
            <button type="submit" className="sk-btn sk-btn-primary">Search</button>
          </form>

          {/* 15 Category Horizontal Selector */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, whiteSpace: 'nowrap' }}>
            <button
              type="button"
              onClick={() => { setCat('All Services'); setPage(1) }}
              className={`sk-btn sk-btn-sm ${cat === 'All Services' ? 'sk-btn-primary' : 'sk-btn-outline'}`}
            >
              All Services
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { setCat(c.name); setPage(1) }}
                className={`sk-btn sk-btn-sm ${cat === c.name ? 'sk-btn-primary' : 'sk-btn-outline'}`}
              >
                {t(c.transKey)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }} className="sk-explore-grid">
          {/* Filters Sidebar */}
          <aside className="sk-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <strong style={{ fontSize: 16 }}>Filters</strong>
              <button type="button" onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--sk-primary)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Reset</button>
            </div>

            <div className="sk-field">
              <label>Settlement Cryptocurrency</label>
              <select className="sk-select" value={cryptoFilter} onChange={(e) => { setCryptoFilter(e.target.value); setPage(1) }}>
                <option value="ALL">All Cryptos</option>
                <option value="USDT">USDT (Tether)</option>
                <option value="USDC">USDC (USD Coin)</option>
                <option value="ETH">ETH (Ethereum)</option>
                <option value="BTC">BTC (Bitcoin)</option>
              </select>
            </div>

            <div className="sk-field">
              <label>Max budget: {maxBudget} USDT/USDC</label>
              <input type="range" min="50" max="5000" step="50" value={maxBudget} onChange={(e) => { setMaxBudget(Number(e.target.value)); setPage(1) }} style={{ width: '100%' }} />
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

          {/* Results Grid */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--sk-muted)' }}>
                <strong style={{ color: 'var(--sk-ink)' }}>{data.items.length}</strong> services found
              </span>
              <select className="sk-select" style={{ width: 'auto' }} value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }} aria-label="Sort services">
                <option value="recommended">Sort: Recommended</option>
                <option value="newest">Sort: Newest</option>
                <option value="rating">Sort: Highest Rated</option>
              </select>
            </div>

            {loading ? (
              <div className="sk-grid-3">
                {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="sk-skeleton sk-skeleton-card" />)}
              </div>
            ) : data.items.length === 0 ? (
              <div className="sk-empty">
                <h3>No services found</h3>
                <p>Try broadening your search keyword or switching category and crypto filters.</p>
                <button type="button" className="sk-btn sk-btn-primary" onClick={reset}>Reset all filters</button>
              </div>
            ) : (
              <div className="sk-grid-3">
                {data.items.map((g) => (
                  <Link key={g.id} to={`/services/${g.slug}`} className="sk-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={g.cover_image} alt={g.title} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                      <button
                        type="button"
                        aria-label="Save service"
                        onClick={(e) => toggleFav(e, g.id)}
                        style={{
                          position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%',
                          background: 'rgba(255,255,255,0.92)', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer',
                        }}
                      >
                        <Heart size={16} fill={favs.includes(g.id) ? '#ef4444' : 'none'} color={favs.includes(g.id) ? '#ef4444' : '#64748b'} />
                      </button>
                      <span className={`sk-crypto-badge ${(g.currency || 'usdt').toLowerCase()}`} style={{ position: 'absolute', bottom: 10, left: 10 }}>
                        {g.currency || 'USDT'} · {g.crypto_network || 'Polygon'}
                      </span>
                    </div>

                    <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span className="sk-avatar" style={{ width: 28, height: 28, background: g.seller_tint, fontSize: 11 }}>{g.seller_initials}</span>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{g.seller_name}</span>
                        </div>
                        <h3 style={{ fontSize: 15, lineHeight: 1.4, margin: '0 0 10px' }}>{g.title}</h3>
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
        </div>
      </main>
      <Footer />
    </div>
  )
}
