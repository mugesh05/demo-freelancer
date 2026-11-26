import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

const CATS = ['All categories', 'Web Development', 'UI/UX Design', 'Graphic Design', 'Video Editing', 'Digital Marketing', 'AI & Automation']

export default function Projects() {
  const [params] = useSearchParams()
  const { user } = useAuth()
  const [draft, setDraft] = useState(params.get('q') || '')
  const [q, setQ] = useState(params.get('q') || '')
  const [cat, setCat] = useState('All categories')
  const [experience, setExperience] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const qs = new URLSearchParams({ q, cat, experience, sort, page: String(page), limit: '6' })
    api(`/api/projects?${qs.toString()}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [q, cat, experience, sort, page])

  return (
    <div className="page">
      <Header active="projects" />
      <main className="sk-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div>
            <span className="sk-badge blue" style={{ marginBottom: 8 }}>OPEN PROJECTS</span>
            <h1 style={{ margin: '0 0 8px', fontSize: 32 }}>Browse client projects</h1>
            <p style={{ margin: 0, color: 'var(--sk-muted)' }}>Find briefs matching your skills and submit a proposal.</p>
          </div>
          {user?.role === 'client' && (
            <Link to="/client-dashboard?post=1" className="sk-btn sk-btn-primary"><Plus size={16} /> Post a Project</Link>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(draft.trim()) }} style={{ display: 'flex', gap: 10, maxWidth: 720, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--sk-muted)' }} />
            <input className="sk-input" style={{ paddingLeft: 36 }} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Search project titles or required skills..." />
          </div>
          <select className="sk-select" style={{ width: 'auto' }} value={cat} onChange={(e) => { setCat(e.target.value); setPage(1) }}>
            {CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="sk-select" style={{ width: 'auto' }} value={experience} onChange={(e) => { setExperience(e.target.value); setPage(1) }}>
            <option value="">Any level</option>
            <option value="entry">Entry</option>
            <option value="intermediate">Intermediate</option>
            <option value="expert">Expert</option>
          </select>
          <select className="sk-select" style={{ width: 'auto' }} value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}>
            <option value="newest">Newest</option>
            <option value="budget_desc">Highest Budget</option>
          </select>
          <button type="submit" className="sk-btn sk-btn-primary">Search</button>
        </form>

        {loading ? (
          <div className="sk-grid-2">{[1, 2, 3, 4].map((i) => <div key={i} className="sk-skeleton sk-skeleton-card" />)}</div>
        ) : data.items.length === 0 ? (
          <div className="sk-empty">
            <h3>No open projects match your filters</h3>
            <p>Try clearing your search or checking back soon.</p>
            <button type="button" className="sk-btn sk-btn-primary" onClick={() => { setDraft(''); setQ(''); setCat('All categories'); setExperience('') }}>Reset filters</button>
          </div>
        ) : (
          <div className="sk-grid-2">
            {data.items.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="sk-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span className="sk-badge blue">{p.category}</span>
                  <strong style={{ color: 'var(--sk-success)', fontSize: 14 }}>${p.budget_min} – ${p.budget_max}</strong>
                </div>
                <h2 style={{ margin: 0, fontSize: 18 }}>{p.title}</h2>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--sk-muted)', lineHeight: 1.6 }}>{p.description.slice(0, 150)}...</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(p.skills || []).map((s) => <span key={s} className="sk-badge gray">{s}</span>)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--sk-muted)', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--sk-border)' }}>
                  <span>{p.client_name} · {p.experience_level}</span>
                  <span>{p.application_count} proposals · Due {p.deadline}</span>
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
