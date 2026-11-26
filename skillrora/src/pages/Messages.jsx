import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SellerHeader, { SellerFooter, Avatar } from '../components/SellerHeader.jsx'
import { conversations } from '../data/seller.js'

export default function Messages() {
  const [convs, setConvs] = useState(conversations)
  const [activeId, setActiveId] = useState('daniel')
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState('')
  const endRef = useRef()

  const active = convs.find((c) => c.id === activeId)
  const unreadTotal = convs.reduce((n, c) => n + c.unread, 0)
  const shown = convs.filter((c) => (filter === 'all' || c.unread > 0) && c.name.toLowerCase().includes(q.toLowerCase()))

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }) }, [active.thread.length, activeId])

  const open = (id) => { setActiveId(id); setConvs((cs) => cs.map((c) => (c.id === id ? { ...c, unread: 0 } : c))) }
  const send = (e) => {
    e.preventDefault()
    const t = draft.trim()
    if (!t) return
    setConvs((cs) => cs.map((c) => (c.id === activeId ? { ...c, preview: 'You: ' + t, time: 'Now', thread: [...c.thread, { from: 'me', text: t, time: 'Just now' }] } : c)))
    setDraft('')
  }

  return (
    <div className="page page-seller">
      <SellerHeader active="messages" />
      <main className="s-main">
        <div className="s-top">
          <div>
            <span className="eyebrow">GOOD CONVERSATIONS, GREAT PROJECTS</span>
            <h1>Messages</h1>
            <p>Stay connected. Bring great ideas to life together.</p>
          </div>
          {unreadTotal > 0 && <span className="chip">{unreadTotal} unread messages</span>}
        </div>

        <div className="chat-shell">
          <aside className="chat-list">
            <label className="s-search wide"><span>⌕</span><input placeholder="Search messages" value={q} onChange={(e) => setQ(e.target.value)} /></label>
            <div className="mini-tabs">
              <button type="button" className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>All messages</button>
              <button type="button" className={filter === 'unread' ? 'on' : ''} onClick={() => setFilter('unread')}>Unread</button>
            </div>
            <div className="conv-items">
              {shown.map((c) => (
                <button type="button" key={c.id} className={'conv' + (c.id === activeId ? ' on' : '')} onClick={() => open(c.id)}>
                  <Avatar ini={c.ini} tint={c.tint} size={46} dark={c.team} />
                  <span className="cinfo">
                    <span className="crow"><b>{c.name}</b><small>{c.time}</small></span>
                    <span className="cprev">{c.preview}</span>
                    <small>{c.sub}</small>
                  </span>
                  {c.unread > 0 && <i className="count">{c.unread}</i>}
                </button>
              ))}
              {shown.length === 0 && <div className="empty">No conversations found.</div>}
            </div>
            <div className="trust"><b>Great work starts with trust.</b><p>Keep your conversations and payments on Skillora to stay protected.</p></div>
          </aside>

          <section className="chat-main">
            <div className="chat-head">
              <Avatar ini={active.ini} tint={active.tint} size={44} dark={active.team} />
              <div><b>{active.name}</b><small><i className="dot" />{active.status}</small></div>
              <span className="icons">⌕&nbsp;&nbsp;⋯</span>
            </div>
            <div className="chat-body">
              {active.order && (
                <div className="order-strip">
                  <div><b>{active.order.title}</b><small>{active.order.meta}</small></div>
                  <Link to="/orders">View order →</Link>
                </div>
              )}
              <div className="day">Today, November 26</div>
              {active.thread.map((m, i) => (
                <div key={i} className={'msg ' + m.from}>
                  {m.from === 'file' ? (
                    <div className="file"><span>PDF</span><div><b>{m.name}</b><small>{m.size}</small></div></div>
                  ) : <div className="bubble">{m.text}</div>}
                  {m.time && <small className="mtime">{m.time}</small>}
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <form className="composer" onSubmit={send}>
              <input placeholder="Write a message..." value={draft} onChange={(e) => setDraft(e.target.value)} />
              <span className="cicons">📎 ☺</span>
              <button type="submit" aria-label="Send message">➤</button>
            </form>
          </section>
        </div>
      </main>
      <SellerFooter />
    </div>
  )
}
