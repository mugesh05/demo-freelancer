import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, ShieldCheck, Filter } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { CATEGORIES } from '../data/categories.js'
import { api } from '../lib/api.js'

const CRYPTO_CURRENCIES = ['All', 'USDT', 'USDC', 'ETH', 'BTC']

export default function Projects() {
  const [params] = useSearchParams()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [draft, setDraft] = useState(params.get('q') || '')
  const [q, setQ] = useState(params.get('q') || '')
  const [cat, setCat] = useState(params.get('cat') || 'All categories')
  const [cryptoCurrency, setCryptoCurrency] = useState('All')
  const [experience, setExperience] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const qs = new URLSearchParams({
      q,
      cat: cat === 'All categories' ? '' : cat,
      experience,
      sort,
      page: String(page),
      limit: '8',
    })
    api(`/api/projects?${qs.toString()}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [q, cat, experience, sort, page])

  const filteredItems = (data.items || []).filter((p) => {
    if (cryptoCurrency === 'All') return true
    return (p.currency || 'USDT').toUpperCase() === cryptoCurrency.toUpperCase()
  })

  return (
    <div className="page">
      <Header active="projects" />
      <main className="sk-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span className="sk-badge blue">CRYPTO JOB BOARD</span>
              <span className="sk-escrow-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={13} /> Escrow Backed
              </span>
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: 32 }}>Browse client crypto jobs</h1>
            <p style={{ margin: 0, color: 'var(--sk-muted)' }}>Find global briefs with funded crypto budgets. Submit proposals and get paid in USDT, USDC, ETH, or BTC.</p>
          </div>
          {user?.role === 'client' && (
            <Link to="/client-dashboard?post=1" className="sk-btn sk-btn-primary">
              <Plus size={16} /> Post a Crypto Job
            </Link>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="sk-card" style={{ padding: 16, marginBottom: 24 }}>
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(draft.trim()) }} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--sk-muted)' }} />
              <input className="sk-input" style={{ paddingLeft: 36 }} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Search job titles or required skills (Solidity, React, AI)..." />
            </div>
            <select className="sk-select" style={{ width: 'auto', minWidth: 180 }} value={cat} onChange={(e) => { setCat(e.target.value); setPage(1) }}>
              <option value="All categories">All 15 Categories</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <button type="submit" className="sk-btn sk-btn-primary">Search</button>
          </form>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', fontSize: 13, paddingTop: 10, borderTop: '1px solid var(--sk-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} color="var(--sk-muted)" />
              <span style={{ fontWeight: 600 }}>Crypto Currency:</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {CRYPTO_CURRENCIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`sk-btn sk-btn-sm ${cryptoCurrency === c ? 'sk-btn-primary' : 'sk-btn-outline'}`}
                    style={{ padding: '3px 9px', fontSize: 12 }}
                    onClick={() => setCryptoCurrency(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select className="sk-select" style={{ width: 'auto', padding: '4px 10px', fontSize: 12 }} value={experience} onChange={(e) => { setExperience(e.target.value); setPage(1) }}>
                <option value="">Any experience</option>
                <option value="entry">Entry Level</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
              <select className="sk-select" style={{ width: 'auto', padding: '4px 10px', fontSize: 12 }} value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}>
                <option value="newest">Newest First</option>
                <option value="budget_desc">Highest Crypto Budget</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="sk-grid-2">{[1, 2, 3, 4].map((i) => <div key={i} className="sk-skeleton sk-skeleton-card" />)}</div>
        ) : filteredItems.length === 0 ? (
          <div className="sk-empty">
            <h3>No open crypto jobs match your filters</h3>
            <p>Try clearing your search or switching to another cryptocurrency filter.</p>
            <button type="button" className="sk-btn sk-btn-primary" onClick={() => { setDraft(''); setQ(''); setCat('All categories'); setCryptoCurrency('All'); setExperience('') }}>
              Reset filters
            </button>
          </div>
        ) : (
          <div className="sk-grid-2">
            {filteredItems.map((p) => {
              const curr = p.currency || 'USDT'
              return (
                <Link key={p.id} to={`/projects/${p.id}`} className="sk-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, transition: 'transform 0.15s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className="sk-badge blue">{p.category}</span>
                      <span className={`sk-crypto-badge ${curr.toLowerCase()}`}>{curr}</span>
                    </div>
                    <strong style={{ color: 'var(--sk-ink)', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {p.budget_min} – {p.budget_max} {curr}
                    </strong>
                  </div>
                  <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.3 }}>{p.title}</h2>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--sk-muted)', lineHeight: 1.6 }}>{p.description.slice(0, 160)}...</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(p.skills || []).map((s) => <span key={s} className="sk-badge gray">{s}</span>)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--sk-muted)', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--sk-border)' }}>
                    <span>{p.client_name} · <strong style={{ color: 'var(--sk-ink-2)' }}>{p.experience_level}</strong></span>
                    <span>{p.application_count} proposals · Due {p.deadline}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
