import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

const TYPE_COLORS = {
  message: 'blue',
  application: 'green',
  order: 'amber',
  review: 'blue',
  hire: 'green',
}

export default function Notifications() {
  const { setUnreadNotifications } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    api('/api/notifications')
      .then((d) => {
        setItems(d.items || [])
        setUnreadNotifications(d.unread || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [setUnreadNotifications])

  useEffect(() => { load() }, [load])

  const markAllRead = async () => {
    await api('/api/notifications/read-all', { method: 'PUT' }).catch(() => {})
    setItems((ns) => ns.map((n) => ({ ...n, is_read: 1 })))
    setUnreadNotifications(0)
  }

  const markRead = async (id) => {
    await api(`/api/notifications/${id}/read`, { method: 'PUT' }).catch(() => {})
    setItems((ns) => ns.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)))
    setUnreadNotifications((u) => Math.max(0, u - 1))
  }

  const filtered = filter === 'unread' ? items.filter((n) => !n.is_read) : items
  const unreadCount = items.filter((n) => !n.is_read).length

  return (
    <div className="page">
      <Header />
      <main className="sk-container" style={{ maxWidth: 760 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
          <div>
            <span className="sk-badge blue" style={{ marginBottom: 6 }}>
              <Bell size={13} /> NOTIFICATION CENTER
            </span>
            <h1 style={{ margin: 0, fontSize: 28 }}>Notifications</h1>
            {unreadCount > 0 && (
              <p style={{ margin: '4px 0 0', color: 'var(--sk-muted)', fontSize: 14 }}>
                You have <strong>{unreadCount}</strong> unread notification{unreadCount !== 1 ? 's' : ''}.
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button type="button" className="sk-btn sk-btn-outline" onClick={markAllRead}>
              <CheckCheck size={15} /> Mark all as read
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button type="button" className={`sk-btn sk-btn-sm ${filter === 'all' ? 'sk-btn-primary' : 'sk-btn-outline'}`} onClick={() => setFilter('all')}>
            All ({items.length})
          </button>
          <button type="button" className={`sk-btn sk-btn-sm ${filter === 'unread' ? 'sk-btn-primary' : 'sk-btn-outline'}`} onClick={() => setFilter('unread')}>
            Unread ({unreadCount})
          </button>
        </div>

        {loading ? (
          <div className="sk-skeleton sk-skeleton-card" />
        ) : filtered.length === 0 ? (
          <div className="sk-empty">
            <Bell size={36} style={{ color: 'var(--sk-muted)', marginBottom: 12 }} />
            <h3>{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</h3>
            <p>Activity on your projects, orders, and messages will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((n) => (
              <Link
                key={n.id}
                to={n.link || '/'}
                onClick={() => { if (!n.is_read) markRead(n.id) }}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="sk-card"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    padding: 16,
                    background: !n.is_read ? 'var(--sk-primary-soft)' : 'var(--sk-surface)',
                    borderLeft: !n.is_read ? '3px solid var(--sk-primary)' : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: !n.is_read ? 'var(--sk-primary)' : 'var(--sk-border)',
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                    color: !n.is_read ? '#fff' : 'var(--sk-muted)',
                  }}>
                    <Bell size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 14 }}>{n.title}</strong>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className={`sk-badge ${TYPE_COLORS[n.type] || 'gray'}`} style={{ fontSize: 11, textTransform: 'uppercase' }}>{n.type}</span>
                        {!n.is_read && <span className="sk-badge blue" style={{ fontSize: 11 }}>New</span>}
                      </div>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--sk-muted)', lineHeight: 1.5 }}>{n.body}</p>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--sk-muted)', marginTop: 6 }}>{n.created_at}</span>
                  </div>
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
