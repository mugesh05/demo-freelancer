import { useState } from 'react'
import { Link } from 'react-router-dom'
import SellerHeader, { SellerFooter } from '../components/SellerHeader.jsx'
import useToast from '../components/useToast.jsx'
import { gigs } from '../data/seller.js'

const TABS = [['active', 'Active'], ['pending', 'Pending review'], ['drafts', 'Drafts'], ['paused', 'Paused']]
const STATUS = { active: 'Active', pending: 'In review', drafts: 'Draft', paused: 'Paused' }

export default function MyGigs() {
  const [tab, setTab] = useState('active')
  const [q, setQ] = useState('')
  const [notify, toast] = useToast()
  const count = (t) => gigs.filter((g) => g.status === t).length
  const list = gigs.filter((g) => g.status === tab && g.title.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="page page-seller">
      <SellerHeader active="gigs" />
      <main className="s-main">
        <div className="s-top">
          <div>
            <span className="eyebrow">YOUR WORK, YOUR WAY</span>
            <h1>My gigs</h1>
            <p>Turn your skills into someone&rsquo;s next great project.</p>
          </div>
          <Link className="s-primary" to="/create-gig">+ Create a new gig</Link>
        </div>

        <div className="stat-grid">
          <div className="stat"><span>Active gigs</span><b>3</b><small>Ready for your next client</small></div>
          <div className="stat"><span>Total impressions</span><b>12,840</b><small className="up">↑ 18.6% this month</small></div>
          <div className="stat"><span>Total clicks</span><b>864</b><small className="up">↑ 12.4% this month</small></div>
          <div className="stat"><span>Gig earnings</span><b>$2,450</b><small className="up">↑ 24.8% this month</small></div>
        </div>

        <div className="tabs-row">
          <div className="tabs">
            {TABS.map(([k, label]) => (
              <button key={k} type="button" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label} ({count(k)})</button>
            ))}
          </div>
          <label className="s-search"><span>⌕</span><input placeholder="Search your gigs" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        </div>

        {list.length === 0 ? (
          <div className="empty">No gigs here yet.</div>
        ) : (
          <div className="gig-grid">
            {list.map((g) => (
              <article className="gcard" key={g.id}>
                <div className="gimg"><img src={g.img} alt={g.title} /><span className={'pill ' + g.status}>{STATUS[g.status]}</span></div>
                <div className="gbody">
                  <small className="cat">{g.cat}</small>
                  <h3>{g.title}</h3>
                  <div className="gprice"><span>Starting at <b>${g.price}</b></span><Link to="/create-gig">Edit gig</Link></div>
                  <div className="gmeta"><span>{g.views} views</span><span>{g.clicks} clicks</span><span>{g.orders} orders</span></div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="banner">
          <div><b>A little refresh can go a long way.</b><p>Keep your gig gallery and descriptions up to date to help the right clients find you.</p></div>
          <button type="button" className="s-ghost" onClick={() => notify('Seller tips are coming soon')}>Explore seller tips</button>
        </div>
      </main>
      <SellerFooter />
      {toast}
    </div>
  )
}
