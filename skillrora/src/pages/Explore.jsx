import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import Heart from '../components/Heart.jsx'
import { img, services, tabs, sidebarGroups, topSelect } from '../data/services.js'

const deliveryOptions = [['Any', 0], ['Up to 24 hours', 1], ['Up to 3 days', 3], ['Up to 7 days', 7]]
const ratingOptions = [[4.5, '★★★★★', ''], [4.0, '★★★★', '★']]
const pages = [1, 2, 3, '…', 24]

export default function Explore() {
  const [params] = useSearchParams()
  const [draft, setDraft] = useState(params.get('q') || '')
  const [query, setQuery] = useState(params.get('q') || '')
  const initialTab = tabs.includes(params.get('cat')) ? params.get('cat') : tabs[0]
  const [tab, setTab] = useState(initialTab)
  const [topCat, setTopCat] = useState(0)
  const [groups, setGroups] = useState([])
  const [delivery, setDelivery] = useState(0)
  const [minRating, setMinRating] = useState(0)
  const [budget, setBudget] = useState(500)
  const [page, setPage] = useState(1)

  const reset = () => { setTab(tabs[0]); setTopCat(0); setGroups([]); setDelivery(0); setMinRating(0); setBudget(500); setDraft(''); setQuery('') }
  const toggleGroup = (name) => setGroups((g) => (g.includes(name) ? g.filter((x) => x !== name) : [...g, name]))

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    const sideCats = sidebarGroups.filter(([n]) => groups.includes(n)).flatMap(([, c]) => c)
    const topCats = topSelect[topCat][1]
    return services.filter((s) => {
      const hay = `${s.title} ${s.cat} ${s.name}`.toLowerCase()
      return words.every((w) => hay.includes(w))
        && (tab === tabs[0] || s.cat === tab)
        && (!topCats.length || topCats.includes(s.cat))
        && (!sideCats.length || sideCats.includes(s.cat))
        && (!delivery || s.days <= delivery)
        && s.rating >= minRating
        && s.price <= budget
    })
  }, [query, tab, topCat, groups, delivery, minRating, budget])

  const filtered = query || tab !== tabs[0] || topCat || groups.length || delivery || minRating || budget !== 500
  const count = filtered ? results.length.toLocaleString() : '1,248'

  return (
    <div className="page page-explore">
      <Header active="explore" />
      <main>
        <section className="browse-hero">
          <div className="crumbs"><Link to="/">Home</Link><span>›</span><Link to="/explore">Explore Services</Link></div>
          <h1>The right talent. Endless possibilities.</h1>
          <p>Discover top talent from around the world and bring your ideas to life.</p>
          <form className="search-box" onSubmit={(e) => { e.preventDefault(); setQuery(draft.trim()) }}>
            <span className="magnify">⌕</span>
            <input type="search" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Try “website design” or “AI automation”" aria-label="Search services" />
            <select aria-label="Category" value={topCat} onChange={(e) => setTopCat(Number(e.target.value))}>
              {topSelect.map(([label], i) => <option key={label} value={i}>{label}</option>)}
            </select>
            <button type="submit">Search Services</button>
          </form>
          <div className="popular-tabs">
            {tabs.map((t) => (
              <button type="button" key={t} className={t === tab ? 'selected' : undefined} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
        </section>

        <section className="browse-layout">
          <aside className="filters">
            <div className="filters-title"><h2>Filters</h2><button type="button" onClick={reset}>Reset all</button></div>
            <details className="filter-block" open>
              <summary>Category <span>⌃</span></summary>
              <label className="filter-option"><input type="checkbox" checked={!groups.length} onChange={() => setGroups([])} /> All categories</label>
              {sidebarGroups.map(([name]) => (
                <label className="filter-option" key={name}><input type="checkbox" checked={groups.includes(name)} onChange={() => toggleGroup(name)} /> {name}</label>
              ))}
            </details>
            <details className="filter-block" open>
              <summary>Budget <span>⌃</span></summary>
              <div className="budget"><button type="button">$ 5</button><button type="button">$ {budget}</button></div>
              <input className="range" type="range" min="5" max="5000" value={budget} onChange={(e) => setBudget(Number(e.target.value))} aria-label="Maximum budget" />
            </details>
            <details className="filter-block" open>
              <summary>Delivery time <span>⌃</span></summary>
              {deliveryOptions.map(([label, d]) => (
                <label className="filter-option" key={label}><input type="radio" name="delivery" checked={delivery === d} onChange={() => setDelivery(d)} /> {label}</label>
              ))}
            </details>
            <details className="filter-block" open>
              <summary>Seller rating <span>⌃</span></summary>
              {ratingOptions.map(([min, on, off]) => (
                <label className="filter-option" key={min}>
                  <input type="radio" name="rating" checked={minRating === min} onChange={() => setMinRating(min)} />{' '}
                  <span className="stars-filter">{on}{off && <i>{off}</i>}</span> {min.toFixed(1)} &amp; up
                </label>
              ))}
            </details>
            <article className="seller-cta">
              <h3>Great work starts with the right freelancer.</h3>
              <p>Post a project and receive offers from top talent.</p>
              <a href="#">Learn about Skillrora →</a>
            </article>
          </aside>

          <section className="results">
            <div className="results-head">
              <p><strong>{count}</strong> services available</p>
              <button type="button">Sort by: <b>Recommended</b>⌄</button>
            </div>
            {results.length === 0 ? (
              <p className="empty">No services match these filters. Try a different keyword or reset all filters.</p>
            ) : (
              <div className="result-grid">
                {results.map((s) => (
                  <article className="card" key={s.id}>
                    <div className="card-image">
                      <img src={img(s.img)} alt={s.alt} />
                      <Heart className="heart" />
                    </div>
                    <div className="card-body">
                      <div className="seller-line"><span className={`avatar ${s.av}`}>{s.ini}</span><p><b>{s.name}</b><small>Top Rated</small></p></div>
                      <h3>{s.to ? <Link to={s.to}>{s.title}</Link> : s.title}</h3>
                      <div className="card-footer"><span>★ {s.rating.toFixed(1)} <i>({s.count})</i></span><strong>Starting at ${s.price}</strong></div>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <nav className="pagination" aria-label="Pagination">
              <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page">‹</button>
              {pages.map((p, i) => p === '…'
                ? <button type="button" key={i} disabled>…</button>
                : <button type="button" key={p} className={p === page ? 'active' : undefined} onClick={() => setPage(p)}>{p}</button>)}
              <button type="button" disabled={page === 24} onClick={() => setPage(page + 1)} aria-label="Next page">›</button>
            </nav>
          </section>
        </section>
      </main>
      <Footer social />
    </div>
  )
}
