import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../lib/api.js'

export default function Talent() {
  const [params] = useSearchParams()
  const [draft, setDraft] = useState(params.get('q') || '')
  const [q, setQ] = useState(params.get('q') || '')
  const [experience, setExperience] = useState('')
  const [availability, setAvailability] = useState('')
  const [maxRate, setMaxRate] = useState(150)
  const [minRating, setMinRating] = useState(0)
  const [sort, setSort] = useState('rating')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const qs = new URLSearchParams({
      q, experience, availability, maxRate: String(maxRate), minRating: String(minRating), sort, page: String(page), limit: '8',
    })
    api(`/api/freelancers?${qs.toString()}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [q, experience, availability, maxRate, minRating, sort, page])

  const reset = () => {
    setDraft(''); setQ(''); setExperience(''); setAvailability(''); setMaxRate(150); setMinRating(0); setSort('rating'); setPage(1)
  }

  return (
    <div className="page">
      <Header active="talent" />
      <main className="sk-container">
        <span className="sk-badge blue" style={{ marginBottom: 8 }}>FIND TALENT</span>
        <h1 style={{ margin: '0 0 8px', fontSize: 32 }}>Hire vetted freelancers</h1>
        <p style={{ margin: '0 0 20px', color: 'var(--sk-muted)' }}>Search by skills, hourly rate, experience, and availability.</p>

        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(draft.trim()) }} style={{ display: 'flex', gap: 10, maxWidth: 640, marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--sk-muted)' }} />
            <input className="sk-input" style={{ paddingLeft: 36 }} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Search by skill (React, Figma, SEO) or name..." />
          </div>
          <button type="submit" className="sk-btn sk-btn-primary">Search</button>
        </form>

        <div className="sk-card" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'end', marginBottom: 24, padding: 16 }}>
          <div style={{ minWidth: 150 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Experience</label>
            <select className="sk-select" value={experience} onChange={(e) => { setExperience(e.target.value); setPage(1) }}>
              <option value="">All levels</option>
              <option value="entry">Entry</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div style={{ minWidth: 150 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Availability</label>
            <select className="sk-select" value={availability} onChange={(e) => { setAvailability(e.target.value); setPage(1) }}>
              <option value="">Any status</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
            </select>
          </div>
          <div style={{ minWidth: 170 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Max hourly rate: ${maxRate}/hr</label>
            <input type="range" min="20" max="200" step="5" value={maxRate} onChange={(e) => { setMaxRate(Number(e.target.value)); setPage(1) }} style={{ width: '100%' }} />
          </div>
          <div style={{ minWidth: 150 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Sort by</label>
            <select className="sk-select" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
              <option value="rate_asc">Rate: Low to High</option>
              <option value="rate_desc">Rate: High to Low</option>
            </select>
          </div>
          <button type="button" className="sk-btn sk-btn-outline sk-btn-sm" onClick={reset}>Reset</button>
        </div>

        {loading ? (
          <div className="sk-grid-4">{[1, 2, 3, 4].map((i) => <div key={i} className="sk-skeleton sk-skeleton-card" />)}</div>
        ) : data.items.length === 0 ? (
          <div className="sk-empty">
            <h3>No freelancers match your filters</h3>
            <p>Try adjusting the hourly rate or clearing your search query.</p>
            <button type="button" className="sk-btn sk-btn-primary" onClick={reset}>Clear filters</button>
          </div>
        ) : (
          <div className="sk-grid-4">
            {data.items.map((f) => (
              <Link key={f.id} to={`/freelancers/${f.id}`} className="sk-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="sk-avatar" style={{ width: 48, height: 48, background: f.tint, fontSize: 15 }}>
                    {f.avatar_url ? <img src={f.avatar_url} alt={f.name} /> : f.initials}
                  </span>
                  <div>
                    <strong style={{ display: 'block', fontSize: 15 }}>{f.name}</strong>
                    <span style={{ fontSize: 12, color: 'var(--sk-muted)' }}>{f.title}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className={`sk-badge ${f.availability === 'available' ? 'green' : 'amber'}`}>{f.availability}</span>
                  <span className="sk-badge gray">{f.experience_level}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(f.skills || []).slice(0, 3).map((s) => <span key={s} className="sk-badge blue">{s}</span>)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--sk-border)', fontSize: 13 }}>
                  <span>★ <strong>{Number(f.rating).toFixed(1)}</strong> ({f.review_count})</span>
                  <strong>${f.hourly_rate}/hr</strong>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
