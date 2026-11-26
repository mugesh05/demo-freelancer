import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Menu, MessageSquare, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

export default function Header({ active }) {
  const { user, unreadNotifications, setUnreadNotifications, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const navigate = useNavigate()

  const dashboardPath = user?.role === 'client' ? '/client-dashboard' : '/dashboard'
  const cls = (name) => (active === name ? 'active' : undefined)

  useEffect(() => {
    if (!notifOpen || !user) return
    api('/api/notifications').then((d) => {
      setNotifs(d.items || [])
      setUnreadNotifications(d.unread || 0)
    }).catch(() => {})
  }, [notifOpen, user, setUnreadNotifications])

  const markAllRead = async () => {
    await api('/api/notifications/read-all', { method: 'PUT' }).catch(() => {})
    setNotifs((ns) => ns.map((n) => ({ ...n, is_read: 1 })))
    setUnreadNotifications(0)
  }

  const handleLogout = async () => {
    await logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="sk-header">
      <div className="sk-header-inner">
        <Link className="sk-brand" to="/" aria-label="Skillrora home">
          <span className="sk-brand-mark">S</span>
          <span>Skillrora</span>
        </Link>

        <nav className="sk-nav" aria-label="Main navigation">
          <Link className={cls('home')} to="/">Home</Link>
          <Link className={cls('explore')} to="/explore">Explore Services</Link>
          <Link className={cls('projects')} to="/projects">Browse Projects</Link>
          <Link className={cls('talent')} to="/talent">Find Talent</Link>
          {user && <Link className={cls('dashboard')} to={dashboardPath}>Dashboard</Link>}
          {user && <Link className={cls('orders')} to="/orders">Orders</Link>}
        </nav>

        <div className="sk-header-actions">
          {user ? (
            <>
              <Link className="sk-icon-btn sk-desktop-only" to="/messages" aria-label="Messages">
                <MessageSquare size={18} />
              </Link>
              <div className="sk-notif-wrap">
                <button
                  type="button"
                  className="sk-icon-btn"
                  aria-label="Notifications"
                  onClick={() => setNotifOpen((o) => !o)}
                >
                  <Bell size={18} />
                  {unreadNotifications > 0 && <span className="sk-badge-dot">{unreadNotifications}</span>}
                </button>
                {notifOpen && (
                  <div className="sk-notif-popover">
                    <div className="sk-notif-head">
                      <strong>Notifications</strong>
                      <button type="button" className="sk-btn sk-btn-sm sk-btn-outline" onClick={markAllRead}>
                        Mark all read
                      </button>
                    </div>
                    {notifs.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--sk-muted)', margin: '8px 0' }}>No notifications yet.</p>
                    ) : (
                      notifs.slice(0, 6).map((n) => (
                        <Link
                          key={n.id}
                          to={n.link || '/'}
                          className={`sk-notif-item ${!n.is_read ? 'unread' : ''}`}
                          onClick={() => {
                            setNotifOpen(false)
                            if (!n.is_read) api(`/api/notifications/${n.id}/read`, { method: 'PUT' }).catch(() => {})
                          }}
                        >
                          <strong>{n.title}</strong>
                          <span>{n.body}</span>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
              <Link className="sk-user-pill sk-desktop-only" to="/my-profile">
                <span className="sk-avatar" style={{ width: 28, height: 28, background: user.tint || '#dbeafe', fontSize: 11 }}>
                  {user.avatar_url ? <img src={user.avatar_url} alt={user.name} /> : user.initials}
                </span>
                <span>{user.name.split(' ')[0]}</span>
              </Link>
              <button type="button" className="sk-btn sk-btn-outline sk-btn-sm sk-desktop-only" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link className="sk-btn sk-btn-outline sk-btn-sm sk-desktop-only" to="/login">Log in</Link>
              <Link className="sk-btn sk-btn-primary sk-btn-sm sk-desktop-only" to="/signup">Sign up</Link>
            </>
          )}
          <button
            type="button"
            className="sk-mobile-toggle"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div className={`sk-mobile-drawer ${menuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/explore" onClick={() => setMenuOpen(false)}>Explore Services</Link>
        <Link to="/projects" onClick={() => setMenuOpen(false)}>Browse Projects</Link>
        <Link to="/talent" onClick={() => setMenuOpen(false)}>Find Talent</Link>
        {user ? (
          <>
            <Link to={dashboardPath} onClick={() => setMenuOpen(false)}>Dashboard</Link>
            <Link to="/orders" onClick={() => setMenuOpen(false)}>Orders</Link>
            <Link to="/messages" onClick={() => setMenuOpen(false)}>Messages</Link>
            <Link to="/notifications" onClick={() => setMenuOpen(false)}>Notifications {unreadNotifications > 0 ? `(${unreadNotifications})` : ''}</Link>
            <Link to="/my-profile" onClick={() => setMenuOpen(false)}>My Profile</Link>
            <Link to="/payments" onClick={() => setMenuOpen(false)}>Payments</Link>
            <button type="button" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)}>Sign up</Link>
          </>
        )}
      </div>
    </header>
  )
}
