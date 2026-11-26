import { useState } from 'react'
import { Link } from 'react-router-dom'
import SellerHeader, { SellerFooter } from '../components/SellerHeader.jsx'
import useToast from '../components/useToast.jsx'
import { orders } from '../data/seller.js'

const PER = 6
const TABS = [['all', 'All orders (26)'], ['active', 'Active (4)'], ['delivered', 'Delivered (2)'], ['completed', 'Completed (20)'], ['cancelled', 'Cancelled (0)']]
const KIND = { 'In progress': 'blue', 'In revision': 'amber', Requirements: 'blue', Delivered: 'green', Completed: 'green' }
const ACTIVE = ['In progress', 'In revision', 'Requirements']

export default function Orders() {
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [notify, toast] = useToast()

  const filtered = orders.filter((o) =>
    tab === 'all' ? true : tab === 'active' ? ACTIVE.includes(o.status) : tab === 'delivered' ? o.status === 'Delivered' : tab === 'completed' ? o.status === 'Completed' : false)
  const pages = Math.max(1, Math.ceil(filtered.length / PER))
  const rows = filtered.slice((page - 1) * PER, page * PER)
  const total = tab === 'all' ? 26 : filtered.length
  const choose = (k) => { setTab(k); setPage(1) }

  return (
    <div className="page page-seller">
      <SellerHeader active="orders" />
      <main className="s-main">
        <div className="s-top">
          <div>
            <span className="eyebrow">GREAT WORK IN PROGRESS</span>
            <h1>Orders</h1>
            <p>Every project, every milestone. All in one place.</p>
          </div>
          <button type="button" className="s-ghost" onClick={() => notify('Month picker is coming soon')}>November 2026 ▾</button>
        </div>

        <div className="stat-grid">
          <div className="stat"><span>Active orders</span><b>4</b><small>Let&rsquo;s keep great work moving</small></div>
          <div className="stat"><span>Awaiting approval</span><b>2</b><small>Your work is with the client</small></div>
          <div className="stat"><span>Completed orders</span><b>20</b><small>Ideas turned into outcomes</small></div>
          <div className="stat"><span>Earned this month</span><b>$2,450</b><small className="up">↑ 24.8% from last month</small></div>
        </div>

        <div className="tabs-row">
          <div className="tabs">
            {TABS.map(([k, label]) => <button key={k} type="button" className={tab === k ? 'on' : ''} onClick={() => choose(k)}>{label}</button>)}
          </div>
          <button type="button" className="s-ghost" onClick={() => notify('Filters are coming soon')}>Filter orders</button>
        </div>

        <div className="table">
          <div className="trow thead"><span>PROJECT</span><span>CLIENT</span><span>DUE DATE</span><span>TOTAL</span><span>STATUS</span><span /></div>
          {rows.length === 0 && <div className="empty">No orders in this view.</div>}
          {rows.map((o) => (
            <div className="trow" key={o.id}>
              <span className="proj"><img src={o.img} alt="" /><span><b>{o.title}</b><small>#{o.id}</small></span></span>
              <span>{o.client}</span>
              <span className="muted">{o.due}</span>
              <span><b>${o.total}</b></span>
              <span><i className={'badge ' + KIND[o.status]}>{o.status}</i></span>
              <span><Link className="link" to="/messages">View order</Link></span>
            </div>
          ))}
        </div>

        <div className="pager-row">
          <small>Showing {rows.length} of {total} orders</small>
          <div className="pager">
            <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
            {Array.from({ length: pages }, (_, i) => <button key={i} type="button" className={page === i + 1 ? 'on' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>)}
            <button type="button" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      </main>
      <SellerFooter />
      {toast}
    </div>
  )
}
