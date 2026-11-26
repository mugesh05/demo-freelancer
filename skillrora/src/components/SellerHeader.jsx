import { Link } from 'react-router-dom'

export default function SellerHeader({ active }) {
  const c = (n) => (active === n ? 'active' : undefined)
  return (
    <header className="s-header">
      <Link className="s-brand" to="/" aria-label="Skillrora home"><i>S</i>skillora</Link>
      <nav className="s-nav" aria-label="Seller navigation">
        <Link className={c('dashboard')} to="/my-profile">Dashboard</Link>
        <Link className={c('gigs')} to="/my-gigs">My gigs</Link>
        <Link className={c('orders')} to="/orders">Orders</Link>
        <Link className={c('messages')} to="/messages">Messages</Link>
      </nav>
      <div className="s-account">
        <Link className="switch" to="/explore">Switch to buying</Link>
        <span className="bell" aria-hidden="true">🔔</span>
        <Link className="me" to="/my-profile"><b>AM</b>Alex M. <span>⌄</span></Link>
      </div>
    </header>
  )
}

export function SellerFooter() {
  return (
    <footer className="s-footer">
      <span>© 2026 Skillora. All rights reserved.</span>
      <span><a href="#privacy">Privacy Policy</a><a href="#terms">Terms of Service</a></span>
    </footer>
  )
}

export function Avatar({ ini, tint = '#d9e2ee', size = 40, dark }) {
  return <span className="s-av" style={{ width: size, height: size, background: tint, color: dark ? '#fff' : '#33405a', fontSize: Math.round(size * 0.34) }}>{ini}</span>
}
