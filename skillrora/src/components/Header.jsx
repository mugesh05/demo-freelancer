import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Globe, Menu, MessageSquare, Shield, Wallet, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useWallet } from '../context/WalletContext.jsx'
import { api } from '../lib/api.js'

export default function Header({ active }) {
  const { user, unreadNotifications, setUnreadNotifications, logout } = useAuth()
  const { lang, setLang, t, languages } = useLanguage()
  const { account, shortAccount, isConnected, connectWeb3, connectManual, switchNetwork, network, networks, disconnect } = useWallet()
  
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [manualAddr, setManualAddr] = useState('')
  const [selectedNet, setSelectedNet] = useState(network)
  const [notifs, setNotifs] = useState([])
  const navigate = useNavigate()

  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'client' ? '/client-dashboard' : '/dashboard'
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

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (connectManual(manualAddr, selectedNet)) {
      setWalletModalOpen(false)
      setManualAddr('')
    }
  }

  return (
    <header className="sk-header">
      <div className="sk-header-inner">
        <Link className="sk-brand" to="/" aria-label="Skillrora home">
          <span className="sk-brand-mark">S</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ lineHeight: 1.1 }}>Skillrora</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--sk-primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {t('brandTag')}
            </span>
          </div>
        </Link>

        <nav className="sk-nav" aria-label="Main navigation">
          <Link className={cls('home')} to="/">{t('home')}</Link>
          <Link className={cls('explore')} to="/explore">{t('exploreServices')}</Link>
          <Link className={cls('projects')} to="/projects">{t('browseProjects')}</Link>
          <Link className={cls('talent')} to="/talent">{t('findTalent')}</Link>
          {user && <Link className={cls('dashboard')} to={dashboardPath}>{t('dashboard')}</Link>}
          {user && <Link className={cls('orders')} to="/orders">{t('orders')}</Link>}
          {user?.role === 'admin' && (
            <Link className={cls('admin')} to="/admin" style={{ color: '#dc2626', fontWeight: 800 }}>
              <Shield size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              {t('adminPanel')}
            </Link>
          )}
        </nav>

        <div className="sk-header-actions">
          {/* Language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={16} color="var(--sk-muted)" />
            <select
              className="sk-lang-select"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Select Language"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native} ({l.name})
                </option>
              ))}
            </select>
          </div>

          {/* Web3 Crypto Wallet Button */}
          <button
            type="button"
            className={`sk-wallet-btn ${isConnected ? 'connected' : ''}`}
            onClick={() => setWalletModalOpen(true)}
            title={isConnected ? `Connected to ${network}: ${account}` : 'Connect Web3 Crypto Wallet'}
          >
            <Wallet size={15} />
            {isConnected ? (
              <>
                <span className="sk-wallet-dot" />
                <span>{shortAccount}</span>
                <span style={{ fontSize: 10, opacity: 0.8, background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 6 }}>
                  {network}
                </span>
              </>
            ) : (
              <span>{t('connectWallet')}</span>
            )}
          </button>

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
                      <strong>{t('notifications')}</strong>
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
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link className="sk-btn sk-btn-outline sk-btn-sm sk-desktop-only" to="/login">{t('login')}</Link>
              <Link className="sk-btn sk-btn-primary sk-btn-sm sk-desktop-only" to="/signup">{t('signup')}</Link>
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

      {/* Mobile Drawer */}
      <div className={`sk-mobile-drawer ${menuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>{t('home')}</Link>
        <Link to="/explore" onClick={() => setMenuOpen(false)}>{t('exploreServices')}</Link>
        <Link to="/projects" onClick={() => setMenuOpen(false)}>{t('browseProjects')}</Link>
        <Link to="/talent" onClick={() => setMenuOpen(false)}>{t('findTalent')}</Link>
        {user ? (
          <>
            <Link to={dashboardPath} onClick={() => setMenuOpen(false)}>{t('dashboard')}</Link>
            <Link to="/orders" onClick={() => setMenuOpen(false)}>{t('orders')}</Link>
            <Link to="/messages" onClick={() => setMenuOpen(false)}>{t('messages')}</Link>
            <Link to="/notifications" onClick={() => setMenuOpen(false)}>{t('notifications')} {unreadNotifications > 0 ? `(${unreadNotifications})` : ''}</Link>
            <Link to="/my-profile" onClick={() => setMenuOpen(false)}>{t('myProfile')}</Link>
            <Link to="/payments" onClick={() => setMenuOpen(false)}>{t('payments')}</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ color: '#dc2626', fontWeight: 800 }}>
                {t('adminPanel')}
              </Link>
            )}
            <button type="button" onClick={handleLogout}>{t('logout')}</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)}>{t('login')}</Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)}>{t('signup')}</Link>
          </>
        )}
      </div>

      {/* Web3 Wallet Modal */}
      {walletModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 16
        }}>
          <div className="sk-card" style={{ maxWidth: 460, width: '100%', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wallet size={20} color="var(--sk-primary)" />
                <h2 style={{ margin: 0, fontSize: 18 }}>Crypto Wallet Connection</h2>
              </div>
              <button type="button" className="sk-icon-btn" onClick={() => setWalletModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {isConnected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: 14, background: 'var(--sk-bg)', borderRadius: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--sk-muted)', display: 'block', marginBottom: 4 }}>Connected Address:</span>
                  <code style={{ fontSize: 13, wordBreak: 'break-all', display: 'block', fontWeight: 700 }}>{account}</code>
                </div>

                <div className="sk-field">
                  <label>Active Blockchain Network</label>
                  <select className="sk-select" value={network} onChange={(e) => switchNetwork(e.target.value)}>
                    {networks.map((n) => (
                      <option key={n.id} value={n.id}>{n.name} ({n.symbol})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button type="button" className="sk-btn sk-btn-outline sk-btn-sm" onClick={disconnect} style={{ flex: 1 }}>
                    Disconnect Wallet
                  </button>
                  <button type="button" className="sk-btn sk-btn-primary sk-btn-sm" onClick={() => setWalletModalOpen(false)} style={{ flex: 1 }}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--sk-muted)', lineHeight: 1.5 }}>
                  Connect your Web3 wallet (MetaMask / Brave / EIP-1193) or enter your testnet wallet address for smart contract escrow settlement.
                </p>

                <button
                  type="button"
                  className="sk-btn sk-btn-primary"
                  onClick={async () => {
                    await connectWeb3()
                    setWalletModalOpen(false)
                  }}
                  style={{ width: '100%', padding: '12px 16px' }}
                >
                  <Wallet size={16} /> Connect with Web3 Browser Wallet
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--sk-border)' }} />
                  <span style={{ fontSize: 12, color: 'var(--sk-muted)', fontWeight: 700 }}>OR ENTER TESTNET ADDRESS</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--sk-border)' }} />
                </div>

                <form onSubmit={handleManualSubmit}>
                  <div className="sk-field">
                    <label>Network</label>
                    <select className="sk-select" value={selectedNet} onChange={(e) => setSelectedNet(e.target.value)}>
                      {networks.map((n) => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sk-field">
                    <label>Public Wallet Address</label>
                    <input
                      className="sk-input"
                      placeholder="0x... or tb1q..."
                      value={manualAddr}
                      onChange={(e) => setManualAddr(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="sk-btn sk-btn-outline" style={{ width: '100%' }}>
                    Save &amp; Connect Address
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
