import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

const TABS = [
  ['all', 'All Orders'],
  ['active', 'Active'],
  ['delivered', 'Delivered'],
  ['completed', 'Completed'],
]

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [reviewOrder, setReviewOrder] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [msg, setMsg] = useState({ type: '', text: '' })

  const load = useCallback(() => {
    setLoading(true)
    api('/api/orders')
      .then((d) => setOrders(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    setMsg({ type: '', text: '' })
    try {
      await api(`/api/orders/${id}/status`, { method: 'PUT', body: { status } })
      setMsg({ type: 'success', text: `Order updated to ${status.replace('_', ' ')}.` })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    try {
      await api(`/api/orders/${reviewOrder.id}/review`, { method: 'POST', body: { rating: Number(rating), comment } })
      setMsg({ type: 'success', text: 'Review submitted! Thank you.' })
      setReviewOrder(null)
      setComment('')
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
  }

  const filtered = orders.filter((o) => {
    if (tab === 'all') return true
    if (tab === 'active') return ['requirements', 'in_progress', 'in_revision'].includes(o.status)
    return o.status === tab
  })

  return (
    <div className="page">
      <Header active="orders" />
      <main className="sk-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
          <div>
            <span className="sk-badge blue" style={{ marginBottom: 6 }}>ORDER MANAGEMENT</span>
            <h1 style={{ margin: 0, fontSize: 28 }}>Orders &amp; Milestones</h1>
          </div>
          <Link to="/payments" className="sk-btn sk-btn-outline">View Payment Records</Link>
        </div>

        {msg.text && <div className={`sk-alert ${msg.type}`}>{msg.text}</div>}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {TABS.map(([k, label]) => (
            <button key={k} type="button" className={`sk-btn sk-btn-sm ${tab === k ? 'sk-btn-primary' : 'sk-btn-outline'}`} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="sk-skeleton sk-skeleton-card" />
        ) : filtered.length === 0 ? (
          <div className="sk-empty">
            <h3>No orders in this view</h3>
            <p>{user?.role === 'client' ? 'Explore services or hire a freelancer on a project to get started.' : 'Orders from clients will appear here.'}</p>
            <Link to={user?.role === 'client' ? '/explore' : '/projects'} className="sk-btn sk-btn-primary">
              {user?.role === 'client' ? 'Explore Services' : 'Browse Projects'}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((o) => (
              <div key={o.id} className="sk-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="sk-badge gray">#{o.order_code}</span>
                    <span className={`sk-badge ${o.status === 'completed' ? 'green' : o.status === 'delivered' ? 'blue' : 'amber'}`}>
                      {o.status.replace('_', ' ')}
                    </span>
                  </div>
                  <strong style={{ display: 'block', fontSize: 16, marginBottom: 4 }}>{o.title}</strong>
                  <span style={{ fontSize: 13, color: 'var(--sk-muted)' }}>
                    {user?.role === 'freelancer' ? `Client: ${o.client_name}` : `Freelancer: ${o.freelancer_name}`} · Due {o.due_date} · <strong>${o.amount}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link to="/messages" className="sk-btn sk-btn-outline sk-btn-sm">Message</Link>
                  {user?.role === 'freelancer' && ['requirements', 'in_progress', 'in_revision'].includes(o.status) && (
                    <button type="button" className="sk-btn sk-btn-primary sk-btn-sm" onClick={() => updateStatus(o.id, 'delivered')}>
                      Deliver Work
                    </button>
                  )}
                  {user?.role === 'client' && o.status === 'delivered' && (
                    <>
                      <button type="button" className="sk-btn sk-btn-outline sk-btn-sm" onClick={() => updateStatus(o.id, 'in_revision')}>
                        Request Revision
                      </button>
                      <button type="button" className="sk-btn sk-btn-primary sk-btn-sm" onClick={() => updateStatus(o.id, 'completed')}>
                        Approve &amp; Complete
                      </button>
                    </>
                  )}
                  {user?.role === 'client' && o.status === 'completed' && !o.reviewed_by_me && (
                    <button type="button" className="sk-btn sk-btn-primary sk-btn-sm" onClick={() => setReviewOrder(o)}>
                      Leave Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {reviewOrder && (
          <form className="sk-card" style={{ marginTop: 24, maxWidth: 520 }} onSubmit={submitReview}>
            <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Review #{reviewOrder.order_code}</h2>
            <div className="sk-field">
              <label>Rating (1–5)</label>
              <select className="sk-select" value={rating} onChange={(e) => setRating(e.target.value)}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Stars</option>)}
              </select>
            </div>
            <div className="sk-field">
              <label>Review comment</label>
              <textarea className="sk-textarea" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} required minLength={5} placeholder="Share your experience working together..." />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="sk-btn sk-btn-primary">Submit Review</button>
              <button type="button" className="sk-btn sk-btn-outline" onClick={() => setReviewOrder(null)}>Cancel</button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  )
}
