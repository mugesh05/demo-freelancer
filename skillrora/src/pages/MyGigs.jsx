import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../lib/api.js'

const TABS = [['active', 'Active'], ['pending', 'In Review'], ['draft', 'Drafts'], ['paused', 'Paused']]

export default function MyGigs() {
  const [gigs, setGigs] = useState([])
  const [tab, setTab] = useState('active')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api('/api/gigs?mine=1&limit=50')
      .then((d) => setGigs(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const remove = async (id) => {
    await api(`/api/gigs/${id}`, { method: 'DELETE' }).catch(() => {})
    load()
  }

  const list = gigs.filter((g) => g.status === tab && g.title.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="page">
      <Header active="dashboard" />
      <main className="sk-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
          <div>
            <span className="sk-badge blue" style={{ marginBottom: 6 }}>SERVICE CATALOG</span>
            <h1 style={{ margin: 0, fontSize: 28 }}>My Service Gigs</h1>
          </div>
          <Link className="sk-btn sk-btn-primary" to="/create-gig"><Plus size={16} /> Create New Gig</Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TABS.map(([k, label]) => (
              <button key={k} type="button" className={`sk-btn sk-btn-sm ${tab === k ? 'sk-btn-primary' : 'sk-btn-outline'}`} onClick={() => setTab(k)}>
                {label} ({gigs.filter((g) => g.status === k).length})
              </button>
            ))}
          </div>
          <input className="sk-input" style={{ maxWidth: 260 }} placeholder="Search your gigs..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {loading ? (
          <div className="sk-grid-3">{[1, 2, 3].map((i) => <div key={i} className="sk-skeleton sk-skeleton-card" />)}</div>
        ) : list.length === 0 ? (
          <div className="sk-empty">
            <h3>No gigs in this tab</h3>
            <p>Create a service package so clients can hire you directly.</p>
            <Link to="/create-gig" className="sk-btn sk-btn-primary">Create your first gig</Link>
          </div>
        ) : (
          <div className="sk-grid-3">
            {list.map((g) => (
              <article key={g.id} className="sk-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <img src={g.cover_image} alt={g.title} style={{ width: '100%', height: 170, objectFit: 'cover' }} />
                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span className="sk-badge gray" style={{ marginBottom: 8 }}>{g.category}</span>
                    <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>{g.title}</h3>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--sk-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`sk-crypto-badge ${(g.currency || 'USDT').toLowerCase()}`}>{g.currency || 'USDT'}</span>
                      <strong style={{ fontSize: 15 }}>{g.price}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link to={`/create-gig/${g.id}`} className="sk-btn sk-btn-outline sk-btn-sm">Edit</Link>
                      <button type="button" className="sk-btn sk-btn-danger sk-btn-sm" aria-label="Delete gig" onClick={() => remove(g.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
